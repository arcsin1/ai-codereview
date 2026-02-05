import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console output format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace, ...metadata }) => {
    let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;

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

// Log transport configuration
const transports: winston.transport[] = [
  // Console output
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),

  // Error log file (rotated by date)
  new winston.transports.File({
    filename: path.join(logDir, 'error', 'error-%DATE%.log'),
    level: 'error',
    format: customFormat,
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 14, // Keep for 14 days
  }),

  // Combined log file (rotated by date)
  new winston.transports.File({
    filename: path.join(logDir, 'combined', 'combined-%DATE%.log'),
    format: customFormat,
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 14, // Keep for 14 days
  }),

  // Application log file (rotated by date)
  new winston.transports.File({
    filename: path.join(logDir, 'application', 'application-%DATE%.log'),
    format: customFormat,
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 14, // Keep for 14 days
  }),
];

// Create winston logger instance
export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false, // Do not exit on exceptions
};

// Default logger instance export
export const logger = winston.createLogger(winstonConfig);
