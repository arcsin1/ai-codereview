import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule,
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
