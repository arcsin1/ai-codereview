import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LLMFactoryService } from './factory/llm-factory.service';
import { LLMCompletionDto } from './dto/llm-completion.dto';
import { CreateLlmConfigDto, UpdateLlmConfigDto, QueryLlmConfigDto } from './dto/llm-config-crud.dto';
import { LlmService } from './llm.service';
import { LoggingInterceptor, TransformInterceptor } from '../../common/interceptors';
import { JwtAuthGuard } from '../../common/guards';
import { LLMProvider } from '../../common/constants/enums';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class LLMController {
  constructor(
    private readonly llmFactoryService: LLMFactoryService,
    private readonly llmService: LlmService,
  ) {}

  @Post('complete')
  @ApiOperation({ summary: 'Generate text using LLM' })
  @ApiResponse({ status: 200, description: 'Generation successful' })
  async complete(@Body() dto: LLMCompletionDto) {
    const messages = dto.messages.map(m => ({
      role: m.role as any,
      content: m.content,
    }));

    const response = await this.llmFactoryService.complete(
      dto.provider,
      messages,
      {
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      },
    );

    return {
      provider: dto.provider,
      content: response.content,
      usage: response.usage,
    };
  }

  @Post('stream')
  @ApiOperation({ summary: 'Generate text using LLM with streaming' })
  @ApiResponse({ status: 200, description: 'Stream generation successful' })
  async *completeStream(@Body() dto: LLMCompletionDto) {
    const messages = dto.messages.map(m => ({
      role: m.role as any,
      content: m.content,
    }));

    const stream = this.llmFactoryService.completeStream(
      dto.provider,
      messages,
      {
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      },
    );

    for await (const chunk of stream) {
      yield { chunk };
    }
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all available LLM providers' })
  @ApiResponse({ status: 200, description: 'Success' })
  getAvailableProviders() {
    const providers = this.llmFactoryService.getAvailableProviders();
    return {
      providers,
      count: providers.length,
    };
  }

  @Get('providers/:provider/check')
  @ApiOperation({ summary: 'Check if specified LLM provider is available' })
  @ApiParam({ name: 'provider', enum: LLMProvider })
  @ApiResponse({ status: 200, description: 'Check successful' })
  checkProvider(@Param('provider') provider: LLMProvider) {
    const isAvailable = this.llmFactoryService.isProviderAvailable(provider);
    return {
      provider,
      available: isAvailable,
    };
  }

  @Get('providers/:provider/models')
  @ApiOperation({ summary: 'Get list of models supported by specified provider' })
  @ApiParam({ name: 'provider', enum: LLMProvider })
  @ApiResponse({ status: 200, description: 'Success' })
  getProviderModels(@Param('provider') provider: LLMProvider) {
    // Here we can return supported models based on different providers
    const models: Record<LLMProvider, string[]> = {
      [LLMProvider.OPENAI]: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      [LLMProvider.ANTHROPIC]: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      [LLMProvider.DEEPSEEK]: ['deepseek-chat', 'deepseek-coder'],
      [LLMProvider.ZHIPUAI]: ['glm-4', 'glm-3-turbo'],
      [LLMProvider.QWEN]: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      [LLMProvider.OLLAMA]: ['llama2', 'mistral', 'neural-chat'],
    };

    return {
      provider,
      models: models[provider] || [],
    };
  }

  // Configuration management endpoints
  @Get('configs')
  @ApiOperation({ summary: 'Get LLM configuration list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getConfigs(@Query() queryDto: QueryLlmConfigDto) {
    return await this.llmService.findAllConfig(queryDto);
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get LLM configuration details' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getConfig(@Param('id') id: string) {
    return await this.llmService.findOneConfig(id);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Create LLM configuration' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async createConfig(@Body() createDto: CreateLlmConfigDto) {
    return await this.llmService.createConfig(createDto);
  }

  @Put('configs/:id')
  @ApiOperation({ summary: 'Update LLM configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async updateConfig(@Param('id') id: string, @Body() updateDto: UpdateLlmConfigDto) {
    return await this.llmService.updateConfig(id, updateDto);
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete LLM configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async removeConfig(@Param('id') id: string) {
    return await this.llmService.removeConfig(id);
  }

  @Post('configs/:id/test')
  @ApiOperation({ summary: 'Test LLM configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testConfig(@Param('id') id: string) {
    return await this.llmService.testConfig(id);
  }
}
