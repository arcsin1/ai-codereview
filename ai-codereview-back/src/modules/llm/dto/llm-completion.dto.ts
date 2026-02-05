import { IsString, IsArray, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LLMProvider } from '../../../common/constants/enums';

export class MessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsEnum(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

export class LLMCompletionDto {
  @ApiProperty({ enum: LLMProvider, description: 'LLM provider' })
  @IsEnum(LLMProvider)
  provider: LLMProvider;

  @ApiProperty({ type: [MessageDto], description: 'Message array' })
  @IsArray()
  messages: MessageDto[];

  @ApiPropertyOptional({ description: 'Model name', example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', example: 0.7, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max generated tokens', example: 4000, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Enable streaming output', example: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
