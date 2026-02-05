import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('daily_reports')
@Index(['reportDate'])
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', name: 'report_date' })
  reportDate: Date;

  @Column({ type: 'int', name: 'total_reviews' })
  totalReviews: number;

  @Column({ type: 'int', default: 0, name: 'average_score' })
  averageScore: number;

  @Column({ type: 'int', name: 'total_additions' })
  totalAdditions: number;

  @Column({ type: 'int', name: 'total_deletions' })
  totalDeletions: number;

  @Column({ type: 'jsonb', name: 'project_stats' })
  projectStats: Record<string, any>;

  @Column({ type: 'jsonb', name: 'author_stats' })
  authorStats: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'score_distribution' })
  scoreDistribution?: Record<string, number>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
