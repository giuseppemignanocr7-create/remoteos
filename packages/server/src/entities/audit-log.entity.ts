import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  session_id!: string | null;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  device_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  pc_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  command_id!: string | null;

  @Column({ type: 'varchar', length: 120 })
  action!: string;

  @Column({ type: 'jsonb', default: '{}' })
  params!: Record<string, unknown>;

  @Column({ type: 'char', length: 64, nullable: true })
  params_hash!: string | null;

  @Column({ type: 'varchar', nullable: true })
  result!: string | null;

  @Column({ type: 'char', length: 64, nullable: true })
  output_hash!: string | null;

  @Column({ type: 'int', nullable: true })
  duration_ms!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fallback_level!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  fallback_reason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'char', length: 64, nullable: true })
  prev_hash!: string | null;

  @Column({ type: 'char', length: 64 })
  entry_hash!: string;

  @Column({ type: 'text', nullable: true })
  signature!: string | null;
}
