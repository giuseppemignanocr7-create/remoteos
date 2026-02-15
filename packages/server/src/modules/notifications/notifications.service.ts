import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notif = this.repo.create(data);
    return this.repo.save(notif);
  }

  async findByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { user_id: userId };
    if (unreadOnly) where.is_read = false;
    return this.repo.find({ where, order: { created_at: 'DESC' }, take: 100 });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  async markRead(id: string): Promise<Notification | null> {
    await this.repo.update(id, { is_read: true, read_at: new Date() });
    return this.findById(id);
  }

  async markAllRead(userId: string): Promise<{ affected: number }> {
    const result = await this.repo.update({ user_id: userId, is_read: false }, { is_read: true, read_at: new Date() });
    return { affected: result.affected ?? 0 };
  }
}
