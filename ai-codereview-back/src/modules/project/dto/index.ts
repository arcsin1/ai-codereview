import { IsString, IsOptional, IsEnum, IsBoolean, IsUrl, IsUUID } from 'class-validator';
import { ProjectPlatform } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectPlatform)
  platform: ProjectPlatform;

  @IsUrl({ require_tld: false })
  repositoryUrl: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsEnum(['feishu', 'dingtalk'])
  webhookType?: 'feishu' | 'dingtalk';

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoReviewEnabled?: boolean;

  @IsOptional()
  @IsUUID()
  reviewConfigId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  repositoryUrl?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsEnum(['feishu', 'dingtalk'])
  webhookType?: 'feishu' | 'dingtalk';

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoReviewEnabled?: boolean;

  @IsOptional()
  @IsUUID()
  reviewConfigId?: string;
}
