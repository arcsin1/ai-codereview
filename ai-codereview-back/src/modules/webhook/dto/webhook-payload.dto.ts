import { IsObject, IsOptional, IsString } from 'class-validator';

export class WebhookPayloadDto {
  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  event?: string;
}

export class WebhookResultDto {
  success: boolean;
  message?: string;
  score?: number;
  data?: any;
}
