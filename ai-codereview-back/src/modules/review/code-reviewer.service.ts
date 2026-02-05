import { Injectable, Logger } from '@nestjs/common';
import { LLMFactoryService } from '../llm/factory/llm-factory.service';
import {
  CodeChange,
  Commit,
} from '../../common/interfaces/platform-adapter.interface';

export interface ReviewResult {
  score: number;
  markdown: string;
  issues: ReviewIssue[];
  suggestions: string[];
}

export interface ReviewIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  file: string;
  line: number;
  message: string;
  code?: string;
}

export interface ReviewConfig {
  systemPrompt: string;
  maxTokens?: number;
}

@Injectable()
export class CodeReviewerService {
  private readonly logger = new Logger(CodeReviewerService.name);
  private readonly defaultMaxTokens = 10000;

  constructor(private llmFactory: LLMFactoryService) {}

  async reviewCode(
    changes: CodeChange[],
    commits: Commit[],
    reviewConfig?: ReviewConfig,
  ): Promise<ReviewResult> {
    // Filter and format changes
    const filteredChanges = changes.filter((c) => !c.deletedFile);
    if (filteredChanges.length === 0) {
      return {
        score: 0,
        markdown: '**No Code Changes**\n\nNo code changes detected for review.',
        issues: [],
        suggestions: [],
      };
    }

    // Build commit information
    const commitsText = commits.map((c) => c.title).join('\n');
    const changesText = this.formatChanges(filteredChanges);

    // Token calculation and truncation
    const maxTokens = reviewConfig?.maxTokens || this.defaultMaxTokens;
    const tokenCount = this.countTokens(changesText);
    let finalChangesText = changesText;
    if (tokenCount > maxTokens) {
      this.logger.warn(
        `Token count (${tokenCount}) exceeds max (${maxTokens}), truncating`,
      );
      finalChangesText = this.truncateByTokens(changesText, maxTokens);
    }

    // Build prompt (systemPrompt must come from database)
    const messages = this.buildPrompt(
      commitsText,
      finalChangesText,
      reviewConfig!.systemPrompt,
    );

    // Get global default LLM config from database (is_default=true and is_enabled=true)
    const defaultConfig = await this.llmFactory.getGlobalDefaultConfig();
    const provider = defaultConfig.provider;
    this.logger.log(`Using default LLM provider from database: ${provider}`);
    const response = await this.llmFactory.complete(provider, messages, {
      maxTokens,
    });

    // Parse result
    const result = this.parseReviewResult(response.content);
    this.logger.log(`LLM response content: ${JSON.stringify(result)}`);
    this.logger.debug(`Parsed result: ${JSON.stringify(result)}`);

    this.logger.log(`Review completed, score: ${result.score}`);

    return result;
  }

