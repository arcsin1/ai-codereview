import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMFactoryService } from './factory/llm-factory.service';
import { LLMMessage, LLMCompletionOptions, LLMCompletionResponse } from './factory/providers/base.provider';
import { LlmConfig, LlmProvider } from './entities';
import { CreateLlmConfigDto, UpdateLlmConfigDto, QueryLlmConfigDto } from './dto/llm-config-crud.dto';

@Injectable()
export class LlmService {
  constructor(
    private llmFactory: LLMFactoryService,
    @InjectRepository(LlmConfig)
    private llmConfigRepository: Repository<LlmConfig>,
  ) {}

  async complete(
    provider: string,
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResponse> {
    return this.llmFactory.complete(provider, messages, options);
  }

  async *completeStream(
    provider: string,
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): AsyncIterable<string> {
    yield* this.llmFactory.completeStream(provider, messages, options);
  }

  // Configuration management methods
  async createConfig(createDto: CreateLlmConfigDto): Promise<LlmConfig> {
    // If setting as default, unset other default configs first
    if (createDto.isDefault) {
      await this.llmConfigRepository.update(
        { provider: createDto.provider, isDefault: true },
        { isDefault: false },
      );
    }

    const config = this.llmConfigRepository.create(createDto);
    return await this.llmConfigRepository.save(config);
  }

  async findAllConfig(queryDto: QueryLlmConfigDto) {
    const { provider, isEnabled, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.llmConfigRepository.createQueryBuilder('config');

    if (provider) {
      queryBuilder.andWhere('config.provider = :provider', { provider });
    }

    if (isEnabled !== undefined) {
      queryBuilder.andWhere('config.isEnabled = :isEnabled', { isEnabled });
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('config.createdAt', 'DESC')
      .getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneConfig(id: string): Promise<LlmConfig> {
    const config = await this.llmConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`LLM config ${id} not found`);
    }
    return config;
  }

  async findDefaultConfig(provider: LlmProvider): Promise<LlmConfig> {
    const config = await this.llmConfigRepository.findOne({
      where: { provider, isDefault: true, isEnabled: true },
    });

    if (!config) {
      // If no default config, return the first enabled config for this provider
      const firstEnabled = await this.llmConfigRepository.findOne({
        where: { provider, isEnabled: true },
        order: { createdAt: 'ASC' },
      });

      if (!firstEnabled) {
        throw new NotFoundException(`No available config found for ${provider}`);
      }

      return firstEnabled;
    }

    return config;
  }

  async updateConfig(id: string, updateDto: UpdateLlmConfigDto): Promise<LlmConfig> {
    const config = await this.findOneConfig(id);

    // If setting as default, unset other default configs first
    if (updateDto.isDefault && updateDto.provider) {
      await this.llmConfigRepository.update(
        { provider: updateDto.provider, isDefault: true, id: id },
        { isDefault: false },
      );
    }

    Object.assign(config, updateDto);
    // Clear factory cache
    this.llmFactory.clearCache();
    return await this.llmConfigRepository.save(config);
  }

  async removeConfig(id: string): Promise<void> {
    const config = await this.findOneConfig(id);
    // Clear factory cache
    this.llmFactory.clearCache();
    await this.llmConfigRepository.remove(config);
  }

  async testConfig(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.findOneConfig(id);

      // Clear cache to ensure latest config is used
      this.llmFactory.clearCache();

      // Send a simple test request
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello, please respond with "OK" only.' },
      ];

      const response = await this.llmFactory.complete(
        config.provider,
        messages,
        { maxTokens: 10 },
      );

      if (response.content.toLowerCase().includes('ok')) {
        return {
          success: true,
          message: 'Config test successful',
        };
      }

      return {
        success: false,
        message: `Config test failed: response does not match expected: ${response.content}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Config test failed: ${error.message}`,
      };
    }
  }

  async getProviders(): Promise<string[]> {
    return Object.values(LlmProvider);
  }
}
