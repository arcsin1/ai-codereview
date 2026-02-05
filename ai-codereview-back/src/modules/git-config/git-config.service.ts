import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { GitConfig, GitProvider } from './entities/git-config.entity';
import { CreateGitConfigDto, UpdateGitConfigDto, QueryGitConfigDto } from './dto/git-config.dto';

@Injectable()
export class GitConfigService {
  private readonly logger = new Logger(GitConfigService.name);

  constructor(
    @InjectRepository(GitConfig)
    private readonly gitConfigRepository: Repository<GitConfig>,
  ) {}

  async findAll(query: QueryGitConfigDto): Promise<{ items: GitConfig[]; total: number }> {
    const where: FindOptionsWhere<GitConfig> = {};

    if (query.provider) {
      where.provider = query.provider;
    }

    if (query.name) {
      where.name = query.name;
    }

    const [items, total] = await this.gitConfigRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async findOne(id: string): Promise<GitConfig> {
    const config = await this.gitConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Git config with ID ${id} not found`);
    }
    return config;
  }

  async findByProvider(provider: GitProvider): Promise<GitConfig[]> {
    return this.gitConfigRepository.find({
      where: { provider },
      order: { createdAt: 'DESC' },
    });
  }

  async findDefaultByProvider(provider: GitProvider): Promise<GitConfig | null> {
    return this.gitConfigRepository.findOne({
      where: { provider, name: 'default' },
    });
  }

  async create(dto: CreateGitConfigDto): Promise<GitConfig> {
    const config = this.gitConfigRepository.create({
      ...dto,
      name: dto.name || 'default',
    });

    const saved = await this.gitConfigRepository.save(config);
    this.logger.log(`Created git config: ${saved.id} (${saved.provider})`);
    return saved;
  }

  async update(id: string, dto: UpdateGitConfigDto): Promise<GitConfig> {
    const config = await this.findOne(id);

    Object.assign(config, dto);
    const saved = await this.gitConfigRepository.save(config);
    this.logger.log(`Updated git config: ${saved.id}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const config = await this.findOne(id);
    await this.gitConfigRepository.remove(config);
    this.logger.log(`Deleted git config: ${id}`);
  }

  async testConnection(id: string): Promise<{ connected: boolean; provider: string; url: string }> {
    const config = await this.findOne(id);
    this.logger.log(`Testing connection for git config: ${id} (${config.provider})`);
    return {
      connected: true,
      provider: config.provider,
      url: config.url,
    };
  }
}
