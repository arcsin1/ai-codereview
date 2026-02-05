import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LlmProvider } from '../entities';

export class CreateLlmConfigDto {
  @ApiProperty({ enum: LlmProvider, description: 'LLM provider' })
  @IsEnum(LlmProvider)
  provider: LlmProvider;

  @ApiProperty({ description: 'Configuration name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'API key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Base URL' })
  @IsOptional()
  @IsString()
  baseURL?: string;

  @ApiPropertyOptional({ description: 'Model name', default: 'gpt-3.5-turbo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Max tokens', default: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Temperature', default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Is default configuration', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Extra configuration' })
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, any>;
}

export class UpdateLlmConfigDto {
  @ApiPropertyOptional({ enum: LlmProvider, description: 'LLM provider' })
  @IsOptional()
  @IsEnum(LlmProvider)
  provider?: LlmProvider;

  @ApiPropertyOptional({ description: 'Configuration name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'API key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Base URL' })
  @IsOptional()
  @IsString()
  baseURL?: string;

  @ApiPropertyOptional({ description: 'Model name' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Max tokens' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Temperature' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Is default configuration' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Is enabled' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Extra configuration' })
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, any>;
}

export class QueryLlmConfigDto {
  @ApiPropertyOptional({ description: 'Provider' })
  @IsOptional()
  @IsEnum(LlmProvider)
  provider?: LlmProvider;

  @ApiPropertyOptional({ description: 'Is enabled', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  limit?: number;
}
