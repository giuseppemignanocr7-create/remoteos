import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Session } from './session.entity';
import { Device } from './device.entity';
import { CommandProgress } from './command-progress.entity';

@Entity('commands')
export class Command {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  session_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  pc_device_id!: string;

  @Column({ type: 'varchar', length: 120 })
  action!: string;

  @Column({ type: 'jsonb', default: '{}' })
  params!: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: [
      'pending', 'sent', 'running', 'awaiting_confirm', 'retrying',
      'success', 'error', 'timeout', 'cancelled', 'terminated', 'agent_crashed',
    ],
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'boolean', default: false })
  requires_confirm!: boolean;

  @Column({ type: 'enum', enum: ['never', 'on_mutation', 'always'], default: 'on_mutation' })
  confirm_policy!: string;

  @Column({ type: 'uuid', nullable: true })
  confirm_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  confirmed_by_device_id!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at!: Date | null;

  @Column({ type: 'int', default: 300000 })
  timeout_ms!: number;

  @Column({ type: 'varchar', length: 128 })
  idempotency_key!: string;

  @Column({ type: 'enum', enum: ['none', 'project', 'global'], default: 'project' })
  concurrency_scope!: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  project_key!: string | null;

  @Column({ type: 'smallint', default: 0 })
  attempt_count!: number;

  @Column({ type: 'smallint', default: 1 })
  max_retries!: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  queued_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at!: Date | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  last_error_code!: string | null;

  @Column({ type: 'text', nullable: true })
  last_error_message!: string | null;

  @Column({ type: 'text', nullable: true })
  output_preview!: string | null;

  @Column({ type: 'int', default: 0 })
  output_bytes!: number;

  @Column({ type: 'boolean', default: false })
  output_truncated!: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  artifact_manifest!: unknown[];

  @ManyToOne(() => Session, (s) => s.commands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: Session;

  @ManyToOne(() => User, (u) => u.commands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pc_device_id' })
  pc_device!: Device;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'confirmed_by_device_id' })
  confirmed_by_device!: Device | null;

  @OneToMany(() => CommandProgress, (cp) => cp.command)
  progress_entries!: CommandProgress[];
}
