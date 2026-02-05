import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReport } from './entities/daily-report.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(DailyReport)
    private readonly dailyReportRepo: Repository<DailyReport>,
  ) {}

  async getDailyReports(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: DailyReport[]; total: number; page: number; pageSize: number }> {
    const [items, total] = await this.dailyReportRepo.findAndCount({
      order: { reportDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async getLatestReport(): Promise<DailyReport | null> {
    return this.dailyReportRepo.findOne({
      order: { reportDate: 'DESC' },
    });
  }

  async getReportByDate(date: Date): Promise<DailyReport | null> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return this.dailyReportRepo.findOne({
      where: { reportDate: startOfDay },
    });
  }
}
