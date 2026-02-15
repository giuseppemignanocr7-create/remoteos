import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';
import { Command } from './command.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  mobile_device_id!: string | null;

  @Column({ type: 'uuid' })
  pc_device_id!: string;

  @Column({ type: 'enum', enum: ['command', 'desktop'], default: 'command' })
  mode!: 'command' | 'desktop';

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  started_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_heartbeat_at!: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  disconnect_reason!: string | null;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Device, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mobile_device_id' })
  mobile_device!: Device | null;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pc_device_id' })
  pc_device!: Device;

  @OneToMany(() => Command, (c) => c.session)
  commands!: Command[];
}
