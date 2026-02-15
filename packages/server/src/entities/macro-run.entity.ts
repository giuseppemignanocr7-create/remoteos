import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Macro } from './macro.entity';

@Entity('macro_runs')
export class MacroRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  macro_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  session_id!: string | null;

  @Column({ type: 'enum', enum: ['manual', 'schedule', 'event'], default: 'manual' })
  trigger_source!: string;

  @Column({ type: 'enum', enum: ['running', 'success', 'error', 'cancelled', 'timeout'], default: 'running' })
  status!: string;

  @Column({ type: 'jsonb', default: '{}' })
  params!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  result_summary!: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  started_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Macro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'macro_id' })
  macro!: Macro;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
