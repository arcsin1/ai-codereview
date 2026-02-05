import { IsString, IsNumber, IsOptional, IsObject, IsDate, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewLogDto {
  @ApiPropertyOptional({ enum: ['mr', 'push'], default: 'mr' })
  @IsOptional()
  @IsIn(['mr', 'push'])
  reviewType?: 'mr' | 'push';

  @ApiProperty()
  @IsString()
  projectName: string;

  @ApiProperty()
  @IsString()
  author: string;

  @ApiPropertyOptional({ description: 'MR source branch' })
  @IsOptional()
  @IsString()
  sourceBranch?: string;

  @ApiPropertyOptional({ description: 'MR target branch' })
  @IsOptional()
  @IsString()
  targetBranch?: string;

  @ApiPropertyOptional({ description: 'Push branch' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty()
  @IsObject()
  reviewResult: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty()
  @IsString()
  lastCommitId: string;

  @ApiProperty()
  @IsNumber()
  additions: number = 0;

  @ApiProperty()
  @IsNumber()
  deletions: number = 0;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  commitMessages?: string;
}

export class QueryReviewDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Project name' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: 'Author' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ enum: ['mr', 'push'], description: 'Review type' })
  @IsOptional()
  @IsIn(['mr', 'push'])
  reviewType?: 'mr' | 'push';

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}

export class ReviewStatisticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Project name' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ enum: ['mr', 'push', 'all'], description: 'Review type' })
  @IsOptional()
  @IsIn(['mr', 'push', 'all'])
  reviewType?: 'mr' | 'push' | 'all';
}
