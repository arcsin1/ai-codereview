import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  PlatformAdapter,
  WebhookEvent,
  CodeChange,
  Commit,
  PlatformType,
  EventType,
  EventAction,
} from '../../../common/interfaces/platform-adapter.interface';

@Injectable()
export class GithubHandler implements PlatformAdapter {
  readonly platform = PlatformType.GITHUB;
  private readonly logger = new Logger(GithubHandler.name);
  private client: AxiosInstance;
  private webhookData: any;

  constructor() {
    // Default constructor, configure via initialize later
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Initialize client configuration
   */
  initialize(baseUrl: string, accessToken: string): void {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    this.logger.log(`GithubHandler initialized with baseURL: ${baseUrl}`);
  }

  verifyToken(token: string, secret: string): boolean {
    return token === secret;
  }

  parseEvent(payload: any): WebhookEvent {
    // If payload is an array, use the first element
    if (Array.isArray(payload)) {
      this.logger.warn('GithubHandler: payload is an array, using first element');
      payload = payload[0];
    }

    this.logger.log(`GithubHandler: received payload type=${typeof payload}`);
    this.logger.log(`GithubHandler: payload has payload field: ${!!payload?.payload}`);
    this.logger.log(`GithubHandler: payload keys = ${Object.keys(payload || {}).join(', ')}`);

    // GitHub webhook payload structure:
    // - Direct pull_request, repository, ref fields
    // - If there's a nested payload field (some proxies/configurations may wrap it), unwrap it
    let data = payload;
    if (payload?.payload) {
      if (typeof payload.payload === 'string') {
        // payload is a JSON string, need to parse
        // Verify string starts with { or [, ensure it's a valid JSON object/array
        const trimmedPayload = payload.payload.trim();
        if (trimmedPayload.startsWith('{') || trimmedPayload.startsWith('[')) {
          this.logger.log('GithubHandler: payload is a stringified JSON, parsing...');
          try {
            data = JSON.parse(payload.payload);
          } catch (e) {
            this.logger.error('GithubHandler: failed to parse payload string', e.message);
            data = payload;
          }
        } else {
          this.logger.warn(`GithubHandler: payload field is not valid JSON, value=${payload.payload.substring(0, 100)}`);
          data = payload;
        }
      } else if (typeof payload.payload === 'object' && payload.payload !== null) {
        this.logger.log('GithubHandler: unwrapping nested payload object');
        data = payload.payload;
      }
    }

    this.logger.log(`GithubHandler: data ref=${!!data?.ref}, commits=${!!data?.commits}, pull_request=${!!data?.pull_request}, repository=${!!data?.repository}`);
    this.webhookData = data;

    if (data.pull_request) {
      return {
        platform: PlatformType.GITHUB,
        eventType: EventType.PULL_REQUEST,
        action: this.mapAction(data.action),
        projectId: String(data.repository?.owner?.id || data.repository?.id),
        projectName: data.repository?.full_name || '',
        author: data.pull_request?.user?.login || '',
        sourceBranch: data.pull_request?.head?.ref,
        targetBranch: data.pull_request?.base?.ref,
        url: data.pull_request?.html_url,
        lastCommitId: data.pull_request?.head?.sha,
        isDraft: data.pull_request?.draft || false,
        mrId: data.pull_request?.number,
      };
    }

    if (data.ref && data.commits) {
      return {
        platform: PlatformType.GITHUB,
        eventType: EventType.PUSH,
        action: EventAction.PUSH,
        projectId: String(data.repository?.owner?.id || data.repository?.id),
        projectName: data.repository?.full_name || '',
        author: data.sender?.login || '',
        branch: data.ref.replace('refs/heads/', ''),
        lastCommitId: data.after,
      };
    }

    throw new Error('Unsupported GitHub event type');
  }

  private mapAction(action: string): EventAction {
    const actionMap: Record<string, EventAction> = {
      'opened': EventAction.OPEN,
      'edited': EventAction.UPDATE,
      'synchronize': EventAction.SYNCHRONIZE,
      'closed': EventAction.CLOSE,
      'reopened': EventAction.OPEN,
    };
    return actionMap[action] || EventAction.UPDATE;
  }

  async getMergeRequestChanges(prId: number): Promise<CodeChange[]> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    const response = await this.client.get(
      `/repos/${owner}/${repo}/pulls/${prId}/files`
    );

    return response.data.map((file: any) => ({
      diff: file.patch || '',
      newPath: file.filename,
      oldPath: file.previous_filename,
      additions: file.additions,
      deletions: file.deletions,
      deletedFile: file.status === 'removed',
    }));
  }

