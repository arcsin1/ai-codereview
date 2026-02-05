import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { logger } from '../../config/winston-daily.config';

/**
 * Extended Request interface with requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Winston Logger Middleware
 * Uses Winston to log HTTP request and response information
 */
@Injectable()
export class WinstonLoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = logger.child({ context: 'HTTP-Middleware' });

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    req.startTime = startTime;

    // Generate request ID
    const requestId = this.generateRequestId();
    req.requestId = requestId;

    // Add request ID to response header
    res.setHeader('X-Request-ID', requestId);

    // Log request
    this.logRequest(req, requestId);

    // Listen for response completion event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logResponse(req, res, duration, requestId);
    });

    next();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Log request information
   */
  private logRequest(req: Request, requestId: string): void {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';

    this.logger.http('Incoming request', {
      requestId,
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log response information
   */
  private logResponse(req: Request, res: Response, duration: number, requestId: string): void {
    const { method, url } = req;
    const { statusCode } = res;

    const logData = {
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Determine log level based on status code
    if (statusCode >= 500) {
      this.logger.error('Request failed with server error', logData);
    } else if (statusCode >= 400) {
      this.logger.warn('Request failed with client error', logData);
    } else if (statusCode >= 300) {
      this.logger.info('Request redirected', logData);
    } else {
      this.logger.http('Request completed successfully', logData);
    }

    // Warn on slow requests
    if (duration > 3000) {
      this.logger.warn('Slow request detected', {
        ...logData,
        warning: `Request took ${duration}ms`,
      });
    }
  }
}

/**
 * Development Environment Winston Logger Middleware
 * Only enabled in development environment, logs detailed request/response information
 */
@Injectable()
export class DevWinstonLoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = logger.child({ context: 'Dev-HTTP' });

  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    const startTime = Date.now();
    req.startTime = startTime;

    const requestId = this.generateRequestId();
    req.requestId = requestId;

    // Log detailed request information
    this.logDetailedRequest(req, requestId);

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;

      // Log response data
      const contentType = res.getHeader('Content-Type');
      if (typeof contentType === 'string' && !contentType.includes('application/octet-stream')) {
        const loggerInstance = (req as any).logger;
        if (loggerInstance) {
          loggerInstance.debug('Response data', {
            requestId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            body: loggerInstance._sanitizeResponse(data),
          });
        }
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Log detailed request information
   */
  private logDetailedRequest(req: Request, requestId: string): void {
    const sanitizedData = {
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      body: this._sanitizeBody(req.body),
      headers: this._sanitizeHeaders(req.headers),
      requestId,
    };

    this.logger.debug('Detailed request information', sanitizedData);
  }

  /**
   * Sanitize request body (remove sensitive information)
   */
  private _sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request headers
   */
  private _sanitizeHeaders(headers: any): any {
    const { authorization, cookie, ...sanitized } = headers;

    return {
      ...sanitized,
      ...(authorization && { authorization: 'Bearer ***REDACTED***' }),
      ...(cookie && { cookie: '***REDACTED***' }),
    };
  }

  /**
   * Sanitize response data
   */
  private _sanitizeResponse(data: any): any {
    if (!data) return data;

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const str = JSON.stringify(parsed, null, 2);

      // Limit response log length
      return str.length > 500 ? str.substring(0, 500) + '...' : str;
    } catch {
      return data;
    }
  }
}

/**
 * Winston File Logger Middleware
 * Writes all HTTP requests and responses to log files
 */
@Injectable()
export class WinstonFileLoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = logger.child({ context: 'FileLogger' });

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    req.startTime = startTime;

    const requestId = this.generateRequestId();
    req.requestId = requestId;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.recordLog(req, res, duration, requestId);
    });

    next();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Record log to file
   */
  private recordLog(req: Request, res: Response, duration: number, requestId: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
    };

    this.logger.info('HTTP request log', logEntry);
  }
}