  private buildPrompt(
    commitsText: string,
    changesText: string,
    systemPrompt: string,
  ): any[] {
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `请审查以下代码变更：

## 提交信息
${commitsText || '无提交信息'}

## 代码变更
\`\`\`diff
${changesText}
\`\`\``,
      },
    ];
  }

  private parseReviewResult(content: string): ReviewResult {
    this.logger.log(`Parsing review result, content length: ${content.length}`);
    this.logger.debug(`Raw content:\n${content.substring(0, 1000)}`);

    // Try to parse as JSON first
    const jsonResult = this.tryParseJson(content);
    if (jsonResult) {
      this.logger.log(`Successfully parsed JSON result, score: ${jsonResult.score}`);
      return jsonResult;
    }

    // Fallback to regex-based parsing for backward compatibility
    this.logger.log(`JSON parsing failed, using fallback regex parsing`);
    return this.parseReviewResultFallback(content);
  }

  /**
   * Try to parse content as JSON format
   */
  private tryParseJson(content: string): ReviewResult | null {
    try {
      // Clean up content - remove markdown code block fences if present
      const cleanedContent = content
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      this.logger.debug(`Cleaned content for JSON parse:\n${cleanedContent.substring(0, 500)}`);

      const parsed = JSON.parse(cleanedContent);

      // Validate required fields
      if (typeof parsed.score !== 'number') {
        this.logger.warn(`JSON parse: missing or invalid score field`);
        return null;
      }

      // Build markdown from structured data for display
      const markdown = this.buildMarkdownFromJson(parsed);

      // Parse issues
      const issues: ReviewIssue[] = (parsed.issues || []).map((issue: any) => ({
        severity: this.parseSeverityFromString(issue.severity),
        file: issue.file || '',
        line: parseInt(issue.line) || 0,
        message: issue.message || '',
        code: issue.code,
      }));

      // Parse suggestions
      const suggestions: string[] = (parsed.suggestions || []).map(
        (s: any) => (typeof s === 'string' ? s : JSON.stringify(s)),
      );

      // Parse strengths (new field)
      const strengths: string[] = (parsed.strengths || []).map(
        (s: any) => (typeof s === 'string' ? s : JSON.stringify(s)),
      );

      // Validate score against issues
      const validatedScore = this.validateScore(parsed.score, issues);

      return {
        score: validatedScore,
        markdown,
        issues,
        suggestions,
      };
    } catch (error) {
      this.logger.debug(`JSON parse failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Build markdown from structured JSON data
   */
  private buildMarkdownFromJson(parsed: any): string {
    const parts: string[] = [];

    // Score
    parts.push(`## Score: ${parsed.score}/100\n`);

    // Summary
    if (parsed.summary) {
      parts.push(`### Summary\n${parsed.summary}\n`);
    }

    // Strengths
    if (parsed.strengths && parsed.strengths.length > 0) {
      parts.push(`### Strengths\n`);
      parsed.strengths.forEach((s: string) => {
        parts.push(`- ${s}\n`);
      });
      parts.push('\n');
    }

    // Issues
    if (parsed.issues && parsed.issues.length > 0) {
      parts.push(`### Issues\n`);
      parsed.issues.forEach((issue: any) => {
        parts.push(`- **File**: ${issue.file}\n`);
        parts.push(`- **Line**: ${issue.line}\n`);
        parts.push(`- **Severity**: ${issue.severity}\n`);
        parts.push(`- **Message**: ${issue.message}\n`);
        if (issue.suggestion) {
          parts.push(`- **Suggestion**: ${issue.suggestion}\n`);
        }
        parts.push('\n');
      });
    }

    // Suggestions
    if (parsed.suggestions && parsed.suggestions.length > 0) {
      parts.push(`### Suggestions\n`);
      parsed.suggestions.forEach((s: string) => {
        parts.push(`- ${s}\n`);
      });
    }

    return parts.join('');
  }

  /**
   * Parse severity from string
   */
  private parseSeverityFromString(
    severity: string,
  ): 'info' | 'warning' | 'error' | 'critical' {
    const lower = (severity || '').toLowerCase();
    if (lower === 'high' || lower === 'critical') return 'critical';
    if (lower === 'medium' || lower === 'error') return 'error';
    if (lower === 'low' || lower === 'warning') return 'warning';
    return 'info';
  }

  /**
   * Validate and adjust score based on issues
   */
  private validateScore(
    originalScore: number,
    issues: ReviewIssue[],
  ): number {
    if (issues.length === 0) return originalScore;

    const hasCritical = issues.some((i) => i.severity === 'critical');
    const hasError = issues.some((i) => i.severity === 'error');

    if (hasCritical && originalScore > 60) {
      this.logger.warn(
        `Score adjusted from ${originalScore} to 60 due to critical issues`,
      );
      return 60;
    }
    if (hasError && originalScore > 75) {
      this.logger.warn(
        `Score adjusted from ${originalScore} to 75 due to error issues`,
      );
      return 75;
    }
    if (issues.length > 0 && originalScore > 85) {
      this.logger.warn(
        `Score adjusted from ${originalScore} to 85 due to issues present`,
      );
      return 85;
    }

    return originalScore;
  }

  /**
   * Fallback: regex-based parsing for backward compatibility
   * @deprecated Use JSON format instead
   */
  private parseReviewResultFallback(content: string): ReviewResult {
    this.logger.log(
      `Using fallback regex parsing (consider switching to JSON format)`,
    );

    // Extract score - try multiple patterns
    let score = 0;
    const patterns = [
      /##\s*Score[：:]\s*(\d+)/i,
      /总分[：:]\s*(\d+)\s*分?/,
      /评分[：:]\s*(\d+)\s*分?/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        score = parseInt(match[1]);
        this.logger.log(`Score matched: ${score}`);
        break;
      }
    }

    if (score === 0) {
      score = 60;
    }

    // Simple issue extraction for fallback
    const issues: ReviewIssue[] = [];
    if (content.includes('high') || content.includes('High')) {
      issues.push({
        severity: 'critical',
        file: 'unknown',
        line: 0,
        message: 'Issues found in code (extracted from fallback)',
      });
    }

    const suggestions: string[] = [];
    const suggestionMatch = content.match(/suggestions?[:\s]+(.*?)(?:\n\n|$)/i);
    if (suggestionMatch) {
      suggestions.push(suggestionMatch[1].trim());
    }

    const markdown = content;

    return { score, markdown, issues, suggestions };
  }

  /**
   * Validate score reasonableness, adjust if score doesn't match content
   */
  private validateAndAdjustScore(
    content: string,
    originalScore: number,
    issues: ReviewIssue[],
  ): number {
    // If issues are already parsed, adjust score based on issues
    if (issues.length > 0) {
      // If there are critical issues but score is high, lower the score
      const hasCritical = issues.some((i) => i.severity === 'critical');
      const hasError = issues.some((i) => i.severity === 'error');

      if (hasCritical && originalScore > 60) {
        return 60;
      }
      if (hasError && originalScore > 75) {
        return 75;
      }
      if (issues.length > 0 && originalScore > 85) {
        return 85;
      }
    }

    // If no issues are parsed, check if content contains serious issue keywords
    if (issues.length === 0) {
      const negativeKeywords = [
        /严重问题/i,
        /高风险/i,
        /安全漏洞/i,
        /可访问性违规/i,
        /强烈建议/i,
        /必须修复/i,
        /critical/i,
        /security vulnerability/i,
        /accessibility violation/i,
      ];

      let negativeCount = 0;
      for (const pattern of negativeKeywords) {
        if (pattern.test(content)) {
          negativeCount++;
        }
      }

      // If multiple negative keywords but high score, lower the score
      if (negativeCount >= 2 && originalScore > 70) {
        return 70;
      }
      if (negativeCount >= 3 && originalScore > 60) {
        return 60;
      }
    }

    return originalScore;
  }

  private parseSeverity(
    text: string,
  ): 'info' | 'warning' | 'error' | 'critical' {
    const lower = text.toLowerCase();
    if (
      lower.includes('高') ||
      lower.includes('critical') ||
      lower.includes('严重')
    )
      return 'critical';
    if (
      lower.includes('中') ||
      lower.includes('error') ||
      lower.includes('错误')
    )
      return 'error';
    if (
      lower.includes('低') ||
      lower.includes('warning') ||
      lower.includes('警告')
    )
      return 'warning';
    return 'info';
  }

  /**
   * Estimate score based on content quality (fallback when LLM doesn't output in format)
   * Scoring criteria:
   * - Content length (at least 300 characters)
   * - Contains issue identification
   * - Contains improvement suggestions
   * - Contains code examples or diff
   */
  private estimateScore(content: string): number {
    let score = 60; // Base score

    // Content length score (+20 points)
    if (content.length > 500) score += 10;
    if (content.length > 1000) score += 10;

    // Points for identifying issues (+15 points)
    const hasIssues = /问题|错误|bug|issue|问题点/.test(content);
    if (hasIssues) score += 15;

    // Points for suggestions (+15 points)
    const hasSuggestions = /建议|推荐|应该|可以考虑|suggestion|recommend/.test(
      content,
    );
    if (hasSuggestions) score += 15;

    // Points for code examples (+10 points)
    const hasCodeExamples = /```|diff|代码示例|example|修正/.test(content);
    if (hasCodeExamples) score += 10;

    // Maximum 100 points
    return Math.min(score, 100);
  }

  private formatChanges(changes: CodeChange[]): string {
    return changes
      .map((change) => {
        const path = change.oldPath || change.newPath;
        return `--- a/${path}\n+++ b/${change.newPath}\n${change.diff}`;
      })
      .join('\n');
  }

  private countTokens(text: string): number {
    // Simple estimation: Chinese ~1.5 token/char, English ~0.75 token/word
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords * 0.75);
  }

  private truncateByTokens(text: string, maxTokens: number): string {
    const lines = text.split('\n');
    let currentTokens = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const lineTokens = this.countTokens(lines[i]);
      if (currentTokens + lineTokens > maxTokens) {
        return lines.slice(i + 1).join('\n');
      }
      currentTokens += lineTokens;
    }

    return text;
  }
}
