import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { logger as winstonLogger } from '../../config/winston-daily.config';

/**
 * Custom Logger Service
 * Implements NestJS LoggerService interface using Winston as the underlying logging implementation
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: Logger;

  constructor() {
    this.logger = winstonLogger;
  }

  /**
   * Set logger context
   */
  setContext(context: string) {
    this.context = context;
    this.logger = this.logger.child({ context });
  }

  /**
   * Log message
   */
  log(message: any, context?: string) {
    this.printMessage(message, 'info', context);
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string) {
    this.printMessage(message, 'error', context, trace);
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string) {
    this.printMessage(message, 'warn', context);
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string) {
    this.printMessage(message, 'debug', context);
  }

  /**
   * Log verbose message
   */
  verbose(message: any, context?: string) {
    this.printMessage(message, 'verbose', context);
  }

  /**
   * Log HTTP request
   */
  http(message: any, context?: string) {
    this.printMessage(message, 'http', context);
  }

  /**
   * Print log message
   */
  private printMessage(
    message: any,
    level: string,
    context?: string,
    trace?: string,
  ) {
    const ctx = context || this.context || 'Application';

    if (typeof message === 'object') {
      this.logger[level](message, { context: ctx });
    } else {
      this.logger[level](message, { context: ctx, trace });
    }
  }

  /**
   * Create child logger
   */
  child(context: string): LoggerService {
    const childLogger = new LoggerService();
    childLogger.setContext(context);
    return childLogger;
  }
}
