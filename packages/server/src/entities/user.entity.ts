import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Device } from './device.entity';
import { Session } from './session.entity';
import { Command } from './command.entity';
import { Notification } from './notification.entity';
import { Macro } from './macro.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash!: string | null;

  @Column({ type: 'text', nullable: true })
  totp_secret!: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  passkey_credentials!: unknown[];

  @Column({ type: 'varchar', length: 80, default: 'Europe/Rome' })
  timezone!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Device, (d) => d.user)
  devices!: Device[];

  @OneToMany(() => Session, (s) => s.user)
  sessions!: Session[];

  @OneToMany(() => Command, (c) => c.user)
  commands!: Command[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  @OneToMany(() => Macro, (m) => m.user)
  macros!: Macro[];
}
