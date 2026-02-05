import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ReviewType = 'mr' | 'push';

@Entity('review_logs')
@Index(['reviewType'])
@Index(['reviewType', 'projectName', 'author'])
@Index(['updatedAt'])
export class ReviewLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, name: 'review_type' })
  reviewType: ReviewType;

  @Column({ type: 'uuid', nullable: true, name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 100, name: 'project_name' })
  projectName: string;

  @Column({ type: 'varchar', length: 100 })
  author: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'source_branch' })
  sourceBranch: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'target_branch' })
  targetBranch: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branch: string;

  @Column({ type: 'text', nullable: true, name: 'commit_messages' })
  commitMessages: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'jsonb', name: 'review_result' })
  reviewResult: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'last_commit_id' })
  lastCommitId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
