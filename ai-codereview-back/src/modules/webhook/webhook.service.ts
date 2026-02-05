import { Injectable, Logger } from '@nestjs/common';
import { GitlabHandler } from './handlers/gitlab.handler';
import { GithubHandler } from './handlers/github.handler';
import { GiteaHandler } from './handlers/gitea.handler';
import {
  CodeReviewerService,
  ReviewConfig,
} from '../review/code-reviewer.service';
import { ReviewService } from '../review/review.service';
import { NotificationService } from '../notification/notification.service';
import { ProjectService } from '../project/project.service';
import {
  PlatformAdapter,
  PlatformType,
  EventType,
} from '../../common/interfaces/platform-adapter.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewConfigEntity } from '../review/entities/review-config.entity';
import { GitConfig } from '../git-config/entities/git-config.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly handlers: Record<string, PlatformAdapter>;
  private handlersInitialized = false;

  constructor(
    private gitlabHandler: GitlabHandler,
    private githubHandler: GithubHandler,
    private giteaHandler: GiteaHandler,
    private codeReviewer: CodeReviewerService,
    private reviewService: ReviewService,
    private notificationService: NotificationService,
    private projectService: ProjectService,
    @InjectRepository(ReviewConfigEntity)
    private reviewConfigRepository: Repository<ReviewConfigEntity>,
    @InjectRepository(GitConfig)
    private gitConfigRepository: Repository<GitConfig>,
  ) {
    this.handlers = {
      [PlatformType.GITLAB]: this.gitlabHandler,
      [PlatformType.GITHUB]: this.githubHandler,
      [PlatformType.GITEA]: this.giteaHandler,
    };
  }

  /**
   * Initialize handlers config from database
   */
  private async initializeHandlers(): Promise<void> {
    if (this.handlersInitialized) {
      return;
    }

    try {
      const gitConfigs = await this.gitConfigRepository.find();

      for (const config of gitConfigs) {
        const handler = this.handlers[config.provider];
        if (handler) {
          handler.initialize(config.url, config.accessToken);
          this.logger.log(
            `Initialized ${config.provider} handler: ${config.name}`,
          );
        }
      }

      this.handlersInitialized = true;
    } catch (error) {
      this.logger.error(`Failed to initialize handlers: ${error.message}`);
    }
  }

  async processWebhook(
    payload: any,
    headers: {
      gitlab: { token?: string; event?: string };
      github: { token?: string; event?: string };
      gitea: { token?: string; event?: string };
    },
  ): Promise<any> {
    // Handle GitHub ping event (webhook test)
    if (headers.github?.event === 'ping') {
      this.logger.log('Webhook ping received, responding OK');
      return { success: true, message: 'Webhook configured successfully' };
    }

    await this.initializeHandlers();

    // Prioritize platform detection based on headers
    const platform = this.detectPlatform(headers, payload);
    this.logger.log(`Processing ${platform} webhook event`);

    const handler = this.handlers[platform];
    if (!handler) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const eventData = handler.parseEvent(payload);

    // Use corresponding platform token for verification
    const platformToken = headers[platform]?.token;
    if (platformToken && !handler.verifyToken(platformToken, '')) {
      throw new Error('Token verification failed');
    }

    // Handle COMMENT event (e.g., GitLab note event)
    if (eventData.eventType === EventType.COMMENT) {
      this.logger.log('Comment event received, no action needed');
      return { success: true, message: 'Comment event received' };
    }

    if (
      eventData.eventType === EventType.MERGE_REQUEST ||
      eventData.eventType === EventType.PULL_REQUEST
    ) {
      return this.handleMergeRequest(eventData, handler, platform);
    }

    if (eventData.eventType === EventType.PUSH) {
      return this.handlePush(eventData, handler, platform);
    }

    return { success: true, message: 'Event received' };
  }

  private async handleMergeRequest(
    event: any,
    handler: PlatformAdapter,
    platform: PlatformType,
  ): Promise<any> {
    if (event.isDraft) {
      this.logger.log('Skipping draft MR');
      return { success: true, message: 'Draft MR skipped' };
    }

    // Prioritize projectUrl (actual project URL), fallback to projectName
    const projectIdentifier = event.projectUrl || event.projectName;
    this.logger.log(
      `Looking for project with identifier: ${projectIdentifier}`,
    );

    const project = await this.projectService.findByRepoFullName(
      projectIdentifier,
      platform,
    );
    const reviewConfig = await this.getReviewConfigFromProject(project);

    const changes = await handler.getMergeRequestChanges(event.mrId!);
    const commits = await handler.getMergeRequestCommits(event.mrId!);

    const reviewResult = await this.codeReviewer.reviewCode(
      changes,
      commits,
      reviewConfig,
    );

    await handler.addMergeRequestNote(event.mrId!, reviewResult.markdown);

    await this.sendNotification(
      {
        projectName: projectIdentifier, // Use unified projectIdentifier
        author: event.author,
        score: reviewResult.score,
        url: event.url,
        sourceBranch: event.sourceBranch,
        targetBranch: event.targetBranch,
        reviewContent: reviewResult.markdown,
      },
      platform,
    );

    await this.reviewService.createReviewLog({
      reviewType: 'mr',
      projectName: event.projectName,
      author: event.author,
      sourceBranch: event.sourceBranch!,
      targetBranch: event.targetBranch!,
      score: reviewResult.score,
      reviewResult: reviewResult,
      url: event.url,
      lastCommitId: event.lastCommitId!,
      additions: changes.reduce((sum, c) => sum + c.additions, 0),
      deletions: changes.reduce((sum, c) => sum + c.deletions, 0),
      commitMessages: commits.map((c) => c.title).join('; '),
    });

    return { success: true, score: reviewResult.score };
  }

  private async handlePush(
    event: any,
    handler: PlatformAdapter,
    platform: PlatformType,
  ): Promise<any> {
    // Prioritize projectUrl (actual project URL), fallback to projectName
    const projectIdentifier = event.projectUrl || event.projectName;
    this.logger.log(
      `Looking for project with identifier: ${projectIdentifier}`,
    );

    const project = await this.projectService.findByRepoFullName(
      projectIdentifier,
      platform,
    );
    const reviewConfig = await this.getReviewConfigFromProject(project);

    const webhookCommits = handler['webhookData']?.commits || [];
    if (webhookCommits.length === 0) {
      return { success: true, message: 'No commits in this push' };
    }

    const commits = webhookCommits.map((commit: any) => ({
      id: commit.id,
      title: commit.message?.split('\n')[0] || '',
      message: commit.message || '',
      author: commit.author?.name || commit.author?.username || '',
      timestamp: commit.timestamp || '',
      url: commit.url || '',
    }));

    const changes = await handler.getPushChanges('', event.lastCommitId!);

    const reviewResult = await this.codeReviewer.reviewCode(
      changes,
      commits,
      reviewConfig,
    );

    const latestCommit = commits[commits.length - 1];
    await handler.addPushComment(latestCommit.id, reviewResult.markdown);
    this.logger.log(`Added comment to latest commit: ${latestCommit.id}`);

    await this.sendNotification(
      {
        projectName: projectIdentifier, // Use unified projectIdentifier
        author: event.author,
        score: reviewResult.score,
        url: undefined,
        sourceBranch: event.branch,
        targetBranch: undefined,
        reviewContent: reviewResult.markdown,
      },
      platform,
    );

    await this.reviewService.createReviewLog({
      reviewType: 'push',
      projectName: event.projectName,
      author: event.author,
      branch: event.branch!,
      score: reviewResult.score,
      reviewResult: reviewResult,
      url: latestCommit.url,
      lastCommitId: event.lastCommitId!,
      additions: changes.reduce((sum, c) => sum + c.additions, 0),
      deletions: changes.reduce((sum, c) => sum + c.deletions, 0),
      commitMessages: commits.map((c) => c.title).join('; '),
    });

    return { success: true, score: reviewResult.score };
  }

  /**
   * Detect webhook platform type
   * Priority: headers event > payload structure
   */
  private detectPlatform(
    headers?: {
      gitlab?: { token?: string; event?: string };
      github?: { token?: string; event?: string };
      gitea?: { token?: string; event?: string };
    },
    payload?: any,
  ): PlatformType {
    // 1. First check event headers (most reliable detection method)
    if (headers?.gitlab?.event) {
      this.logger.log('Detected GitLab platform from x-gitlab-event header');
      return PlatformType.GITLAB;
    }
    if (headers?.github?.event) {
      this.logger.log('Detected GitHub platform from x-github-event header');
      return PlatformType.GITHUB;
    }
    if (headers?.gitea?.event) {
      this.logger.log('Detected Gitea platform from x-gitea-event header');
      return PlatformType.GITEA;
    }

    // 2. Then check token headers (secondary detection method)
    if (headers?.gitlab?.token) {
      this.logger.log('Detected GitLab platform from x-gitlab-token header');
      return PlatformType.GITLAB;
    }
    if (headers?.github?.token) {
      this.logger.log('Detected GitHub platform from x-github-token header');
      return PlatformType.GITHUB;
    }
    if (headers?.gitea?.token) {
      this.logger.log('Detected Gitea platform from x-gitea-token header');
      return PlatformType.GITEA;
    }

    // 3. Finally detect based on payload structure (fallback, less reliable)
    if (payload) {
      this.logger.warn(
        'No platform headers found, falling back to payload detection (less reliable)',
      );

      // GitLab feature: object_kind field
      if (payload.object_kind) {
        this.logger.log('Detected GitLab platform from payload.object_kind');
        return PlatformType.GITLAB;
      }

      // GitHub feature: pull_request object or repository.private field
      if (payload.pull_request || payload.repository?.private !== undefined) {
        this.logger.log('Detected GitHub platform from payload structure');
        return PlatformType.GITHUB;
      }

      // GitHub push event: ref and commits fields
      if (payload.ref && payload.commits) {
        this.logger.log('Detected GitHub platform from push payload');
        return PlatformType.GITHUB;
      }

      // Gitea feature: action field
      if (payload.action === 'pull_request' || payload.action === 'push') {
        this.logger.log('Detected Gitea platform from payload.action');
        return PlatformType.GITEA;
      }
    }

    // Default to GitHub (backward compatibility)
    this.logger.warn('Unable to detect platform, defaulting to GitHub');
    return PlatformType.GITHUB;
  }

  private async getReviewConfigFromProject(project: any): Promise<ReviewConfig> {
    // Query review_configs table directly
    let reviewConfig: ReviewConfigEntity | null = null;

    if (project?.reviewConfigId) {
      reviewConfig = await this.reviewConfigRepository.findOneBy({
        id: project.reviewConfigId,
      });
    }

    // If not found, use professional as default
    if (!reviewConfig) {
      reviewConfig = await this.reviewConfigRepository.findOneBy({
        reviewStyle: 'professional',
      });
    }

    if (reviewConfig) {
      return {
        systemPrompt: reviewConfig.prompt,
        maxTokens: reviewConfig.maxTokens,
      };
    }

    // Hardcoded fallback
    return {
      systemPrompt: 'You are a professional code review assistant.',
      maxTokens: 4096,
    };
  }

  private async sendNotification(
    data: {
      projectName: string;
      author: string;
      score: number;
      url?: string;
      sourceBranch?: string;
      targetBranch?: string;
      reviewContent?: string;
    },
    webhookPlatform: PlatformType,
  ): Promise<void> {
    try {
      const project = await this.projectService.findByRepoFullName(
        data.projectName,
        webhookPlatform,
      );

      if (project) {
        this.logger.log(
          `Found project: ${project.name} (platform: ${project.platform})`,
        );

        if (project.webhookUrl && project.webhookType) {
          await this.notificationService.sendProjectWebhookNotification(
            data,
            project.webhookType,
            project.webhookUrl,
            project.webhookSecret,
          );
          this.logger.log(
            `Sent ${project.webhookType} notification for project ${project.name}`,
          );
        }
      } else {
        this.logger.warn(`Project not found for repo: ${data.projectName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  async testConnection(
    payload: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // testConnection doesn't depend on headers, only detects based on payload
      const platform = this.detectPlatform({}, payload);
      const handler = this.handlers[platform];
      handler.parseEvent(payload);
      return {
        success: true,
        message: `${platform} webhook connection successful`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