  async getMergeRequestCommits(prId: number): Promise<Commit[]> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    const response = await this.client.get(
      `/repos/${owner}/${repo}/pulls/${prId}/commits`
    );

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
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    await this.client.post(
      `/repos/${owner}/${repo}/issues/${prId}/comments`,
      { body: note }
    );
    this.logger.log(`Added review comment to PR ${prId}`);
  }

  async isBranchProtected(branchName: string): Promise<boolean> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/branches/${branchName}/protection`
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getPushChanges(before: string, after: string): Promise<CodeChange[]> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];
    const branch = this.webhookData.ref?.replace('refs/heads/', '');

    // If before is empty, try to get from webhookData
    let base = before;
    if (!base || base === '0000000000000000000000000000000000000000') {
      // GitHub uses empty commit for branch creation, try to get parent commit from first commit
      const commits = this.webhookData.commits || [];
      if (commits.length > 0) {
        const firstCommitId = commits[0]?.id;
        if (firstCommitId) {
          base = await this.getParentCommitId(firstCommitId);
          this.logger.log(`Using parent commit ${base} as base for compare`);
        }
      }
    }

    if (!base || !after) {
      this.logger.warn('Cannot get push changes: missing base or after commit');
      return [];
    }

    const response = await this.client.get(
      `/repos/${owner}/${repo}/compare/${base}...${after}`
    );

    return response.data.files?.map((file: any) => ({
      diff: file.patch || '',
      newPath: file.filename,
      oldPath: file.previous_filename,
      additions: file.additions || 0,
      deletions: file.deletions || 0,
      deletedFile: file.status === 'removed',
    })) || [];
  }

  async getParentCommitId(commitId: string): Promise<string> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/commits/${commitId}`
      );
      if (response.data.parents && response.data.parents.length > 0) {
        return response.data.parents[0].sha;
      }
    } catch (e) {
      this.logger.error(`Failed to get parent commit for ${commitId}: ${e.message}`);
    }
    return '';
  }

  async getPushCommits(branch: string): Promise<Commit[]> {
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    const response = await this.client.get(
      `/repos/${owner}/${repo}/commits`,
      { params: { sha: branch } }
    );

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
    const [owner, repo] = this.webhookData.repository?.full_name?.split('/') || ['', ''];

    await this.client.post(
      `/repos/${owner}/${repo}/commits/${commitId}/comments`,
      { body: comment }
    );
    this.logger.log(`Added comment to commit ${commitId}`);
  }

  /**
   * Get webhook data
   */
  getWebhookData(): any {
    return this.webhookData;
  }

  /**
   * Filter changes - only keep supported file types
   */
  async filterChanges(changes: CodeChange[]): Promise<CodeChange[]> {
    const supportedExtensions = (
      process.env.SUPPORTED_EXTENSIONS || '.java,.py,.php,.ts,.js,.go,.rust'
    ).split(',').map(ext => ext.trim()).filter(ext => ext);

    return changes
      .filter(c => !c.deletedFile)
      .filter(c =>
        supportedExtensions.some(ext => c.newPath?.toLowerCase().endsWith(ext.toLowerCase())),
      )
      .map(c => ({
        diff: c.diff,
        newPath: c.newPath,
        oldPath: c.oldPath,
        additions: c.additions,
        deletions: c.deletions,
      }));
  }
}
