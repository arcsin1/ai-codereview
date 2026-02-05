import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { DailyReport } from './entities/daily-report.entity';
import { DailyReportJob } from './jobs/daily-report.job';
import { ReviewLog } from '../review/entities/review-log.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([DailyReport, ReviewLog]),
  ],
  controllers: [ReportController],
  providers: [ReportService, DailyReportJob],
  exports: [ReportService],
})
export class ReportModule {}
