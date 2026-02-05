import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP Exception Filter
 * Unifies all HTTP exception handling, returns standardized error response format
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message
    let message = 'An error occurred';
    let errors: string[] | object | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || responseObj.error || message;

      // Handle class-validator validation errors
      if (Array.isArray(responseObj.message)) {
        errors = responseObj.message;
        message = 'Validation failed';
      } else if (responseObj.error && typeof responseObj.error === 'string') {
        message = responseObj.error;
      }
    }

    // Build error response body
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors: errors || undefined,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception.stack,
      }),
    };

    // Log error
    this.logError(request, status, message, exception);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Log error
   */
  private logError(
    request: Request,
    status: number,
    message: string,
    exception: HttpException
  ): void {
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'Unknown';

    const logMessage = `${method} ${url} - ${status} - ${message}`;

    if (status >= 500) {
      // Server error: log as error
      this.logger.error(
        logMessage,
        exception.stack,
        `HttpExceptionFilter`,
      );
    } else if (status >= 400) {
      // Client error: log as warning
      this.logger.warn(logMessage);
    }

    // Log request details (development only)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Request details: IP=${ip}, UserAgent=${userAgent}`,
      );
    }
  }
}

/**
 * Global Exception Filter
 * Captures all unhandled exceptions (including non-HTTP exceptions)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Log uncaught exception
    this.logger.error(
      `${request.method} ${request.url} - Unhandled Exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(errorResponse);
  }
}
