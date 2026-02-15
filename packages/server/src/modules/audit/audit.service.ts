import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

export interface AuditLogEntry {
  user_id: string;
  session_id?: string;
  device_id?: string;
  pc_id?: string;
  command_id?: string;
  action: string;
  params?: Record<string, unknown>;
  params_hash?: string;
  result?: string;
  output_hash?: string;
  duration_ms?: number;
  fallback_level?: string;
  fallback_reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
  ) {}

  async log(entry: AuditLogEntry): Promise<AuditLog> {
    const record = this.repo.create({
      user_id: entry.user_id,
      session_id: entry.session_id || null,
      device_id: entry.device_id || null,
      pc_id: entry.pc_id || null,
      command_id: entry.command_id || null,
      action: entry.action,
      params: entry.params || {},
      params_hash: entry.params_hash || null,
      result: entry.result || null,
      output_hash: entry.output_hash || null,
      duration_ms: entry.duration_ms || null,
      fallback_level: entry.fallback_level || null,
      fallback_reason: entry.fallback_reason || null,
      entry_hash: '0'.repeat(64),
    });

    const inserted = await this.repo.save(record);
    const reloaded = await this.repo.findOne({ where: { id: inserted.id } });
    this.logger.debug(`Audit: ${entry.action} [user=${entry.user_id}]`);
    return reloaded ?? inserted;
  }

  async getTimeline(userId: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    return this.repo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getByCommand(commandId: string): Promise<AuditLog[]> {
    return this.repo.find({
      where: { command_id: commandId },
      order: { created_at: 'ASC' },
    });
  }

  async verifyChain(startId: number, count: number): Promise<{ valid: boolean; checked: number }> {
    const entries = await this.repo
      .createQueryBuilder('a')
      .where('a.id >= :startId', { startId })
      .orderBy('a.id', 'ASC')
      .limit(count)
      .getMany();

    let checked = 0;
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].prev_hash !== entries[i - 1].entry_hash) {
        return { valid: false, checked };
      }
      checked++;
    }
    return { valid: true, checked };
  }
}
