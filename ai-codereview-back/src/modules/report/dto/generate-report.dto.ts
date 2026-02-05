import { IsString, IsOptional, IsDate, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiPropertyOptional({ description: 'Report date' })
  @IsOptional()
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ description: 'Project name list (empty means all projects)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectNames?: string[];

  @ApiPropertyOptional({ description: 'Include detailed information', example: false })
  @IsOptional()
  includeDetails?: boolean;
}
