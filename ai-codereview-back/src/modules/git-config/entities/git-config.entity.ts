import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GitProvider {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  GITEA = 'gitea',
}

@Entity('git_configs')
export class GitConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GitProvider,
    name: 'provider'
  })
  @Index()
  provider: GitProvider;

  @Column({ type: 'varchar', length: 255, name: 'url' })
  url: string;

  @Column({ type: 'varchar', length: 255, name: 'access_token' })
  accessToken: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'description' })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'default', name: 'name' })
  @Index()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
