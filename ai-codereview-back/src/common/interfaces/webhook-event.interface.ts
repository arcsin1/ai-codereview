/**
 * Webhook Event Type Definitions
 * Used for unified handling of Webhook events from different platforms
 */

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
  TAG_PUSH = 'tag_push',
  ISSUE = 'issue',
  COMMENT = 'comment',
  WIKI = 'wiki',
  DEPLOYMENT = 'deployment',
  RELEASE = 'release',
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
  DELETE = 'delete',
  CREATE = 'create',
  EDIT = 'edit',
  APPROVE = 'approve',
  UNAPPROVE = 'unapprove',
  COMMENT = 'comment',
}

/**
 * Code Change Interface
 */
export interface CodeChange {
  diff: string;
  newPath: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  deletedFile?: boolean;
  renamedFile?: boolean;
}

/**
 * Commit Info Interface
 */
export interface Commit {
  id: string;
  shortId?: string;
  title: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: string;
  url: string;
}

/**
 * Tag Interface
 */
export interface Tag {
  name: string;
  commit?: string;
  message?: string;
  url?: string;
}

/**
 * User Info Interface
 */
export interface WebhookUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Webhook Event Interface (Core)
 */
export interface WebhookEvent {
  // Platform info
  platform: PlatformType;
  eventType: EventType;
  action: EventAction;

  // Project info
  projectId: string;
  projectName: string;
  projectUrl?: string;
  projectDescription?: string;

  // User info
  author: string;
  authorEmail?: string;
  committer?: string;

  // Branch/Tag info
  sourceBranch?: string;
  targetBranch?: string;
  branch?: string;
  tag?: string;

  // MR/PR info
  mrId?: number;
  mrTitle?: string;
  mrDescription?: string;
  mrUrl?: string;
  mrState?: string;
  isDraft?: boolean;
  hasConflicts?: boolean;
  workInProgress?: boolean;

  // Commit info
  lastCommitId?: string;
  beforeCommitId?: string;  // Previous commit for push event
  commitCount?: number;
  commitMessages?: string;

  // Other info
  url?: string;
  timestamp?: string;

  // Raw payload (for debugging)
  rawPayload?: any;
}

/**
 * MR/PR Status Enum
 */
export enum MergeRequestStatus {
  OPENED = 'opened',
  CLOSED = 'closed',
  MERGED = 'merged',
  LOCKED = 'locked',
  DRAFT = 'draft',
}

/**
 * Detailed Webhook Event Interface (contains more fields)
 */
export interface DetailedWebhookEvent extends WebhookEvent {
  // Change statistics
  additions?: number;
  deletions?: number;
  changedFiles?: number;

  // Review info
  reviewers?: string[];
  assignees?: string[];
  labels?: string[];
  milestones?: string[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  mergedAt?: string;
  closedAt?: string;

  // Other properties
  totalCommits?: number;
  hasApprovedReviews?: boolean;
  isConfidential?: boolean;
}

/**
 * Webhook Processing Result Interface
 */
export interface WebhookResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  processingTime?: number;
}

/**
 * Push Event Dedicated Interface
 */
export interface PushEvent extends WebhookEvent {
  eventType: EventType.PUSH;
  action: EventAction.PUSH;
  branch: string;
  commits: Commit[];
  totalCommits: number;
  beforeCommitId?: string;
  afterCommitId: string;
  refType?: 'branch' | 'tag';
}

/**
 * MR/PR Event Dedicated Interface
 */
export interface MergeRequestEvent extends WebhookEvent {
  eventType: EventType.MERGE_REQUEST | EventType.PULL_REQUEST;
  mrId: number;
  mrTitle: string;
  mrDescription: string;
  sourceBranch: string;
  targetBranch: string;
  isDraft: boolean;
  hasConflicts: boolean;
  assignees?: string[];
  reviewers?: string[];
}

/**
 * Event Processing Context Interface
 */
export interface EventContext {
  requestId: string;
  platform: PlatformType;
  eventType: EventType;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Event Handler Options Interface
 */
export interface EventHandlerOptions {
  enableDuplicateCheck?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Event Processing Result Details
 */
export interface EventProcessingResult {
  eventId: string;
  success: boolean;
  message: string;
  reviewScore?: number;
  processingTime: number;
  steps: ProcessingStep[];
  warnings?: string[];
  errors?: string[];
}

/**
 * Processing Step Interface
 */
export interface ProcessingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  output?: any;
  error?: string;
}

/**
 * Webhook Config Interface
 */
export interface WebhookConfig {
  enabled: boolean;
  secret: string;
  allowedIps?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  events?: EventType[];
  branches?: {
    include?: string[];
    exclude?: string[];
  };
}

/**
 * Event Filter Interface
 */
export interface EventFilter {
  eventType?: EventType[];
  action?: EventAction[];
  branches?: string[];
  users?: string[];
  labels?: string[];
  draftExcluded?: boolean;
}

/**
 * Check if an event matches the filter
 */
export function matchesEventFilter(event: WebhookEvent, filter: EventFilter): boolean {
  // Check event type
  if (filter.eventType && filter.eventType.length > 0) {
    if (!filter.eventType.includes(event.eventType)) {
      return false;
    }
  }

  // Check action
  if (filter.action && filter.action.length > 0) {
    if (!filter.action.includes(event.action)) {
      return false;
    }
  }

  // Check branch
  if (filter.branches && filter.branches.length > 0) {
    const branch = event.sourceBranch || event.targetBranch || event.branch;
    if (!branch || !filter.branches.includes(branch)) {
      return false;
    }
  }

  // Check user
  if (filter.users && filter.users.length > 0) {
    if (!filter.users.includes(event.author)) {
      return false;
    }
  }

  // Exclude Draft MR
  if (filter.draftExcluded && event.isDraft) {
    return false;
  }

  return true;
}

/**
 * Event Transformer Interface (for converting platform-specific format to common format)
 */
export interface EventTransformer {
  transform(payload: any, platform: PlatformType): WebhookEvent;
  validate(payload: any): boolean;
  extractSecret(payload: any): string | null;
}

/**
 * Event Storage Interface (for recording event history)
 */
export interface EventStorage {
  save(event: WebhookEvent, result: EventProcessingResult): Promise<void>;
  find(criteria: Partial<WebhookEvent>): Promise<WebhookEvent[]>;
  count(options?: { startDate?: Date; endDate?: Date }): Promise<number>;
  deleteOlderThan(days: number): Promise<number>;
}
