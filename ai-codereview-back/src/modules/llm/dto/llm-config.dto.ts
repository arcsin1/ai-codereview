import { IsString, IsOptional, IsNumber, Min, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LLMConfigDto {
  @ApiPropertyOptional({ description: 'API key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'API base URL' })
  @IsOptional()
  @IsString()
  baseURL?: string;

  @ApiPropertyOptional({ description: 'Default model name' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', example: 0.7, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max tokens', example: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Request timeout (milliseconds)', example: 120000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number;

  @ApiPropertyOptional({ description: 'Other custom configuration' })
  @IsOptional()
  @IsObject()
  customConfig?: Record<string, any>;
}
