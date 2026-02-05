import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { LLMController } from './llm.controller';
import { LLMFactoryService } from './factory/llm-factory.service';
import { LlmConfig } from './entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([LlmConfig]),
  ],
  controllers: [LLMController],
  providers: [
    LlmService,
    LLMFactoryService,
  ],
  exports: [LlmService, LLMFactoryService],
})
export class LlmModule {}
