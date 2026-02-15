import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Command } from '../../entities/command.entity';
import { CommandProgress } from '../../entities/command-progress.entity';
import { COMMAND_STATUS_FINAL, createEnvelope } from '@remoteos/shared';
import type { CommandStatus, ProgressStatus, CommandMessage } from '@remoteos/shared';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(
    @InjectRepository(Command) private readonly cmdRepo: Repository<Command>,
    @InjectRepository(CommandProgress) private readonly progressRepo: Repository<CommandProgress>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: {
    session_id: string;
    user_id: string;
    pc_device_id: string;
    action: string;
    params: Record<string, unknown>;
    timeout_ms?: number;
    idempotency_key?: string;
    requires_confirm?: boolean;
    confirm_policy?: string;
    concurrency_scope?: string;
    project_key?: string;
    max_retries?: number;
  }): Promise<Command> {
    const idempotencyKey = data.idempotency_key || `${data.action}-${Date.now()}`;

    const existing = await this.cmdRepo.findOne({
      where: { session_id: data.session_id, idempotency_key: idempotencyKey },
    });
    if (existing) {
      this.logger.warn(`Duplicate idempotency_key: ${idempotencyKey}`);
      return existing;
    }

    const cmd = this.cmdRepo.create({
      ...data,
      idempotency_key: idempotencyKey,
      status: 'pending',
    });
    const saved = await this.cmdRepo.save(cmd);

    await this.auditService.log({
      user_id: data.user_id,
      session_id: data.session_id,
      pc_id: data.pc_device_id,
      command_id: saved.id,
      action: `command.created.${data.action}`,
    });

    return saved;
  }

  async updateStatus(commandId: string, status: string): Promise<Command> {
    const cmd = await this.findById(commandId);

    if (COMMAND_STATUS_FINAL.has(cmd.status as CommandStatus)) {
      throw new ConflictException(`Command ${commandId} already in final state: ${cmd.status}`);
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'running' && !cmd.started_at) {
      updates.started_at = new Date();
    }
    if (COMMAND_STATUS_FINAL.has(status as CommandStatus)) {
      updates.completed_at = new Date();
    }

    await this.cmdRepo.update(commandId, updates as any);
    return this.findById(commandId);
  }

  async addProgress(commandId: string, data: {
    status: string;
    step?: number;
    total_steps?: number;
    percent?: number;
    message?: string;
    output_chunk?: string;
    chunk_index?: number;
    chunk_final?: boolean;
  }): Promise<CommandProgress> {
    const progress = this.progressRepo.create({ command_id: commandId, ...data });
    return this.progressRepo.save(progress);
  }

  async confirm(commandId: string, deviceId: string, approved: boolean): Promise<Command> {
    const cmd = await this.findById(commandId);
    if (cmd.status !== 'awaiting_confirm') {
      throw new ConflictException(`Command ${commandId} not awaiting confirmation`);
    }

    const newStatus = approved ? 'sent' : 'cancelled';
    await this.cmdRepo.update(commandId, {
      status: newStatus,
      confirmed_at: new Date(),
      confirmed_by_device_id: deviceId,
    });

    await this.auditService.log({
      user_id: cmd.user_id,
      session_id: cmd.session_id,
      command_id: commandId,
      device_id: deviceId,
      action: approved ? 'command.confirmed' : 'command.denied',
    });

    return this.findById(commandId);
  }

  async cancel(commandId: string, userId: string): Promise<Command> {
    const cmd = await this.findById(commandId);
    if (COMMAND_STATUS_FINAL.has(cmd.status as CommandStatus)) {
      throw new ConflictException(`Command ${commandId} already finished`);
    }

    await this.cmdRepo.update(commandId, {
      status: 'cancelled',
      completed_at: new Date(),
    });

    await this.auditService.log({
      user_id: userId,
      session_id: cmd.session_id,
      command_id: commandId,
      action: 'command.cancelled',
    });

    return this.findById(commandId);
  }

  async findById(id: string): Promise<Command> {
    const cmd = await this.cmdRepo.findOne({ where: { id } });
    if (!cmd) throw new NotFoundException(`Command ${id} not found`);
    return cmd;
  }

  async findBySession(sessionId: string): Promise<Command[]> {
    return this.cmdRepo.find({
      where: { session_id: sessionId },
      order: { queued_at: 'DESC' },
    });
  }

  async getProgress(commandId: string): Promise<CommandProgress[]> {
    return this.progressRepo.find({
      where: { command_id: commandId },
      order: { created_at: 'ASC' },
    });
  }

  buildCommandMessage(cmd: Command): CommandMessage {
    const envelope = createEnvelope('server', 'agent');
    return {
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
  }
}
