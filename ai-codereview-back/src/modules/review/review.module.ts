import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { CodeReviewerService } from './code-reviewer.service';
import { ReviewConfigEntity, ReviewLog } from './entities';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewConfigEntity, ReviewLog]), LlmModule],
  controllers: [ReviewController],
  providers: [ReviewService, CodeReviewerService],
  exports: [ReviewService, CodeReviewerService],
})
export class ReviewModule {}
