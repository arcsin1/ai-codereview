import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmConfig, LlmProvider } from '../entities';
import { LLMMessage, LLMCompletionOptions, LLMCompletionResponse } from './providers/base.provider';
import { ChatOpenAI } from '@langchain/openai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * LLM Factory Service
 * Provides unified LLM interface using LangChain
 */
@Injectable()
export class LLMFactoryService {
  private readonly logger = new Logger(LLMFactoryService.name);
  private modelCache: Map<string, BaseChatModel> = new Map();

  // maxTokens limits for different LLM providers
  private readonly PROVIDER_MAX_TOKENS_LIMITS = {
    openai: 8192,        // OpenAI model limits
    anthropic: 8192,     // Anthropic Claude limits
    deepseek: 16000,     // DeepSeek supports larger values
    zhipuai: 8192,       // Zhipu AI limits
    qwen: 8192,          // Qwen limits
    ollama: 4096,        // Ollama local model limits (conservative estimate)
  };

  constructor(
    @InjectRepository(LlmConfig)
    private llmConfigRepository: Repository<LlmConfig>,
  ) {}

  /**
   * Clear config cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * Get global default LLM config (find is_default=true and is_enabled=true from llm_configs table)
   */
  async getGlobalDefaultConfig(): Promise<LlmConfig> {
    // Find all configs with is_default=true and is_enabled=true
    const defaultConfigs = await this.llmConfigRepository.find({
      where: { isDefault: true, isEnabled: true },
      order: { createdAt: 'ASC' },
    });

    if (defaultConfigs.length > 0) {
      // Return the first default config found
      return defaultConfigs[0];
    }

    // If no default config, find the first enabled config
    const firstEnabled = await this.llmConfigRepository.findOne({
      where: { isEnabled: true },
      order: { createdAt: 'ASC' },
    });

    if (!firstEnabled) {
      throw new NotFoundException('No available LLM config found, please configure LLM in the admin panel');
    }

    return firstEnabled;
  }

  /**
   * Get LLM config by provider name
   */
  async getLlmConfigByProvider(provider: string): Promise<LlmConfig | null> {
    const providerEnum = provider as LlmProvider;

    // First try to find default config for this provider
    const config = await this.llmConfigRepository.findOne({
      where: { provider: providerEnum, isDefault: true, isEnabled: true },
    });

    if (config) return config;

    // Otherwise find the first enabled one
    return this.llmConfigRepository.findOne({
      where: { provider: providerEnum, isEnabled: true },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get safe maxTokens value (not exceeding provider limit)
   */
  private getSafeMaxTokens(provider: LlmProvider, configuredMaxTokens?: number): number {
    const providerLower = provider.toLowerCase();
    const maxLimit = this.PROVIDER_MAX_TOKENS_LIMITS[providerLower] || 4096;
    const safeMaxTokens = Math.min(configuredMaxTokens || 4000, maxLimit);

    if (configuredMaxTokens && configuredMaxTokens > maxLimit) {
      this.logger.warn(
        `Configured maxTokens (${configuredMaxTokens}) exceeds ${provider} limit (${maxLimit}), using ${safeMaxTokens}`,
      );
    }

    return safeMaxTokens;
  }

  /**
   * Create LangChain ChatModel instance
   */
  private async createChatModel(config: LlmConfig): Promise<BaseChatModel> {
    const cacheKey = `${config.provider}-${config.id}`;

    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }

    let model: BaseChatModel;
    const safeMaxTokens = this.getSafeMaxTokens(config.provider, config.maxTokens);

    switch (config.provider) {
      case LlmProvider.OPENAI:
        model = new ChatOpenAI({
          apiKey: config.apiKey,
          model: config.model || 'gpt-4',
          temperature: Number(config.temperature) || 0.7,
          maxTokens: safeMaxTokens,
          configuration: config.baseURL ? { baseURL: config.baseURL } : undefined,
        });
        break;

      case LlmProvider.DEEPSEEK:
        model = new ChatDeepSeek({
          apiKey: config.apiKey,
          model: config.model || 'deepseek-chat',
          temperature: Number(config.temperature) || 0.7,
          maxTokens: safeMaxTokens,
        });
        break;

      case LlmProvider.ANTHROPIC:
        model = new ChatAnthropic({
          apiKey: config.apiKey,
          model: config.model || 'claude-3-5-sonnet-20241022',
          temperature: Number(config.temperature) || 0.7,
          maxTokens: safeMaxTokens,
        });
        break;

      case LlmProvider.OLLAMA:
        model = new ChatOllama({
          baseUrl: config.baseURL || 'http://localhost:11434',
          model: config.model || 'llama2',
          temperature: Number(config.temperature) || 0.7,
        });
        break;

      default:
        throw new NotFoundException(`Unsupported LLM provider: ${config.provider}`);
    }

    this.modelCache.set(cacheKey, model);
    this.logger.log(`Created LangChain model for ${config.provider}: ${config.model}`);
    return model;
  }

  /**
   * Complete text generation with specified Provider
   *
   * @param provider - LLM provider name
   * @param messages - Message array
   * @param options - Optional parameters
   * @returns Generation result
   */
  async complete(
    provider: LlmProvider | string,
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResponse> {
    // Get LLM config
    const llmConfig = await this.getLlmConfigByProvider(provider);
    if (!llmConfig) {
      throw new NotFoundException(`LLM config not found for ${provider}`);
    }

    // Create LangChain model
    const model = await this.createChatModel(llmConfig);

    // Convert message format
    const langChainMessages = messages.map((msg) => {
      if (msg.role === 'system') {
        return new SystemMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });

    this.logger.log(`Calling LangChain ${llmConfig.provider} API, model: ${llmConfig.model}`);

    // Call LangChain
    const response = await model.invoke(langChainMessages);

    // Get response content
    const content = typeof response.content === 'string' ? response.content : '';

    // Estimate token usage (LangChain doesn't directly return usage)
    const promptTokens = this.estimateTokens(JSON.stringify(messages));
    const completionTokens = this.estimateTokens(content);

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  /**
   * Stream generation with specified Provider
   *
   * @param provider - LLM provider name
   * @param messages - Message array
   * @param options - Optional parameters
   * @returns Stream generation result
   */
  async *completeStream(
    provider: LlmProvider | string,
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): AsyncIterable<string> {
    // Get LLM config
    const llmConfig = await this.getLlmConfigByProvider(provider);
    if (!llmConfig) {
      throw new NotFoundException(`LLM config not found for ${provider}`);
    }

    // Create LangChain model
    const model = await this.createChatModel(llmConfig);

    // Convert message format
    const langChainMessages = messages.map((msg) => {
      if (msg.role === 'system') {
        return new SystemMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });

    this.logger.log(`Calling LangChain ${llmConfig.provider} API (stream), model: ${llmConfig.model}`);

    // Stream call
    const stream = await model.stream(langChainMessages);

    for await (const chunk of stream) {
      yield chunk.content as string;
    }
  }

  /**
   * Get all available Provider names
   */
  getAvailableProviders(): string[] {
    return Object.values(LlmProvider);
  }

  /**
   * Check if Provider is available
   */
  isProviderAvailable(provider: LlmProvider | string): boolean {
    const providers = this.getAvailableProviders();
    return providers.includes(typeof provider === 'string' ? provider : provider);
  }

  /**
   * Estimate token count (simple implementation)
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords * 0.75);
  }
}
