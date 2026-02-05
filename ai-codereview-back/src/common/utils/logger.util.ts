import { Logger, LoggerService } from '@nestjs/common';
import { inspect } from 'util';

/**
 * Log Level Enum
 */
export enum LogLevel {
  LOG = 'log',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Log Context Interface
 */
export interface LogContext {
  module?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Enhanced Logger Utility Class
 * Provides structured logging, context management, performance monitoring, and more
 */
export class LoggerUtil extends Logger {
  protected context?: string;
  private additionalContext: LogContext = {};

  constructor(context?: string, isTimestampEnabled?: boolean) {
    super(context || '', isTimestampEnabled ? { timestamp: isTimestampEnabled } : undefined);
    this.context = context;
  }

  /**
   * Set additional context information
   */
  setContext(context: LogContext): void {
    this.additionalContext = { ...this.additionalContext, ...context };
  }

  /**
   * Clear context information
   */
  clearContext(): void {
    this.additionalContext = {};
  }

  /**
   * Log regular message
   */
  log(message: any, context?: string | LogContext): void {
    const formattedContext = typeof context === 'string' ? context : this.formatContext(context);
    super.log(this.formatMessage(message, context), formattedContext);
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string | LogContext): void {
    const formattedContext = typeof context === 'string' ? context : this.formatContext(context);
    super.error(
      this.formatMessage(message, context),
      trace,
      formattedContext,
    );
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string | LogContext): void {
    const formattedContext = typeof context === 'string' ? context : this.formatContext(context);
    super.warn(this.formatMessage(message, context), formattedContext);
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string | LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const formattedContext = typeof context === 'string' ? context : this.formatContext(context);
      super.debug(this.formatMessage(message, context), formattedContext);
    }
  }

  /**
   * Log verbose message
   */
  verbose(message: any, context?: string | LogContext): void {
    if (process.env.LOG_LEVEL === 'verbose' || process.env.NODE_ENV === 'development') {
      const formattedContext = typeof context === 'string' ? context : this.formatContext(context);
      super.verbose(this.formatMessage(message, context), formattedContext);
    }
  }

  /**
   * Format message
   */
  private formatMessage(message: any, _context?: string | LogContext): string {
    if (typeof message === 'string') {
      return message;
    }

    // Serialize to JSON if object
    try {
      return JSON.stringify(message, null, 2);
    } catch {
      return inspect(message, { depth: 2, colors: true });
    }
  }

  /**
   * Format context
   */
  private formatContext(context?: LogContext): string {
    const mergedContext = { ...this.additionalContext, ...context };

    if (Object.keys(mergedContext).length === 0) {
      return this.context || '';
    }

    const contextParts = [this.context];

    // Add meaningful context information
    if (mergedContext.userId) {
      contextParts.push(`User:${mergedContext.userId}`);
    }
    if (mergedContext.requestId) {
      contextParts.push(`Req:${mergedContext.requestId}`);
    }
    if (mergedContext.method) {
      contextParts.push(mergedContext.method);
    }

    return contextParts.filter(Boolean).join(' | ');
  }

  /**
   * Log API call
   */
  logApiCall(method: string, url: string, duration: number, statusCode: number): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.LOG;
    const message = `${method} ${url} - ${statusCode} - ${duration}ms`;

    this[level](message, `${this.context || 'API'} | ${method} ${url}`);
  }

  /**
   * Log database operation
   */
  logDatabaseQuery(query: string, params: any[], duration: number): void {
    this.debug(`DB Query: ${query} - ${duration}ms`, {
      type: 'DATABASE',
      query: query.substring(0, 100), // Limit query length
      params: this.sanitizeParams(params),
      duration,
    });
  }

  /**
   * Log external service call
   */
  logExternalService(service: string, endpoint: string, duration: number, success: boolean): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    const message = `External Service [${service}]: ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`;

    this[level](message, {
      type: 'EXTERNAL_SERVICE',
      service,
      endpoint,
      duration,
      success,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `Performance: ${operation} - ${duration}ms`;

    this[level](message, {
      type: 'PERFORMANCE',
      operation,
      duration,
      ...metadata,
    });
  }

  /**
   * Log business event
   */
  logEvent(eventName: string, data: any, userId?: string): void {
    this.log(`Event: ${eventName}`, {
      type: 'EVENT',
      event: eventName,
      userId,
      data,
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType: string, details: any): void {
    this.warn(`Security Event: ${eventType}`, {
      type: 'SECURITY',
      eventType,
      ...details,
    });
  }

  /**
   * Sanitize parameters (remove sensitive information)
   */
  private sanitizeParams(params: any[]): any {
    return params.map(param => {
      if (!param || typeof param !== 'object') {
        return param;
      }

      const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
      const sanitized = { ...param };

      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      }

      return sanitized;
    });
  }

  /**
   * Create child logger
   */
  child(childContext: string): LoggerUtil {
    const child = new LoggerUtil(
      this.context ? `${this.context}:${childContext}` : childContext,
    );
    child.setContext(this.additionalContext);
    return child;
  }
}

/**
 * Log Manager
 * Singleton pattern for unified logger management
 */
export class LogManager {
  private static instance: LogManager;
  private loggers: Map<string, LoggerUtil> = new Map();

  private constructor() {}

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /**
   * Get or create logger
   */
  getLogger(context: string): LoggerUtil {
    if (!this.loggers.has(context)) {
      this.loggers.set(context, new LoggerUtil(context));
    }
    return this.loggers.get(context)!;
  }

  /**
   * Set global context
   */
  setGlobalContext(context: LogContext): void {
    this.loggers.forEach(logger => {
      logger.setContext(context);
    });
  }

  /**
   * Clear all logger contexts
   */
  clearAllContexts(): void {
    this.loggers.forEach(logger => {
      logger.clearContext();
    });
  }
}

/**
 * Convenience Logger Factory Function
 */
export function createLogger(context: string): LoggerUtil {
  return LogManager.getInstance().getLogger(context);
}

/**
 * Performance Monitoring Decorator
 * Used to automatically record method execution time
 */
export function LogPerformance(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new LoggerUtil(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const operation = operationName || `${target.constructor.name}.${propertyKey}`;

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        logger.logPerformance(operation, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Error in ${operation}: ${error.message}`, error.stack, {
          operation,
          duration,
          error,
        });
        throw error;
      }
    };

    return descriptor;
  };
}
