import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewLog, ReviewConfigEntity } from './entities';
import { CreateReviewLogDto } from './dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(ReviewLog)
    private readonly reviewLogRepo: Repository<ReviewLog>,
    @InjectRepository(ReviewConfigEntity)
    private readonly reviewConfigRepo: Repository<ReviewConfigEntity>,
  ) {}

  // ========== Review Config ==========

  async getAllReviewConfigs(): Promise<ReviewConfigEntity[]> {
    return this.reviewConfigRepo.find({
      order: { createdAt: 'ASC' },
    });
  }

  async getReviewConfigById(id: string): Promise<ReviewConfigEntity | null> {
    return this.reviewConfigRepo.findOne({ where: { id } });
  }

  // ========== Review Log ==========

  async createReviewLog(dto: CreateReviewLogDto): Promise<ReviewLog> {
    const review = this.reviewLogRepo.create({
      ...dto,
      reviewType: dto.reviewType || 'mr',
      updatedAt: new Date(),
    });
    return this.reviewLogRepo.save(review);
  }

  async getReviewLogs(
    page: number = 1,
    pageSize: number = 20,
    options?: { reviewType?: 'mr' | 'push'; projectName?: string; author?: string },
  ): Promise<{ items: ReviewLog[]; total: number; page: number; pageSize: number }> {
    const whereCondition: any = {};

    if (options?.reviewType) {
      whereCondition.reviewType = options.reviewType;
    }
    if (options?.projectName) {
      whereCondition.projectName = options.projectName;
    }
    if (options?.author) {
      whereCondition.author = options.author;
    }

    const [items, total] = await this.reviewLogRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async getReviewLogById(id: string): Promise<ReviewLog> {
    const review = await this.reviewLogRepo.findOne({ where: { id } });
    if (!review) {
      throw new Error(`Review Log with ID ${id} not found`);
    }
    return review;
  }

  async checkReviewExists(
    projectName: string,
    lastCommitId: string,
    reviewType: 'mr' | 'push',
  ): Promise<boolean> {
    const count = await this.reviewLogRepo.count({
      where: {
        reviewType,
        projectName,
        lastCommitId,
      },
    });
    return count > 0;
  }

  async deleteReviewLog(id: string): Promise<void> {
    await this.reviewLogRepo.delete(id);
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    projectName?: string;
    author?: string;
    reviewType?: 'mr' | 'push' | 'all';
  }) {
    const { page = 1, limit = 10, projectName, author, reviewType = 'all' } = options;

    const whereCondition: any = {};

    if (reviewType !== 'all') {
      whereCondition.reviewType = reviewType;
    }

    if (projectName) {
      whereCondition.projectName = projectName;
    }

    if (author) {
      whereCondition.author = author;
    }

    const [items, total] = await this.reviewLogRepo.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page,
      pageSize: limit,
    };
  }

  async getStatistics(options: {
    startDate?: Date;
    endDate?: Date;
    reviewType?: 'mr' | 'push' | 'all';
  }) {
    const { startDate, endDate, reviewType = 'all' } = options;

    const whereCondition: any = {};

    if (reviewType !== 'all') {
      whereCondition.reviewType = reviewType;
    }

    if (startDate || endDate) {
      whereCondition.createdAt = {} as any;
      if (startDate) {
        whereCondition.createdAt.$gte = startDate;
      }
      if (endDate) {
        whereCondition.createdAt.$lte = endDate;
      }
    }

    const totalCount = await this.reviewLogRepo.count({ where: whereCondition });

    const mrCount = await this.reviewLogRepo.count({
      where: { ...whereCondition, reviewType: 'mr' as const },
    });

    const pushCount = await this.reviewLogRepo.count({
      where: { ...whereCondition, reviewType: 'push' as const },
    });

    return {
      totalReviews: totalCount,
      mrReviews: mrCount,
      pushReviews: pushCount,
      startDate,
      endDate,
    };
  }
}
