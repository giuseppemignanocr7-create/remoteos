import { Injectable, Inject, forwardRef, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Macro } from '../../entities/macro.entity';
import { MacroRun } from '../../entities/macro-run.entity';
import { validateMacroDefinition } from '@remoteos/shared';
import { CommandsService } from '../commands/commands.service';
import { AgentGateway } from '../gateway/agent.gateway';

@Injectable()
export class MacrosService {
  private readonly logger = new Logger(MacrosService.name);

  constructor(
    @InjectRepository(Macro) private readonly macroRepo: Repository<Macro>,
    @InjectRepository(MacroRun) private readonly runRepo: Repository<MacroRun>,
    private readonly commandsService: CommandsService,
    @Inject(forwardRef(() => AgentGateway)) private readonly agentGateway: AgentGateway,
  ) {}

  async create(userId: string, definition: Record<string, unknown>): Promise<Macro> {
    const validation = validateMacroDefinition(definition);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid macro: ${validation.errors.join('; ')}`);
    }

    const macro = this.macroRepo.create({
      user_id: userId,
      name: definition.name as string,
      description: (definition.description as string) || null,
      version: (definition.version as string) || '1.0.0',
      steps: (definition.steps as unknown[]) || [],
      requires_confirm: (definition.requires_confirm as boolean) || false,
      is_active: (definition.is_active as boolean) ?? true,
      scope: (definition.owner_scope as string) || 'private',
    });
    return this.macroRepo.save(macro);
  }

  async findByUser(userId: string): Promise<Macro[]> {
    return this.macroRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<Macro> {
    const macro = await this.macroRepo.findOne({ where: { id } });
    if (!macro) throw new NotFoundException(`Macro ${id} not found`);
    return macro;
  }

  async execute(macroId: string, userId: string, sessionId: string, pcDeviceId: string, params: Record<string, unknown> = {}): Promise<MacroRun> {
    const macro = await this.findById(macroId);
    if (!macro.is_active) throw new BadRequestException('Macro is not active');

    const run = this.runRepo.create({
      macro_id: macroId,
      user_id: userId,
      session_id: sessionId,
      trigger_source: 'manual',
      status: 'running',
      params,
    });
    const savedRun = await this.runRepo.save(run);

    this.executeSteps(macro, savedRun, userId, sessionId, pcDeviceId, params).catch((err) => {
      this.logger.error(`Macro run ${savedRun.id} failed: ${err.message}`);
    });

    return savedRun;
  }

  private async executeSteps(
    macro: Macro,
    run: MacroRun,
    userId: string,
    sessionId: string,
    pcDeviceId: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    const steps = macro.steps as Array<{ action: string; params?: Record<string, unknown>; requires_confirm?: boolean }>;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const cmd = await this.commandsService.create({
          session_id: sessionId,
          user_id: userId,
          pc_device_id: pcDeviceId,
          action: step.action,
          params: { ...step.params, ...params },
          requires_confirm: step.requires_confirm,
          idempotency_key: `macro-${run.id}-step-${i}`,
        });
        if (!step.requires_confirm) {
          const msg = this.commandsService.buildCommandMessage(cmd);
          this.agentGateway.sendToAgent(pcDeviceId, msg);
        }
      } catch (err: any) {
        await this.runRepo.update(run.id, {
          status: 'error',
          result_summary: `Failed at step ${i}: ${err.message}`,
          ended_at: new Date(),
        });
        return;
      }
    }

    await this.runRepo.update(run.id, {
      status: 'success',
      result_summary: `All ${steps.length} steps queued`,
      ended_at: new Date(),
    });
  }

  async getRunStatus(runId: string): Promise<MacroRun> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException(`Macro run ${runId} not found`);
    return run;
  }
}
