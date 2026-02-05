import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional, IsObject, IsArray } from 'class-validator';

export class WebhookResultDto {
  @ApiProperty({ description: 'Whether the processing was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Processing result message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Processed data' })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ description: 'Error information (if failed)' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: 'Processing time (milliseconds)' })
  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @ApiPropertyOptional({ description: 'Review score (if available)' })
  @IsOptional()
  @IsNumber()
  reviewScore?: number;

  @ApiPropertyOptional({ description: 'Review result (if available)' })
  @IsOptional()
  @IsObject()
  reviewResult?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class WebhookProcessDetailDto extends WebhookResultDto {
  @ApiProperty({ description: 'Webhook event ID' })
  @IsString()
  webhookId: string;

  @ApiProperty({ description: 'Project name' })
  @IsString()
  projectName: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Author' })
  @IsString()
  author: string;

  @ApiProperty({ description: 'Branch' })
  @IsString()
  branch: string;

  @ApiPropertyOptional({ description: 'List of processed steps' })
  @IsOptional()
  @IsArray()
  steps?: ProcessStepDto[];
}

export class ProcessStepDto {
  @ApiProperty({ description: 'Step name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Execution status', enum: ['pending', 'running', 'completed', 'failed'] })
  @IsString()
  status: 'pending' | 'running' | 'completed' | 'failed';

  @ApiProperty({ description: 'Start time' })
  @IsNumber()
  startTime: number;

  @ApiPropertyOptional({ description: 'End time' })
  @IsOptional()
  @IsNumber()
  endTime?: number;

  @ApiPropertyOptional({ description: 'Duration (milliseconds)' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Step output' })
  @IsOptional()
  @IsObject()
  output?: any;

  @ApiPropertyOptional({ description: 'Error message' })
  @IsOptional()
  @IsString()
  error?: string;
}
