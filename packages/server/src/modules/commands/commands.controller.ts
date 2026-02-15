import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentGateway } from '../gateway/agent.gateway';
import { createEnvelope } from '@remoteos/shared';
import type { CommandMessage } from '@remoteos/shared';

@UseGuards(JwtAuthGuard)
@Controller('commands')
export class CommandsController {
  constructor(
    private readonly commandsService: CommandsService,
    private readonly agentGateway: AgentGateway,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() body: {
    session_id: string;
    pc_device_id: string;
    action: string;
    params: Record<string, unknown>;
    timeout_ms?: number;
    idempotency_key?: string;
    requires_confirm?: boolean;
  }) {
    const cmd = await this.commandsService.create({ ...body, user_id: req.user.id });

    const envelope = createEnvelope('server', 'agent');
    const message: CommandMessage = {
      ...envelope,
      type: 'command',
      id: cmd.id,
      session_id: cmd.session_id,
      action: cmd.action,
      params: cmd.params,
      timeout_ms: cmd.timeout_ms,
      idempotency_key: cmd.idempotency_key,
      requires_confirm: cmd.requires_confirm,
    };

    if (!cmd.requires_confirm) {
      const sent = this.agentGateway.sendToAgent(cmd.pc_device_id, message);
      if (!sent) {
        await this.commandsService.updateStatus(cmd.id, 'error');
        const updated = await this.commandsService.findById(cmd.id);
        return { ...updated, _warning: 'Agent offline, command could not be delivered' };
      }
    }

    return cmd;
  }

  @Get('session/:sessionId')
  async listBySession(@Request() req: any, @Param('sessionId') sessionId: string) {
    const commands = await this.commandsService.findBySession(sessionId);
    return commands.filter((c) => c.user_id === req.user.id);
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const cmd = await this.commandsService.findById(id);
    if (cmd.user_id !== req.user.id) throw new ForbiddenException('Not your command');
    return cmd;
  }

  @Get(':id/progress')
  async getProgress(@Request() req: any, @Param('id') id: string) {
    const cmd = await this.commandsService.findById(id);
    if (cmd.user_id !== req.user.id) throw new ForbiddenException('Not your command');
    return this.commandsService.getProgress(id);
  }

  @Patch(':id/confirm')
  async confirm(@Request() req: any, @Param('id') id: string, @Body() body: { device_id: string; approved: boolean }) {
    const existing = await this.commandsService.findById(id);
    if (existing.user_id !== req.user.id) throw new ForbiddenException('Not your command');

    const cmd = await this.commandsService.confirm(id, body.device_id, body.approved);

    if (body.approved) {
      const envelope = createEnvelope('server', 'agent');
      const message: CommandMessage = {
        ...envelope,
        type: 'command',
        id: cmd.id,
        session_id: cmd.session_id,
        action: cmd.action,
        params: cmd.params,
        timeout_ms: cmd.timeout_ms,
        idempotency_key: cmd.idempotency_key,
      };
      this.agentGateway.sendToAgent(cmd.pc_device_id, message);
    }

    return cmd;
  }

  @Patch(':id/cancel')
  async cancel(@Request() req: any, @Param('id') id: string) {
    const existing = await this.commandsService.findById(id);
    if (existing.user_id !== req.user.id) throw new ForbiddenException('Not your command');
    return this.commandsService.cancel(id, req.user.id);
  }
}
