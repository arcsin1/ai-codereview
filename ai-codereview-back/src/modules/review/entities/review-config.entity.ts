import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReviewStyle {
  PROFESSIONAL = 'professional',
  STRICT = 'strict',
  RELAXED = 'relaxed',
  EDUCATIONAL = 'educational',
}

/**
 * Review configuration entity
 * Stores different style review prompt configurations
 */
@Entity('review_configs')
@Index(['reviewStyle'], { unique: true })
export class ReviewConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    name: 'review_style',
  })
  reviewStyle: string;

  @Column({ type: 'text', name: 'prompt' })
  prompt: string;

  @Column({ type: 'int', default: 4096, name: 'max_tokens' })
  maxTokens: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
