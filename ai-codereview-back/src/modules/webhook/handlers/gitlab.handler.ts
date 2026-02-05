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
export class GitlabHandler extends BaseHandler {
  readonly platform = PlatformType.GITLAB;
  protected logger = new Logger(GitlabHandler.name);
  protected client: AxiosInstance;
  protected webhookData: any;
  protected accessToken: string = '';

  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://gitlab.com/api/v4',
      headers: this.getDefaultHeaders(),
      timeout: 30000,
    });
  }

  protected getBaseUrl(baseUrl: string): string {
    return `${baseUrl}/api/v4`;
  }

  protected getAuthHeader(accessToken: string): Record<string, string> {
    return { 'PRIVATE-TOKEN': accessToken || this.accessToken };
  }

  protected getCommitUrl(owner: string, repo: string, commitId: string): string {
    // GitLab uses project path, need to convert
    const projectPath = `${owner}/${repo}`;
    return `/projects/${encodeURIComponent(projectPath)}/repository/commits/${commitId}`;
  }

  /**
   * Initialize client configuration
   */
  initialize(baseUrl: string, accessToken: string): void {
    super.initialize(baseUrl, accessToken);
    this.accessToken = accessToken;
  }

  setWebhookData(data: any): void {
    this.webhookData = data;
  }

  verifyToken(token: string, secret: string): boolean {
    return token === secret || token === this.accessToken;
  }

  parseEvent(payload: any): WebhookEvent {
    this.webhookData = payload;
    const objectKind = payload.object_kind;

    this.logger.log(`Parsing GitLab ${objectKind} event`);

    if (objectKind === 'merge_request') {
      const attrs = payload.object_attributes;
      this.logger.log(`MR #${attrs.iid}: ${attrs.action} - ${payload.project.path_with_namespace}`);

      return {
        platform: PlatformType.GITLAB,
        eventType: EventType.MERGE_REQUEST,
        action: attrs.action as EventAction,
        projectId: String(attrs.target_project_id),
        projectName: payload.project.path_with_namespace || payload.project.name,
        projectUrl: payload.project.web_url,
        author: payload.user.username,
        sourceBranch: attrs.source_branch,
        targetBranch: attrs.target_branch,
        url: attrs.url,
        lastCommitId: attrs.last_commit?.id,
        isDraft: attrs.draft || attrs.work_in_progress,
        mrId: attrs.iid,
      };
    }

    if (objectKind === 'push') {
      const commitCount = payload.commits?.length || 0;
      this.logger.log(`Push to ${payload.project?.path_with_namespace}: ${commitCount} commits`);

      if (payload.commits && payload.commits.length > 0) {
        const firstCommit = payload.commits[0];
        this.logger.log(`First commit info:`, {
          id: firstCommit.id,
          message: firstCommit.message?.substring(0, 50),
          added: firstCommit.added?.length || 0,
          modified: firstCommit.modified?.length || 0,
          removed: firstCommit.removed?.length || 0,
        });
      }

      return {
        platform: PlatformType.GITLAB,
        eventType: EventType.PUSH,
        action: EventAction.PUSH,
        projectId: String(payload.project_id),
        projectName: payload.project?.path_with_namespace || payload.project?.name || '',
        projectUrl: payload.project?.web_url,
        author: payload.user_username,
        branch: payload.ref?.replace('refs/heads/', ''),
        lastCommitId: payload.after,
        beforeCommitId: payload.before,
      };
    }

    if (objectKind === 'note') {
      const noteType = payload.note?.noteable_type || 'unknown';
      this.logger.log(`Note event on ${noteType}: ${payload.note?.note?.substring(0, 50)}...`);

      return {
        platform: PlatformType.GITLAB,
        eventType: EventType.COMMENT,
        action: EventAction.COMMENT,
        projectId: String(payload.project?.id),
        projectName: payload.project?.path_with_namespace || payload.project?.name || '',
        projectUrl: payload.project?.web_url,
        author: payload.user?.username || payload.user?.name || '',
      };
    }

    this.logger.warn(`Unsupported GitLab event type: ${objectKind}, skipping`);
    throw new Error(`Unsupported GitLab event type: ${objectKind}`);
  }

  async getMergeRequestChanges(mrId: number): Promise<CodeChange[]> {
    const projectId = this.webhookData.project?.id;
    const url = `/projects/${projectId}/merge_requests/${mrId}/changes?access_raw_diffs=true`;

    return this.retryWithBackoff(async () => {
      this.logApiCall('getMergeRequestChanges', url);

      const response = await this.client.get(url);
      this.logApiResponse('getMergeRequestChanges', response.status, response.data.changes?.length || 0);

      return (response.data.changes || [])
        .filter((change: any) => !change.deleted_file)
        .map((change: any) => ({
          diff: change.diff,
          newPath: change.new_path,
          oldPath: change.old_path,
          additions: this.countLines(change.diff, '+'),
          deletions: this.countLines(change.diff, '-'),
          deletedFile: change.deleted_file,
        }));
    }, {
      maxRetries: 3,
      retryDelay: 10000,
      onRetry: (error, attempt) => {
        this.logger.warn(`Retry getMergeRequestChanges attempt ${attempt}: ${error.message}`);
      },
    });
  }

  async getMergeRequestCommits(mrId: number): Promise<Commit[]> {
    const projectId = this.webhookData.project?.id;
    const url = `/projects/${projectId}/merge_requests/${mrId}/commits`;

    this.logApiCall('getMergeRequestCommits', url);

    const response = await this.client.get(url);
    this.logApiResponse('getMergeRequestCommits', response.status, response.data.length);

    return response.data.map((commit: any) => ({
      id: commit.id,
      title: commit.title,
      message: commit.message,
      author: commit.author_name,
      timestamp: commit.created_at,
      url: commit.web_url,
    }));
  }

  async addMergeRequestNote(mrId: number, note: string): Promise<void> {
    const projectId = this.webhookData.project?.id;
    const url = `/projects/${projectId}/merge_requests/${mrId}/notes`;

    this.logApiCall('addMergeRequestNote', url);

    await this.client.post(url, { body: note });
    this.logger.log(`Added review note to MR ${mrId}`);
  }

  async isBranchProtected(branchName: string): Promise<boolean> {
    const projectId = this.webhookData.project?.id;
    const url = `/projects/${projectId}/protected_branches`;

    this.logApiCall('isBranchProtected', url);

    const response = await this.client.get(url);
    this.logApiResponse('isBranchProtected', response.status, response.data.length);

    return response.data.some((branch: any) =>
      this.matchWildcard(branch.name, branchName),
    );
  }

  async getPushChanges(before: string, after: string): Promise<CodeChange[]> {
    // GitLab push webhook payload only contains filenames, need to call API to get actual diff
    const projectId = this.webhookData.project_id;
    const branch = this.webhookData.ref?.replace('refs/heads/', '');

    // If before is empty or all zeros (new branch), try to get parent commit from first commit
    let base = before;
    if (!base || base === '0000000000000000000000000000000000000000') {
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

    this.logger.log(`Fetching compare diff between ${base?.substring(0, 8)}...${after?.substring(0, 8)}`);

    const url = `/projects/${encodeURIComponent(projectId)}/repository/compare?from=${base}&to=${after}`;
    const response = await this.client.get(url);

    const diffs = response.data.diffs || [];

    return diffs.map((fileDiff: any) => ({
      diff: fileDiff.diff || '',
      newPath: fileDiff.new_path,
      oldPath: fileDiff.old_path,
      additions: this.countLines(fileDiff.diff, '+'),
      deletions: this.countLines(fileDiff.diff, '-'),
      deletedFile: fileDiff.new_file || false,
    }));
  }

  /**
   * Get parent commit ID - GitLab implementation
   */
  protected async getParentCommitId(commitId: string): Promise<string> {
    const projectId = this.webhookData.project_id;
    const url = `/projects/${encodeURIComponent(projectId)}/repository/commits/${commitId}`;

    try {
      this.logApiCall('getParentCommitId', url);
      const response = await this.client.get(url);
      this.logApiResponse('getParentCommitId', response.status, 0);

      if (response.data.parent_ids && response.data.parent_ids.length > 0) {
        return response.data.parent_ids[0];
      }
    } catch (error) {
      this.logger.error(`Failed to get parent commit for ${commitId}: ${(error as Error).message}`);
    }
    return '';
  }

  async getPushCommits(branch: string): Promise<Commit[]> {
    const projectId = this.webhookData.project_id;
    const url = `/projects/${projectId}/repository/commits`;

    this.logApiCall('getPushCommits', url);

    const response = await this.client.get(url, { params: { ref_name: branch } });
    this.logApiResponse('getPushCommits', response.status, response.data.length);

    return response.data.map((commit: any) => ({
      id: commit.id,
      title: commit.title,
      message: commit.message,
      author: commit.author_name,
      timestamp: commit.created_at,
      url: commit.web_url,
    }));
  }

  async addPushComment(commitId: string, comment: string): Promise<void> {
    const projectId = this.webhookData.project_id;
    const url = `/projects/${projectId}/repository/commits/${commitId}/comments`;

    this.logApiCall('addPushComment', url);

    await this.client.post(url, { note: comment });
    this.logger.log(`Added comment to commit ${commitId}`);
  }
}
