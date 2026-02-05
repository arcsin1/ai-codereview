import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewLogDto, QueryReviewDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { LoggingInterceptor, TransformInterceptor } from '../../common/interceptors';
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('configs')
  @ApiOperation({ summary: 'Get all review configurations' })
  @ApiResponse({ status: 200, description: 'Query successful' })
  async getConfigs() {
    return this.reviewService.getAllReviewConfigs();
  }

  @Get()
  @ApiOperation({ summary: 'Query review records list' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'projectName', required: false })
  @ApiQuery({ name: 'author', required: false })
  @ApiQuery({ name: 'reviewType', required: false, enum: ['mr', 'push'] })
  @ApiResponse({ status: 200, description: 'Query successful' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('projectName') projectName?: string,
    @Query('author') author?: string,
    @Query('reviewType') reviewType?: 'mr' | 'push',
  ) {
    return this.reviewService.findAll({
      page: page || 1,
      limit: limit || 10,
      projectName,
      author,
      reviewType: reviewType || 'all',
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'reviewType', required: false, enum: ['mr', 'push', 'all'] })
  @ApiResponse({ status: 200, description: 'Success' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('reviewType') reviewType?: 'mr' | 'push' | 'all',
  ) {
    return this.reviewService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      reviewType,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Query review record details' })
  @ApiParam({ name: 'id', description: 'Review record ID' })
  @ApiResponse({ status: 200, description: 'Query successful' })
  async getReviewLog(@Param('id') id: string) {
    return this.reviewService.getReviewLogById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create review record' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async createReviewLog(@Body() dto: CreateReviewLogDto) {
    return this.reviewService.createReviewLog(dto);
  }
}
