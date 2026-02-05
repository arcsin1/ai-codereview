import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  PlatformAdapter,
  PlatformType,
  WebhookEvent,
  CodeChange,
  Commit,
} from '../../../common/interfaces/platform-adapter.interface';

/**
 * Abstract base class - common platform adapter implementation
 * Provides public methods used by all platform handlers
 */
export abstract class BaseHandler implements PlatformAdapter {
  abstract readonly platform: PlatformType;
  protected abstract client: AxiosInstance;
  protected abstract webhookData: any;
  protected abstract logger: Logger;

  /**
   * Initialize client configuration - can be overridden by subclasses
   */
  initialize(baseUrl: string, accessToken: string): void {
    this.client = axios.create({
      baseURL: this.getBaseUrl(baseUrl),
      headers: this.getDefaultHeaders(accessToken),
      timeout: 30000,
    });
    this.logger.log(`${this.constructor.name} initialized with baseURL: ${baseUrl}`);
  }

  /**
   * Get base URL - can be overridden by subclasses
   */
  protected getBaseUrl(baseUrl: string): string {
    return baseUrl;
  }

  /**
   * Get default request headers - can be overridden by subclasses
   */
  protected getDefaultHeaders(accessToken?: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(accessToken && this.getAuthHeader(accessToken)),
    };
  }

  /**
   * Get authentication header - must be overridden by subclasses
   */
  protected abstract getAuthHeader(accessToken: string): Record<string, string>;

  /**
   * Get parent commit ID - common implementation
   */
  protected async getParentCommitId(commitId: string): Promise<string> {
    const { owner, repo } = this.extractRepoInfo();
    const url = this.getCommitUrl(owner, repo, commitId);

    try {
      this.logApiCall('getParentCommitId', url);
      const response = await this.client.get(url);
      this.logApiResponse('getParentCommitId', response.status, 0);

      if (response.data.parents && response.data.parents.length > 0) {
        return response.data.parents[0].sha;
      }
    } catch (error) {
      this.logger.error(`Failed to get parent commit for ${commitId}: ${(error as Error).message}`);
    }
    return '';
  }

  /**
   * Get commit URL - can be overridden by subclasses
   */
  protected abstract getCommitUrl(owner: string, repo: string, commitId: string): string;

  /**
   * Common logic for processing push changes - branch create/delete scenarios
   */
  protected async processPushChanges(
    before: string,
    after: string,
    webhookData: any,
  ): Promise<{ base: string; shouldReturn: boolean; returnValue: CodeChange[] }> {
    let base = before;

    // Handle branch creation scenario
    if (!base || base === '0000000000000000000000000000000000000000' || base.startsWith('0000000')) {
      if (webhookData.created) {
        const commits = webhookData.commits || [];
        if (commits.length > 0) {
          const firstCommitId = commits[0]?.id;
          if (firstCommitId) {
            base = await this.getParentCommitId(firstCommitId);
            this.logger.log(`Branch created, using parent commit ${base} as base`);
          }
        }
      } else if (webhookData.deleted) {
        this.logger.log('Branch deleted, no changes to process');
        return { base: '', shouldReturn: true, returnValue: [] };
      }
    }

    if (!base || !after) {
      this.logger.warn('Cannot get push changes: missing base or after commit');
      return { base: '', shouldReturn: true, returnValue: [] };
    }

    return { base, shouldReturn: false, returnValue: [] };
  }

  /**
   * Extract repository information
   */
  protected extractRepoInfo(fullName?: string): { owner: string; repo: string } {
    const fullNameStr = fullName || this.webhookData.repository?.full_name;
    if (!fullNameStr) {
      this.logger.warn('Repository full_name not found');
      return { owner: '', repo: '' };
    }
    const parts = fullNameStr.split('/');
    return { owner: parts[0] || '', repo: parts[1] || '' };
  }

  /**
   * Count lines with specific prefix in diff
   */
  protected countLines(diff: string, prefix: string): number {
    if (!diff) return 0;
    // Avoid matching ++ or --
    const escapedPrefix = prefix.replace(/[+/]/g, '\\$&');
    const regex = new RegExp(`^${escapedPrefix}[^${escapedPrefix}]`, 'gm');
    return (diff.match(regex) || []).length;
  }

  /**
   * Wildcard match branch name
   */
  protected matchWildcard(pattern: string, text: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    );
    return regex.test(text);
  }

  /**
   * Async delay
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Request executor with retry
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number; retryDelay?: number; onRetry?: (error: Error, attempt: number) => void },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelay = options?.retryDelay ?? 10000;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`,
        );
        if (options?.onRetry) {
          options.onRetry(lastError, attempt);
        }
        if (attempt < maxRetries) {
          await this.sleep(retryDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Filter changes - only keep supported file types
   */
  async filterChanges(
    changes: CodeChange[],
    supportedExtensions?: string[],
  ): Promise<CodeChange[]> {
    const extensions = supportedExtensions || this.getSupportedExtensions();

    return changes
      .filter(c => !c.deletedFile)
      .filter(c =>
        extensions.some(ext => c.newPath?.toLowerCase().endsWith(ext.toLowerCase())),
      )
      .map(c => ({
        diff: c.diff,
        newPath: c.newPath,
        oldPath: c.oldPath,
        additions: c.additions,
        deletions: c.deletions,
        deletedFile: c.deletedFile,
      }));
  }

  /**
   * Get supported file extensions
   */
  protected getSupportedExtensions(): string[] {
    return (
      process.env.SUPPORTED_EXTENSIONS || '.java,.py,.php,.ts,.js,.go,.rust'
    ).split(',').map(ext => ext.trim()).filter(ext => ext);
  }

  /**
   * Log API call
   */
  protected logApiCall(method: string, url: string, attempt?: number): void {
    if (attempt !== undefined) {
      this.logger.debug(`[${this.platform}] ${method} (attempt ${attempt}): ${url}`);
    } else {
      this.logger.debug(`[${this.platform}] ${method}: ${url}`);
    }
  }

  /**
   * Log API response
   */
  protected logApiResponse(method: string, status: number, dataLength: number): void {
    this.logger.debug(
      `[${this.platform}] ${method} response: status=${status}, items=${dataLength}`,
    );
  }

  /**
   * Get webhook data
   */
  getWebhookData(): any {
    return this.webhookData;
  }

  // ============ Interface methods (need to implement in subclasses) ============

  abstract verifyToken(token: string, secret: string): boolean;
  abstract parseEvent(payload: any): WebhookEvent;
  abstract getMergeRequestChanges(mrId: number): Promise<CodeChange[]>;
  abstract getMergeRequestCommits(mrId: number): Promise<Commit[]>;
  abstract addMergeRequestNote(mrId: number, note: string): Promise<void>;
  abstract isBranchProtected(branchName: string): Promise<boolean>;
  abstract getPushChanges(before: string, after: string): Promise<CodeChange[]>;
  abstract getPushCommits(branch: string): Promise<Commit[]>;
  abstract addPushComment(commitId: string, comment: string): Promise<void>;
}
