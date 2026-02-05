/**
 * Platform Type Enum
 */
export enum PlatformType {
  GITLAB = 'gitlab',
  GITHUB = 'github',
  GITEA = 'gitea',
}

/**
 * Event Type Enum
 */
export enum EventType {
  MERGE_REQUEST = 'merge_request',
  PULL_REQUEST = 'pull_request',
  PUSH = 'push',
}

/**
 * Event Action Enum
 */
export enum EventAction {
  OPEN = 'open',
  UPDATE = 'update',
  PUSH = 'push',
  SYNCHRONIZE = 'synchronize',
  MERGE = 'merge',
  CLOSE = 'close',
  REOPEN = 'reopen',
}

/**
 * Review Severity Enum
 */
export enum ReviewSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Review Status Enum
 */
export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * LLM Provider Enum
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',
  ZHIPUAI = 'zhipuai',
  QWEN = 'qwen',
  OLLAMA = 'ollama',
}

/**
 * Review Style Enum
 */
export enum ReviewStyle {
  PROFESSIONAL = 'professional',
  STRICT = 'strict',
  RELAXED = 'relaxed',
  EDUCATIONAL = 'educational',
}

/**
 * Notification Channel Enum
 */
export enum NotificationChannel {
  DINGTALK = 'dingtalk',
  WECOM = 'wecom',
  FEISHU = 'feishu',
  CUSTOM_WEBHOOK = 'custom',
  EMAIL = 'email',
}

/**
 * Notification Type Enum
 */
export enum NotificationType {
  REVIEW_COMPLETED = 'review_completed',
  REVIEW_FAILED = 'review_failed',
  SYSTEM_ERROR = 'system_error',
  DAILY_REPORT = 'daily_report',
}

/**
 * Timeout Constants (in milliseconds)
 */
export const TIMEOUTS = {
  LLM_API: 120000, // 2 minutes
  WEBHOOK_PROCESSING: 300000, // 5 minutes
  GIT_API: 30000, // 30 seconds
  NOTIFICATION_SEND: 10000, // 10 seconds
} as const;

/**
 * Retry Configuration Constants
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Helper function: Convert enum to array
 */
export function enumToArray<T extends Record<string, string | number>>(enumObj: T): string[] {
  return Object.values(enumObj).filter(value => typeof value === 'string') as string[];
}

/**
 * Helper function: Check if enum value is valid
 */
export function isValidEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: string | number,
): boolean {
  return Object.values(enumObj).includes(value);
}
