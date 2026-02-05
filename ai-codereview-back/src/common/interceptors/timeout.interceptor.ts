import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout as rxjsTimeout } from 'rxjs/operators';

/**
 * Timeout Interceptor Options
 */
export interface TimeoutInterceptorOptions {
  timeout: number; // Timeout in milliseconds
  customMessage?: string; // Custom timeout message
}

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Timeout Interceptor
 * Sets timeout for requests to prevent long hangs
 *
 * @example
 * @UseInterceptors(new TimeoutInterceptor(5000))
 * @Get('expensive-operation')
 * async expensiveOperation() {}
 */
@Injectable()
export class TimeoutInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private readonly options: number | TimeoutInterceptorOptions = DEFAULT_TIMEOUT) {
    // Support passing number or options object directly
    if (typeof options === 'number') {
      this.timeout = options;
    } else {
      this.timeout = options.timeout;
      this.customMessage = options.customMessage;
    }
  }

  private readonly timeout: number;
  private readonly customMessage?: string;

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    const request = context.switchToHttp().getRequest();

    // Record request start time
    request.startTime = Date.now();

    return next.handle().pipe(
      rxjsTimeout(this.timeout),
      catchError((err) => {
        // If it's a timeout error
        if (err instanceof TimeoutError) {
          const duration = Date.now() - (request.startTime || Date.now());
          const message = this.customMessage ||
            `Request timeout after ${duration}ms (limit: ${this.timeout}ms)`;

          return throwError(() => new RequestTimeoutException(message));
        }

        // Other errors are thrown directly
        return throwError(() => err);
      }),
    );
  }
}

/**
 * Predefined Timeout Interceptors
 */
export class TimeoutInterceptors {
  /**
   * Fast request interceptor (5 seconds)
   */
  static readonly Fast = new TimeoutInterceptor(5000);

  /**
   * Normal request interceptor (30 seconds)
   */
  static readonly Normal = new TimeoutInterceptor(30000);

  /**
   * Slow request interceptor (2 minutes)
   */
  static readonly Slow = new TimeoutInterceptor(120000);

  /**
   * LLM API request interceptor (3 minutes)
   */
  static readonly LLM = new TimeoutInterceptor(180000);

  /**
   * Git API request interceptor (30 seconds)
   */
  static readonly Git = new TimeoutInterceptor(30000);
}

/**
 * Decorator Factory Function
 * Creates decorator with custom timeout
 */
export function createTimeoutInterceptor(timeoutMs: number) {
  return new TimeoutInterceptor(timeoutMs);
}

/**
 * Timeout Config Interface
 */
export interface TimeoutConfig {
  [key: string]: number;
}

/**
 * Route Timeout Config
 * Can configure different timeout for different routes
 */
export const ROUTE_TIMEOUTS: TimeoutConfig = {
  // LLM related routes
  'POST /api/reviews': 180000, // 3 minutes
  'POST /api/llm/complete': 120000, // 2 minutes

  // Git API related routes
  'GET /api/webhook': 30000, // 30 seconds
  'POST /api/webhook/review': 300000, // 5 minutes (webhook processing may take longer)

  // Default timeout
  default: 30000, // 30 seconds
};

/**
 * Dynamic Timeout Interceptor
 * Automatically selects timeout based on route path
 */
@Injectable()
export class DynamicTimeoutInterceptor<T> implements NestInterceptor<T, T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest();
    const routeKey = this.getRouteKey(request);
    const timeoutMs = ROUTE_TIMEOUTS[routeKey] || ROUTE_TIMEOUTS.default;

    return next.handle().pipe(
      rxjsTimeout(timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException(`Request timeout after ${timeoutMs}ms`));
        }
        return throwError(() => err);
      }),
    );
  }

  /**
   * Get route key
   */
  private getRouteKey(request: any): string {
    const method = request.method?.toUpperCase() || 'GET';
    const route = request.route?.path || request.url;
    return `${method} ${route}`;
  }
}

/**
 * Progress Tracking Timeout Interceptor
 * Logs request progress on timeout
 */
@Injectable()
export class ProgressTrackingTimeoutInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private readonly timeoutMs: number) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    let progressLogged = false;

    // Log at 50%, 75%, 90% of timeout
    const checkIntervals = [
      this.timeoutMs * 0.5,
      this.timeoutMs * 0.75,
      this.timeoutMs * 0.9,
    ];

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      for (const interval of checkIntervals) {
        if (elapsed >= interval && !progressLogged) {
          const percentage = Math.round((elapsed / this.timeoutMs) * 100);
          console.warn(`Request progress: ${percentage}% (${elapsed}ms / ${this.timeoutMs}ms)`);
          progressLogged = true;
          break;
        }
      }
    }, 1000);

    return next.handle().pipe(
      rxjsTimeout(this.timeoutMs),
      catchError((err) => {
        clearInterval(progressTimer);

        if (err instanceof TimeoutError) {
          const duration = Date.now() - startTime;
          console.error(`Request timeout: ${duration}ms exceeded ${this.timeoutMs}ms`);
          return throwError(() =>
            new RequestTimeoutException(
              `Request timeout after ${duration}ms`,
            ),
          );
        }

        return throwError(() => err);
      }),
    );
  }
}

/**
 * Decorator Shortcuts
 */
export const Timeout = {
  /**
   * 5 second timeout
   */
  Fast: () => new TimeoutInterceptor(5000),

  /**
   * 30 second timeout
   */
  Normal: () => new TimeoutInterceptor(30000),

  /**
   * 2 minute timeout
   */
  Slow: () => new TimeoutInterceptor(120000),

  /**
   * 3 minute timeout (LLM)
   */
  LLM: () => new TimeoutInterceptor(180000),

  /**
   * Custom timeout
   */
  Custom: (ms: number) => new TimeoutInterceptor(ms),
};
