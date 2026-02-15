import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly repo: Repository<Session>,
  ) {}

  async create(data: Partial<Session>): Promise<Session> {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }

  async findActive(userId: string): Promise<Session[]> {
    return this.repo.find({ where: { user_id: userId, is_active: true }, order: { started_at: 'DESC' } });
  }

  async findById(id: string): Promise<Session> {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  async heartbeat(id: string): Promise<void> {
    await this.repo.update(id, { last_heartbeat_at: new Date() });
  }

  async end(id: string, reason?: string): Promise<Session> {
    await this.repo.update(id, {
      is_active: false,
      ended_at: new Date(),
      disconnect_reason: reason || 'closed',
    });
    return this.findById(id);
  }
}
