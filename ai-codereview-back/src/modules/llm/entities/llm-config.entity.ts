import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',
  ZHIPUAI = 'zhipuai',
  QWEN = 'qwen',
  OLLAMA = 'ollama',
}

@Entity('llm_configs')
export class LlmConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LlmProvider, default: LlmProvider.OPENAI, name: 'provider' })
  @Index()
  provider: LlmProvider;

  @Column({ type: 'varchar', length: 100, name: 'name' })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true, name: 'api_key' })
  apiKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'base_url' })
  baseURL: string;

  @Column({ type: 'varchar', length: 100, default: 'gpt-3.5-turbo', name: 'model' })
  model: string;

  @Column({ type: 'int', default: 2000, name: 'max_tokens' })
  maxTokens: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7, name: 'temperature' })
  temperature: number;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_config' })
  extraConfig: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
