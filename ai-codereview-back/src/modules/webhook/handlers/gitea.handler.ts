import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  PlatformType,
  EventType,
  EventAction,
  WebhookEvent,
  CodeChange,
  Commit,
} from '../../../common/interfaces/platform-adapter.interface';
import { BaseHandler } from './base.handler';

@Injectable()
export class GiteaHandler extends BaseHandler {
  readonly platform = PlatformType.GITEA;
  protected logger = new Logger(GiteaHandler.name);
  protected client: AxiosInstance;
  protected webhookData: any;

  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://gitea.com/api/v1',
      headers: this.getDefaultHeaders(),
      timeout: 30000,
    });
  }

  protected getBaseUrl(baseUrl: string): string {
    return `${baseUrl}/api/v1`;
  }

  protected getAuthHeader(accessToken: string): Record<string, string> {
    return { 'Authorization': `token ${accessToken}` };
  }

  protected getCommitUrl(owner: string, repo: string, commitId: string): string {
    return `/repos/${owner}/${repo}/commits/${commitId}`;
  }

  verifyToken(token: string, secret: string): boolean {
    return token === secret;
  }

  parseEvent(payload: any): WebhookEvent {
    this.webhookData = payload;
    this.logger.log(`Parsing Gitea event: action=${payload.action}, has_pull_request=${!!payload.pull_request}, has_ref=${!!payload.ref}`);

    if (payload.pull_request) {
      return {
        platform: PlatformType.GITEA,
        eventType: EventType.PULL_REQUEST,
        action: this.mapAction(payload.action),
        projectId: String(payload.repository?.owner?.id || payload.repository?.id),
        projectName: payload.repository?.full_name || '',
        author: payload.pull_request?.user?.login || '',
        sourceBranch: payload.pull_request?.head?.ref,
        targetBranch: payload.pull_request?.base?.ref,
        url: payload.pull_request?.html_url,
        lastCommitId: payload.pull_request?.head?.sha,
        isDraft: payload.pull_request?.draft || false,
        mrId: payload.pull_request?.number,
      };
    }

    if (payload.ref && payload.commits) {
      return {
        platform: PlatformType.GITEA,
        eventType: EventType.PUSH,
        action: EventAction.PUSH,
        projectId: String(payload.repository?.owner?.id || payload.repository?.id),
        projectName: payload.repository?.full_name || '',
        author: payload.sender?.login || '',
        branch: payload.ref.replace('refs/heads/', ''),
        lastCommitId: payload.after,
        beforeCommitId: payload.before,
      };
    }

    throw new Error('Unsupported Gitea event type');
  }

  private mapAction(action: string): EventAction {
    const actionMap: Record<string, EventAction> = {
      'opened': EventAction.OPEN,
      'edited': EventAction.UPDATE,
      'synchronized': EventAction.SYNCHRONIZE,
      'closed': EventAction.CLOSE,
    };
    return actionMap[action] || EventAction.UPDATE;
  }

  async getMergeRequestChanges(prId: number): Promise<CodeChange[]> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/pulls/${prId}/files`;

    return this.retryWithBackoff(async () => {
      this.logApiCall('getMergeRequestChanges', url);

      const response = await this.client.get(url);
      this.logApiResponse('getMergeRequestChanges', response.status, response.data.length);

      return response.data.map((file: any) => ({
        diff: file.patch || '',
        newPath: file.filename,
        oldPath: file.previous_filename,
        additions: file.additions,
        deletions: file.deletions,
        deletedFile: file.status === 'removed',
      }));
    }, {
      maxRetries: 3,
      retryDelay: 10000,
      onRetry: (error, attempt) => {
        this.logger.warn(`Retry getMergeRequestChanges attempt ${attempt}: ${error.message}`);
      },
    });
  }

  async getMergeRequestCommits(prId: number): Promise<Commit[]> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/pulls/${prId}/commits`;

    this.logApiCall('getMergeRequestCommits', url);

    const response = await this.client.get(url);
    this.logApiResponse('getMergeRequestCommits', response.status, response.data.length);

    return response.data.map((commit: any) => ({
      id: commit.sha,
      title: commit.commit?.message?.split('\n')[0] || '',
      message: commit.commit?.message || '',
      author: commit.author?.login || commit.commit?.author?.name || '',
      timestamp: commit.commit?.author?.date || '',
      url: commit.html_url || '',
    }));
  }

  async addMergeRequestNote(prId: number, note: string): Promise<void> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/issues/${prId}/comments`;

    this.logApiCall('addMergeRequestNote', url);

    await this.client.post(url, { body: note });
    this.logger.log(`Added review comment to PR ${prId}`);
  }

  async isBranchProtected(branchName: string): Promise<boolean> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/branches/${branchName}/protection`;

    try {
      this.logApiCall('isBranchProtected', url);
      const response = await this.client.get(url);
      this.logApiResponse('isBranchProtected', response.status, 0);
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Failed to check branch protection: ${(error as Error).message}`);
      return false;
    }
  }

  async getPushChanges(before: string, after: string): Promise<CodeChange[]> {
    const { owner, repo } = this.extractRepoInfo();
    const branch = this.webhookData.ref?.replace('refs/heads/', '');

    // Handle branch creation scenario
    let base = before;
    if (!base || base.startsWith('0000000')) {
      if (this.webhookData.created) {
        // Create branch: get parent commit from first commit
        const commits = this.webhookData.commits || [];
        if (commits.length > 0) {
          const firstCommitId = commits[0]?.id;
          if (firstCommitId) {
            base = await this.getParentCommitId(firstCommitId);
            this.logger.log(`Branch created, using parent commit ${base} as base`);
          }
        }
      } else if (this.webhookData.deleted) {
        // Branch deleted, no changes
        this.logger.log('Branch deleted, no changes to process');
        return [];
      }
    }

    if (!base || !after) {
      this.logger.warn('Cannot get push changes: missing base or after commit');
      return [];
    }

    const url = `/repos/${owner}/${repo}/compare/${base}...${after}`;
    this.logApiCall('getPushChanges', url);

    const response = await this.client.get(url);
    this.logApiResponse('getPushChanges', response.status, response.data.files?.length || 0);

    return (response.data.files || []).map((file: any) => ({
      diff: file.patch || '',
      newPath: file.filename,
      oldPath: file.previous_filename,
      additions: file.additions || 0,
      deletions: file.deletions || 0,
      deletedFile: file.status === 'removed',
    }));
  }

  async getPushCommits(branch: string): Promise<Commit[]> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/commits`;

    this.logApiCall('getPushCommits', url);

    const response = await this.client.get(url, { params: { sha: branch } });
    this.logApiResponse('getPushCommits', response.status, response.data.length);

    return response.data.map((commit: any) => ({
      id: commit.sha,
      title: commit.commit?.message?.split('\n')[0] || '',
      message: commit.commit?.message || '',
      author: commit.author?.login || commit.commit?.author?.name || '',
      timestamp: commit.commit?.author?.date || '',
      url: commit.html_url || '',
    }));
  }

  async addPushComment(commitId: string, comment: string): Promise<void> {
    const { owner, repo } = this.extractRepoInfo();
    const url = `/repos/${owner}/${repo}/commits/${commitId}/comments`;

    this.logApiCall('addPushComment', url);

    await this.client.post(url, { body: comment });
    this.logger.log(`Added comment to commit ${commitId}`);
  }
}
