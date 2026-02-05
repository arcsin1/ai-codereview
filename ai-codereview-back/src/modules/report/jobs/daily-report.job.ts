import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyReport } from '../entities/daily-report.entity';
import { ReviewLog } from '../../review/entities/review-log.entity';

@Injectable()
export class DailyReportJob {
  private readonly logger = new Logger(DailyReportJob.name);

  constructor(
    @InjectRepository(DailyReport)
    private readonly dailyReportRepo: Repository<DailyReport>,
    @InjectRepository(ReviewLog)
    private readonly reviewLogRepo: Repository<ReviewLog>,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 18 * * *', {
    name: 'dailyReport',
    timeZone: 'Asia/Shanghai',
  })
  async generateDailyReport() {
    this.logger.log('Starting daily report generation...');

    const enabled = this.configService.get<string>('DAILY_REPORT_ENABLED') === 'true';
    if (!enabled) {
      this.logger.log('Daily report is disabled');
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    try {
      // Get all review records for today
      const reviews = await this.reviewLogRepo.find({
        where: {
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      if (reviews.length === 0) {
        this.logger.log('No reviews found for today');
        return;
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageScore = reviews.reduce((sum, r) => sum + r.score, 0) / totalReviews;
      const totalAdditions = reviews.reduce((sum, r) => sum + r.additions, 0);
      const totalDeletions = reviews.reduce((sum, r) => sum + r.deletions, 0);

      // Project statistics
      const projectStats = this.calculateProjectStats(reviews);

      // Author statistics
      const authorStats = this.calculateAuthorStats(reviews);

      // Score distribution
      const scoreDistribution = this.calculateScoreDistribution(reviews);

      // Generate summary
      const summary = this.generateSummary({
        totalReviews,
        averageScore,
        totalAdditions,
        totalDeletions,
        projectStats,
        authorStats,
      });

      // Check if today's report already exists
      const existingReport = await this.dailyReportRepo.findOne({
        where: { reportDate: startOfDay },
      });

      if (existingReport) {
        // Update existing report
        Object.assign(existingReport, {
          totalReviews,
          averageScore,
          totalAdditions,
          totalDeletions,
          projectStats,
          authorStats,
          scoreDistribution,
          summary,
        });
        await this.dailyReportRepo.save(existingReport);
        this.logger.log('Daily report updated successfully');
      } else {
        // Create new report
        const report = this.dailyReportRepo.create({
          reportDate: startOfDay,
          totalReviews,
          averageScore,
          totalAdditions,
          totalDeletions,
          projectStats,
          authorStats,
          scoreDistribution,
          summary,
        });
        await this.dailyReportRepo.save(report);
        this.logger.log('Daily report created successfully');
      }
    } catch (error) {
      this.logger.error(`Failed to generate daily report: ${error.message}`);
    }
  }

  private calculateProjectStats(reviews: ReviewLog[]) {
    const stats = {};
    reviews.forEach(review => {
      if (!stats[review.projectName]) {
        stats[review.projectName] = {
          projectName: review.projectName,
          reviewCount: 0,
          totalScore: 0,
          totalAdditions: 0,
          totalDeletions: 0,
        };
      }
      stats[review.projectName].reviewCount++;
      stats[review.projectName].totalScore += review.score;
      stats[review.projectName].totalAdditions += review.additions;
      stats[review.projectName].totalDeletions += review.deletions;
    });

    return Object.values(stats).map((stat: any) => ({
      ...stat,
      averageScore: stat.totalScore / stat.reviewCount,
    }));
  }

  private calculateAuthorStats(reviews: ReviewLog[]) {
    const stats = {};
    reviews.forEach(review => {
      if (!stats[review.author]) {
        stats[review.author] = {
          author: review.author,
          reviewCount: 0,
          totalScore: 0,
        };
      }
      stats[review.author].reviewCount++;
      stats[review.author].totalScore += review.score;
    });

    return Object.values(stats).map((stat: any) => ({
      ...stat,
      averageScore: stat.totalScore / stat.reviewCount,
    }));
  }

  private calculateScoreDistribution(reviews: ReviewLog[]) {
    const distribution = {
      '90-100 (Excellent)': 0,
      '80-89 (Good)': 0,
      '70-79 (Average)': 0,
      '60-69 (Pass)': 0,
      '0-59 (Needs Improvement)': 0,
    };

    reviews.forEach(review => {
      if (review.score >= 90) distribution['90-100 (Excellent)']++;
      else if (review.score >= 80) distribution['80-89 (Good)']++;
      else if (review.score >= 70) distribution['70-79 (Average)']++;
      else if (review.score >= 60) distribution['60-69 (Pass)']++;
      else distribution['0-59 (Needs Improvement)']++;
    });

    return distribution;
  }

  private generateSummary(data: any): string {
    return `Daily Code Review Report

Total Reviews: ${data.totalReviews}
Average Score: ${data.averageScore.toFixed(1)}
Code Changes: +${data.totalAdditions} -${data.totalDeletions}

Participating Projects: ${data.projectStats.length}
Participating Authors: ${data.authorStats.length}

Score Distribution:
${Object.entries(data.scoreDistribution)
  .map(([range, count]) => `  ${range}: ${count}`)
  .join('\n')}

${data.authorStats
  .sort((a, b) => b.reviewCount - a.reviewCount)
  .slice(0, 5)
  .map((author, index) => `  ${index + 1}. ${author.author}: ${author.reviewCount} reviews, average score ${author.averageScore.toFixed(1)}`)
  .join('\n')}`;
  }
}
