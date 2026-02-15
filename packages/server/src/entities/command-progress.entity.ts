import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Command } from './command.entity';

@Entity('command_progress')
export class CommandProgress {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'uuid' })
  command_id!: string;

  @Column({ type: 'enum', enum: ['queued', 'sent', 'running', 'retrying', 'awaiting_confirm', 'cancelling'] })
  status!: string;

  @Column({ type: 'int', nullable: true })
  step!: number | null;

  @Column({ type: 'int', nullable: true })
  total_steps!: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  percent!: number | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'text', nullable: true })
  output_chunk!: string | null;

  @Column({ type: 'int', nullable: true })
  chunk_index!: number | null;

  @Column({ type: 'boolean', default: false })
  chunk_final!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Command, (c) => c.progress_entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'command_id' })
  command!: Command;
}
