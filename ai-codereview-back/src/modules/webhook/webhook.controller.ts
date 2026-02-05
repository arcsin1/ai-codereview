import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';

/**
 * Platform headers type definition
 */
interface PlatformHeaders {
  token?: string;
  event?: string;
}

interface AllPlatformHeaders {
  gitlab: PlatformHeaders;
  github: PlatformHeaders;
  gitea: PlatformHeaders;
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('review')
  @HttpCode(HttpStatus.OK)
  async handleReviewWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    // Parse platform headers
    const platformHeaders = this.parsePlatformHeaders(headers);

    this.logger.log(
      `Received webhook - GitLab: ${!!platformHeaders.gitlab.event}, GitHub: ${!!platformHeaders.github.event}, Gitea: ${!!platformHeaders.gitea.event}`,
    );

    try {
      const result = await this.webhookService.processWebhook(payload, platformHeaders);
      return result;
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${(error as Error).message}`);
      throw error;
    }
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() payload: any) {
    return this.webhookService.testConnection(payload);
  }

  @Post('debug')
  @HttpCode(HttpStatus.OK)
  async debugWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    this.logger.log('=== DEBUG WEBHOOK ===');
    this.logger.log(`Raw body from req.rawBody: ${req.rawBody ? 'exists' : 'undefined'}`);
    this.logger.log(`Body() parsed: ${JSON.stringify(payload).substring(0, 500)}`);
    this.logger.log(`Content-Type: ${req.headers['content-type']}`);
    this.logger.log(`X-GitHub-Event: ${headers['x-github-event']}`);
    this.logger.log(`X-GitLab-Event: ${headers['x-gitlab-event']}`);
    this.logger.log(`X-Gitea-Event: ${headers['x-gitea-event']}`);
    this.logger.log(`Token headers present - gitlab: ${!!headers['x-gitlab-token']}, github: ${!!headers['x-github-token']}, gitea: ${!!headers['x-gitea-token']}`);
    this.logger.log('=====================');

    return {
      rawBodyExists: !!req.rawBody,
      rawBodyLength: req.rawBody?.length,
      parsedBodyKeys: Object.keys(payload || {}),
      contentType: req.headers['content-type'],
      events: {
        github: headers['x-github-event'],
        gitlab: headers['x-gitlab-event'],
        gitea: headers['x-gitea-event'],
      },
    };
  }

  /**
   * Parse platform headers
   */
  private parsePlatformHeaders(headers: Record<string, string>): AllPlatformHeaders {
    return {
      gitlab: {
        token: headers['x-gitlab-token'],
        event: headers['x-gitlab-event'],
      },
      github: {
        token: headers['x-github-token'],
        event: headers['x-github-event'],
      },
      gitea: {
        token: headers['x-gitea-token'],
        event: headers['x-gitea-event'],
      },
    };
  }
}
