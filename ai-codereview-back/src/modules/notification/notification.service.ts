import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import crypto from 'crypto';

export interface ReviewNotification {
  projectName: string;
  author: string;
  score: number;
  url?: string;
  sourceBranch?: string;
  targetBranch?: string;
  reviewContent?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendProjectWebhookNotification(
    data: ReviewNotification,
    webhookType?: 'feishu' | 'dingtalk',
    webhookUrl?: string,
    webhookSecret?: string,
  ): Promise<void> {
    if (!webhookType || !webhookUrl) {
      return;
    }

    const content = this.formatReviewContent(data);

    try {
      switch (webhookType) {
        case 'dingtalk':
          await this.sendDingTalkToUrl(webhookUrl, webhookSecret, content);
          break;
        case 'feishu':
          await this.sendFeishuToUrl(webhookUrl, content);
          break;
        default:
          this.logger.warn(`Unsupported webhook type: ${webhookType}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send ${webhookType} notification: ${error.message}`,
      );
    }
  }

  private async sendDingTalkToUrl(
    webhookUrl: string,
    secret: string | undefined,
    content: string,
  ): Promise<void> {
    let url = webhookUrl;
    if (secret) {
      const timestamp = Date.now();
      const sign = this.sign(secret, timestamp);
      url = `${webhookUrl}&timestamp=${timestamp}&sign=${sign}`;
    }

    await axios.post(url, {
      msgtype: 'markdown',
      markdown: {
        title: 'AI Code Review Result',
        text: content,
      },
    });
    this.logger.log('Dingtalk notification sent successfully');
  }

  private async sendFeishuToUrl(
    webhookUrl: string,
    content: string,
  ): Promise<void> {
    await axios.post(webhookUrl, {
      msg_type: 'interactive',
      card: {
        config: { wide_screen_mode: true },
        elements: [{ tag: 'markdown', content }],
      },
    });
    this.logger.log('Feishu notification sent successfully');
  }

private formatReviewContent(data: ReviewNotification): string {
  this.logger.log('Formatting review content',data);
    const scoreEmoji = data.score >= 90 ? '🟢' : data.score >= 70 ? '🟡' : '🔴';
    const branchInfo = data.sourceBranch && data.targetBranch
      ? `\`${data.sourceBranch}\` → \`${data.targetBranch}\``
      : data.sourceBranch
        ? `\`${data.sourceBranch}\``
        : '';

    let content = `## AI 代码审查结果 ${scoreEmoji}

**项目**: ${data.projectName}
**作者**: ${data.author}
**得分**: ${data.score} 分 ${scoreEmoji}
**分支**: ${branchInfo}
**链接**: ${data.url || '无'}

---

`;

    if (data.reviewContent) {
      content += data.reviewContent;
    }

    content += `


---
*由 AI Code Review System 自动生成*`;

    return content;
  }
  private sign(secret: string, timestamp: number): string {
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(stringToSign);
    return encodeURIComponent(hmac.digest('base64'));
  }
}
