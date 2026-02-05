// Import types and enums from webhook-event.interface
import {
  PlatformType,  // Enum can be used as values
  EventType,
  EventAction,
} from './webhook-event.interface';
import type {
  WebhookEvent,
  CodeChange,
  Commit,
} from './webhook-event.interface';

// Re-export for backward compatibility
export { PlatformType, EventType, EventAction };
export type { WebhookEvent, CodeChange, Commit };

/**
 * Platform Adapter Interface
 * Defines the unified interface that different platforms (GitLab/GitHub/Gitea) need to implement
 */
export interface PlatformAdapter {
  readonly platform: PlatformType;

  initialize(baseUrl: string, accessToken: string): void;
  verifyToken(token: string, secret: string): boolean;
  parseEvent(payload: any): WebhookEvent;
  getMergeRequestChanges(mrId: number): Promise<CodeChange[]>;
  getMergeRequestCommits(mrId: number): Promise<Commit[]>;
  addMergeRequestNote(mrId: number, note: string): Promise<void>;
  isBranchProtected(branchName: string): Promise<boolean>;
  getPushChanges(before: string, after: string): Promise<CodeChange[]>;
  getPushCommits(branch: string): Promise<Commit[]>;
  addPushComment(commitId: string, comment: string): Promise<void>;

  // Public methods (implemented in BaseHandler)
  getWebhookData(): any;
  filterChanges(changes: CodeChange[], supportedExtensions?: string[]): Promise<CodeChange[]>;
}
