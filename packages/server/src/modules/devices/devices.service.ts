import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly repo: Repository<Device>,
  ) {}

  async create(data: Partial<Device>): Promise<Device> {
    if (data.fingerprint) {
      const existing = await this.repo.findOne({ where: { fingerprint: data.fingerprint } });
      if (existing) throw new ConflictException('Device fingerprint already registered');
    }
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async findByUser(userId: string): Promise<Device[]> {
    return this.repo.find({ where: { user_id: userId, is_revoked: false } });
  }

  async findById(id: string): Promise<Device> {
    const device = await this.repo.findOne({ where: { id } });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  async revoke(id: string): Promise<Device> {
    await this.repo.update(id, { is_revoked: true });
    return this.findById(id);
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.repo.update(id, { last_seen: new Date() });
  }

  async findByFingerprint(fingerprint: string): Promise<Device | null> {
    return this.repo.findOne({ where: { fingerprint, is_revoked: false } });
  }

  async updateLastSeenByFingerprint(fingerprint: string): Promise<void> {
    await this.repo.update({ fingerprint }, { last_seen: new Date() });
  }
}
