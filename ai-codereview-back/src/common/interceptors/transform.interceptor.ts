import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * Response Data Interface
 */
export interface ResponseData<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  timestamp: string;
  path: string;
}

/**
 * Response Transform Interceptor
 * Uniformly transforms all responses to standard format
 *
 * Use @UseInterceptors(TransformInterceptor) decorator
 * or globally in main.ts
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard format, return directly
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Build standard response format
        const statusCode = response.statusCode;
        const result: ResponseData<T> = {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        // Only include data on success
        if (result.success) {
          result.data = data;
        }

        // If data contains message, extract it
        if (data && typeof data === 'object' && 'message' in data && !('data' in data)) {
          result.message = (data as any).message;
          result.data = data;
        }

        return result;
      }),
    );
  }
}

/**
 * Simplified Response Transform Interceptor
 * Does not wrap response, returns data directly (for existing standard responses)
 */
@Injectable()
export class SimpleTransformInterceptor<T> implements NestInterceptor<T, T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle();
  }
}

/**
 * Pagination Response Transform Interceptor
 * Specifically handles pagination data response format
 */
@Injectable()
export class PaginationTransformInterceptor<T> implements NestInterceptor<T, ResponseData<any>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<any>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If not pagination data, use standard transform
        if (!data || typeof data !== 'object' || !('items' in data) || !('total' in data)) {
          return {
            success: true,
            statusCode: response.statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            data,
          };
        }

        // Pagination data format
        const { items, total, page, pageSize, ...rest } = data;
        const result: ResponseData<any> = {
          success: true,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          data: {
            items: items || [],
            pagination: {
              total: total || 0,
              page: page || 1,
              pageSize: pageSize || 20,
              totalPages: Math.ceil((total || 0) / (pageSize || 20)),
            },
            ...rest,
          },
        };

        return result;
      }),
    );
  }
}

/**
 * Message Response Transform Interceptor
 * For interfaces that only return messages (like delete, update operations)
 */
@Injectable()
export class MessageTransformInterceptor implements NestInterceptor<any, ResponseData<null>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<null>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Extract message
        const message = data?.message || data?.msg || 'Operation successful';

        return {
          success: true,
          statusCode: response.statusCode,
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
          data: null,
        };
      }),
    );
  }
}

/**
 * Exclude Sensitive Fields Transform Interceptor
 * Automatically removes sensitive fields from response (like passwords, tokens, etc.)
 */
@Injectable()
export class SanitizeTransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  private readonly sensitiveFields = [
    'password',
    'confirmPassword',
    'oldPassword',
    'newPassword',
    'hashedPassword',
    'passwordHash',
    'accessToken',
    'refreshToken',
    'resetToken',
    'verificationToken',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    return next.handle().pipe(
      map((data) => {
        return this.sanitizeData(data);
      }),
    );
  }

  /**
   * Recursively remove sensitive fields
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip if sensitive field
      if (this.sensitiveFields.includes(key)) {
        continue;
      }

      // Recursively process nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Performance Monitoring Transform Interceptor
 * Adds performance metrics to response
 */
@Injectable()
export class PerformanceTransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;

        return {
          success: true,
          statusCode: context.switchToHttp().getResponse().statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          data,
          // Add performance info in development environment
          ...(process.env.NODE_ENV === 'development' && {
            meta: {
              responseTime: `${duration}ms`,
              slow: duration > 1000,
            },
          }),
        };
      }),
    );
  }
}
