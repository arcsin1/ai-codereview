import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * Logs detailed information for each HTTP request including request time, response time, duration, etc.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    // Generate unique request ID
    const requestId = this.generateRequestId();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);

    // Log request start
    this.logRequestStart(request, requestId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logRequestSuccess(request, statusCode, duration, requestId);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logRequestError(request, statusCode, duration, error, requestId);
        },
      }),
    );
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log request start
   */
  private logRequestStart(request: Request, requestId: string): void {
    const { method, url, query, body } = request;

    // Remove sensitive information
    const sanitizedBody = this.sanitizeBody(body);

    this.logger.log(
      `[${requestId}] ${method} ${url} - Request started`,
    );

    // Log detailed information in debug mode
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `[${requestId}] Query: ${JSON.stringify(query)}`,
      );
      this.logger.debug(
        `[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`,
      );
    }
  }

  /**
   * Log request success
   */
  private logRequestSuccess(
    request: Request,
    statusCode: number,
    duration: number,
    requestId: string,
  ): void {
    const { method, url } = request;
    const logLevel = statusCode >= 400 ? 'warn' : 'log';

    this.logger[logLevel](
      `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms`,
    );

    // Slow request warning (over 3 seconds)
    if (duration > 3000) {
      this.logger.warn(
        `[${requestId}] Slow request detected: ${duration}ms`,
      );
    }
  }

  /**
   * Log request error
   */
  private logRequestError(
    request: Request,
    statusCode: number,
    duration: number,
    error: Error,
    requestId: string,
  ): void {
    const { method, url } = request;

    this.logger.error(
      `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms - Error: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Remove sensitive information from request body
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'oldPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

/**
 * Performance Monitoring Interceptor
 * Specifically for recording performance data
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.trackPerformance(request, duration);
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.trackPerformance(request, duration, true);
        },
      }),
    );
  }

  /**
   * Track performance data
   */
  private trackPerformance(request: Request, duration: number, isError = false): void {
    const { method, url, route } = request;
    const routePath = route?.path || url;

    // Log performance metrics
    const metric = {
      method,
      route: routePath,
      duration,
      timestamp: new Date().toISOString(),
      success: !isError,
    };

    // Log at different levels based on duration
    if (duration > 5000) {
      this.logger.warn(`Very slow request: ${method} ${routePath} - ${duration}ms`, metric);
    } else if (duration > 1000) {
      this.logger.log(`Slow request: ${method} ${routePath} - ${duration}ms`, metric);
    } else if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`${method} ${routePath} - ${duration}ms`);
    }
  }
}
