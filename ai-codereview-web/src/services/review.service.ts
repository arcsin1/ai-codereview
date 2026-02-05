import api from '@/lib/api';
import type { Review, PaginatedResponse, ReviewStatistics, ReviewConfig, CreateReviewParams } from '@/types';

export type { Review, ReviewStatistics, ReviewConfig, CreateReviewParams };
export type ReviewListResponse = PaginatedResponse<Review>;

export const getReviewConfigs = async (): Promise<ReviewConfig[]> => {
  return api.get('/reviews/configs').then(res => res.data);
};

export const getReviews = async (params: {
  page?: number;
  limit?: number;
  projectName?: string;
  author?: string;
  reviewType?: 'mr' | 'push';
}): Promise<ReviewListResponse> => {
  return api.get('/reviews', { params }).then(res => res.data);
};

export const getReview = async (id: string): Promise<Review> => {
  return api.get(`/reviews/${id}`).then(res => res.data);
};

export const getStatistics = async (params?: {
  startDate?: string;
  endDate?: string;
  reviewType?: 'mr' | 'push' | 'all';
}): Promise<ReviewStatistics> => {
  return api.get('/reviews/statistics', { params }).then(res => res.data);
};

export const createReview = async (data: CreateReviewParams): Promise<Review> => {
  return api.post('/reviews', data).then(res => res.data);
};
