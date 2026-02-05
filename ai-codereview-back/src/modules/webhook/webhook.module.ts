import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GitlabHandler } from './handlers/gitlab.handler';
import { GithubHandler } from './handlers/github.handler';
import { GiteaHandler } from './handlers/gitea.handler';
import { ReviewModule } from '../review/review.module';
import { LlmModule } from '../llm/llm.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectModule } from '../project/project.module';
import { ReviewConfigEntity } from '../review/entities/review-config.entity';
import { GitConfig } from '../git-config/entities/git-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewConfigEntity, GitConfig]),
    ReviewModule,
    LlmModule,
    NotificationModule,
    ProjectModule,
  ],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    GitlabHandler,
    GithubHandler,
    GiteaHandler,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
