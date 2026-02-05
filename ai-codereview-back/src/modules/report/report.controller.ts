import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getDailyReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.reportService.getDailyReports(page, pageSize);
  }

  @Get('latest')
  async getLatestReport() {
    return this.reportService.getLatestReport();
  }

  @Get('date/:date')
  async getReportByDate(@Param('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.reportService.getReportByDate(date);
  }
}
