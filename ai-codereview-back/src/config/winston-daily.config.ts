import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
const logDirs = {
  error: path.join(logDir, 'error'),
  combined: path.join(logDir, 'combined'),
  application: path.join(logDir, 'application'),
  http: path.join(logDir, 'http'),
};

// Create all required log directories
Object.values(logDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console output format (with color)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace, ...metadata }) => {
    const ctx = context || 'Application';
    let msg = `${timestamp} [${ctx}] ${level}: ${message}`;

    // If there is additional metadata, add it to the log
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // If there is an error stack trace, add it to the log
    if (trace) {
      msg += `\n${trace}`;
    }

    return msg;
  }),
);

// Common configuration for daily rotate file transport
const dailyRotateOptions = {
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat,
  auditFile: path.join(logDir, '.audit.json'),
};

// Create log transport configuration
const transports: winston.transport[] = [
  // Console output
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),

  // Error log file (daily rotate)
  new DailyRotateFile({
    filename: path.join(logDirs.error, 'error-%DATE%.log'),
    level: 'error',
    ...dailyRotateOptions,
  }),

  // HTTP request log file (daily rotate)
  new DailyRotateFile({
    filename: path.join(logDirs.http, 'http-%DATE%.log'),
    level: 'http',
    ...dailyRotateOptions,
  }),

  // Combined log file (daily rotate)
  new DailyRotateFile({
    filename: path.join(logDirs.combined, 'combined-%DATE%.log'),
    ...dailyRotateOptions,
  }),

  // Application log file (daily rotate)
  new DailyRotateFile({
    filename: path.join(logDirs.application, 'application-%DATE%.log'),
    level: 'info',
    ...dailyRotateOptions,
  }),
];

// Create winston logger instance
export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDirs.error, 'exceptions-%DATE%.log'),
      ...dailyRotateOptions,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDirs.error, 'rejections-%DATE%.log'),
      ...dailyRotateOptions,
    }),
  ],
};

// Default logger instance export
export const logger = winston.createLogger(winstonConfig);
