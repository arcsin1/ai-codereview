import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('webhook_logs')
@Index(['projectName', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class WebhookLogEntity {
  @ApiProperty({ description: 'Log ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Platform type' })
  @Column({ type: 'enum', enum: ['gitlab', 'github', 'gitea'], name: 'platform' })
  platform: string;

  @ApiProperty({ description: 'Event type' })
  @Column({ name: 'event_type' })
  eventType: string;

  @ApiProperty({ description: 'Project name' })
  @Column({ name: 'project_name' })
  projectName: string;

  @ApiProperty({ description: 'Project ID' })
  @Column({ name: 'project_id' })
  projectId: string;

  @ApiProperty({ description: 'Author' })
  @Column()
  author: string;

  @ApiPropertyOptional({ description: 'Source branch' })
  @Column({ nullable: true, name: 'source_branch' })
  sourceBranch?: string;

  @ApiPropertyOptional({ description: 'Target branch' })
  @Column({ nullable: true, name: 'target_branch' })
  targetBranch?: string;

  @ApiPropertyOptional({ description: 'Branch (Push event)' })
  @Column({ nullable: true })
  branch?: string;

  @ApiProperty({ description: 'Success status' })
  @Column({ default: false })
  success: boolean;

  @ApiProperty({ description: 'Processing message' })
  @Column({ type: 'text' })
  message: string;

  @ApiPropertyOptional({ description: 'Error information' })
  @Column({ type: 'text', nullable: true })
  error?: string;

  @ApiPropertyOptional({ description: 'Processing time (milliseconds)' })
  @Column({ type: 'int', nullable: true, name: 'processing_time' })
  processingTime?: number;

  @ApiPropertyOptional({ description: 'Review score' })
  @Column({ type: 'int', nullable: true, name: 'review_score' })
  reviewScore?: number;

  @ApiPropertyOptional({ description: 'Raw payload (JSON)' })
  @Column({ type: 'jsonb', nullable: true, name: 'raw_payload' })
  rawPayload?: any;

  @ApiProperty({ description: 'Creation time' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
