import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewConfigEntity } from '../../review/entities/review-config.entity';

export enum ProjectPlatform {
  GITLAB = 'gitlab',
  GITHUB = 'github',
  GITEA = 'gitea',
}

@Entity('projects')
@Index(['name'])
@Index(['platform'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProjectPlatform,
    name: 'platform',
  })
  platform: ProjectPlatform;

  @Column({ type: 'varchar', length: 500, name: 'repository_url' })
  repositoryUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'webhook_url' })
  webhookUrl?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'webhook_type' })
  webhookType?: 'feishu' | 'dingtalk';

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'webhook_secret' })
  webhookSecret?: string;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: true, name: 'auto_review_enabled' })
  autoReviewEnabled: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'review_config_id' })
  reviewConfigId: string | null;

  @ManyToOne(() => ReviewConfigEntity, { nullable: true })
  @JoinColumn({ name: 'review_config_id' })
  reviewConfig: ReviewConfigEntity | null;

  @Column({ type: 'uuid', nullable: true, name: 'owner_id' })
  ownerId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
