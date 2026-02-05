import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { GitProvider } from '../entities/git-config.entity';

export class QueryGitConfigDto {
  @IsOptional()
  @IsEnum(GitProvider)
  provider?: GitProvider;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateGitConfigDto {
  @IsEnum(GitProvider)
  provider: GitProvider;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string = 'default';
}

export class UpdateGitConfigDto {
  @IsOptional()
  @IsEnum(GitProvider)
  provider?: GitProvider;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}
