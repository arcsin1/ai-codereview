/**
 * Code Review Related Interface Definitions
 * Used for type definitions and data processing in the review module
 */

import { PlatformType } from './platform-adapter.interface';

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
 * Review Category Enum
 */
export enum ReviewCategory {
  CODE_STYLE = 'code_style',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BEST_PRACTICE = 'best_practice',
  DOCUMENTATION = 'documentation',
  ERROR_PRONE = 'error_prone',
  MAINTAINABILITY = 'maintainability',
}

/**
 * Review Status Enum
 */
export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Review Issue Interface
 */
export interface ReviewIssue {
  id?: string;
  severity: ReviewSeverity;
  category?: ReviewCategory;
  file: string;
  line: number;
  column?: number;
  message: string;
  code?: string;
  suggestion?: string;
  ruleId?: string;
  url?: string;
}

/**
 * Review Suggestion Interface
 */
export interface ReviewSuggestion {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  codeExample?: {
    before?: string;
    after?: string;
    language?: string;
  };
  references?: string[];
}

/**
 * Review Statistics Interface
 */
export interface ReviewStatistics {
  score: number;
  totalIssues: number;
  criticalIssues: number;
  errorIssues: number;
  warningIssues: number;
  infoIssues: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

/**
 * Review Result Interface
 */
export interface ReviewResult {
  score: number;
  markdown: string;
  issues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
  statistics?: ReviewStatistics;
  summary?: {
    overall: string;
    strengths: string[];
    concerns: string[];
  };
  metadata?: {
    llmProvider: string;
    model: string;
    tokensUsed: number;
    processingTime: number;
    timestamp: string;
  };
}

/**
 * Code Review Request Interface
 */
export interface CodeReviewRequest {
  platform: PlatformType;
  projectName: string;
  changes: CodeChangeInfo[];
  commits: CommitInfo[];
  config?: ReviewConfig;
  metadata?: ReviewMetadata;
}

/**
 * Code Change Info Interface
 */
export interface CodeChangeInfo {
  diff: string;
  newPath: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  deletedFile?: boolean;
  language?: string;
}

/**
 * Commit Info Interface
 */
export interface CommitInfo {
  id: string;
  title: string;
  message: string;
  author: string;
  timestamp: string;
  url: string;
}

/**
 * Review Config Interface
 */
export interface ReviewConfig {
  maxTokens?: number;
  temperature?: number;
  style?: ReviewStyle;
  rules?: ReviewRule[];
  excludePatterns?: string[];
  includePatterns?: string[];
  maxFileSize?: number;
  enableSuggestions?: boolean;
}

/**
 * Review Style Enum
 */
export enum ReviewStyle {
  PROFESSIONAL = 'professional',
  STRICT = 'strict',
  RELAXED = 'relaxed',
  EDUCATIONAL = 'educational',
  SECURITY_FOCUSED = 'security_focused',
  PERFORMANCE_FOCUSED = 'performance_focused',
}

/**
 * Review Rule Interface
 */
export interface ReviewRule {
  id: string;
  name: string;
  description: string;
  category: ReviewCategory;
  severity: ReviewSeverity;
  enabled: boolean;
  patterns?: string[];
  exceptions?: string[];
}

/**
 * Review Metadata Interface
 */
export interface ReviewMetadata {
  projectId?: string;
  projectName: string;
  author: string;
  sourceBranch?: string;
  targetBranch?: string;
  branch?: string;
  mrId?: number;
  mrTitle?: string;
  url?: string;
  lastCommitId?: string;
  triggerType: 'webhook' | 'manual' | 'api';
}

/**
 * MR Review Record Interface
 */
export interface MergeRequestReview {
  id: string;
  projectId?: string;
  projectName: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  score: number;
  reviewResult: ReviewResult;
  url?: string;
  lastCommitId: string;
  additions: number;
  deletions: number;
  commitMessages: string;
  updatedAt: number;
  createdAt: Date;
  status: ReviewStatus;
  processedAt?: Date;
}

/**
 * Push Review Record Interface
 */
export interface PushReview {
  id: string;
  projectId?: string;
  projectName: string;
  author: string;
  branch: string;
  score: number;
  reviewResult: ReviewResult;
  lastCommitId: string;
  additions: number;
  deletions: number;
  commitMessages: string;
  updatedAt: number;
  createdAt: Date;
  status: ReviewStatus;
  processedAt?: Date;
}

/**
 * Review Query Parameters Interface
 */
export interface ReviewQueryParams {
  page?: number;
  pageSize?: number;
  projectName?: string[];
  author?: string[];
  startDate?: string;
  endDate?: string;
  minScore?: number;
  maxScore?: number;
  status?: ReviewStatus[];
  sortBy?: 'createdAt' | 'updatedAt' | 'score';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Review Statistics Aggregation Data Interface
 */
export interface ReviewAggregation {
  totalReviews: number;
  averageScore: number;
  scoreDistribution: ScoreDistribution[];
  authorStats: AuthorStatistic[];
  projectStats: ProjectStatistic[];
  timeSeriesData: TimeSeriesDataPoint[];
  categoryBreakdown: CategoryBreakdown;
}

/**
 * Score Distribution Interface
 */
export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

/**
 * Author Statistics Interface
 */
export interface AuthorStatistic {
  author: string;
  reviewCount: number;
  averageScore: number;
  totalAdditions: number;
  totalDeletions: number;
  bestReview?: number;
  worstReview?: number;
  recentTrend?: 'improving' | 'declining' | 'stable';
}

/**
 * Project Statistics Interface
 */
export interface ProjectStatistic {
  projectName: string;
  reviewCount: number;
  averageScore: number;
  activeAuthors: number;
  totalAdditions: number;
  totalDeletions: number;
  lastReviewAt?: string;
}

/**
 * Time Series Data Point Interface
 */
export interface TimeSeriesDataPoint {
  date: string;
  reviewCount: number;
  averageScore: number;
  additions: number;
  deletions: number;
}

/**
 * Category Breakdown Interface
 */
export interface CategoryBreakdown {
  category: ReviewCategory;
  count: number;
  severity: ReviewSeverity;
  averagePerReview: number;
}

/**
 * Review Trend Analysis Interface
 */
export interface ReviewTrend {
  period: string;
  currentScore: number;
  previousScore: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'stable';
  significant: boolean;
}

/**
 * Batch Review Request Interface
 */
export interface BatchReviewRequest {
  requests: CodeReviewRequest[];
  config?: ReviewConfig;
  concurrency?: number;
}

/**
 * Batch Review Result Interface
 */
export interface BatchReviewResult {
  results: Array<{
    request: CodeReviewRequest;
    result: ReviewResult;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageScore: number;
    totalTime: number;
  };
}

/**
 * Review Comparison Interface
 */
export interface ReviewComparison {
  review1: ReviewResult;
  review2: ReviewResult;
  scoreDifference: number;
  commonIssues: ReviewIssue[];
  uniqueIssues1: ReviewIssue[];
  uniqueIssues2: ReviewIssue[];
  suggestion: string;
}

/**
 * Review Export Config Interface
 */
export interface ReviewExportConfig {
  format: 'json' | 'csv' | 'pdf' | 'markdown';
  includeDetails: boolean;
  includeStatistics: boolean;
  includeIssues: boolean;
  includeSuggestions: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ReviewQueryParams;
}

/**
 * Review Report Interface
 */
export interface ReviewReport {
  title: string;
  description: string;
  period: string;
  summary: ReviewStatistics;
  topIssues: ReviewIssue[];
  recommendations: string[];
  charts: ChartData[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
  };
}

/**
 * Chart Data Interface
 */
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  title: string;
  data: any[];
  options?: any;
}

/**
 * Review History Interface
 */
export interface ReviewHistory {
  reviewId: string;
  timestamp: string;
  changes: ReviewChange[];
  author: string;
  comment?: string;
}

/**
 * Review Change Interface
 */
export interface ReviewChange {
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

/**
 * Helper function: Calculate review statistics
 */
export function calculateReviewStatistics(
  issues: ReviewIssue[],
  additions: number,
  deletions: number,
): ReviewStatistics {
  const criticalIssues = issues.filter(i => i.severity === ReviewSeverity.CRITICAL).length;
  const errorIssues = issues.filter(i => i.severity === ReviewSeverity.ERROR).length;
  const warningIssues = issues.filter(i => i.severity === ReviewSeverity.WARNING).length;
  const infoIssues = issues.filter(i => i.severity === ReviewSeverity.INFO).length;

  // Calculate score (out of 100)
  const score = calculateReviewScore(issues, additions, deletions);

  return {
    score,
    totalIssues: issues.length,
    criticalIssues,
    errorIssues,
    warningIssues,
    infoIssues,
    additions,
    deletions,
    changedFiles: new Set(issues.map(i => i.file)).size,
  };
}

/**
 * Helper function: Calculate review score
 */
function calculateReviewScore(
  issues: ReviewIssue[],
  additions: number,
  deletions: number,
): number {
  let score = 100;

  // Deduct points based on issue severity
  for (const issue of issues) {
    switch (issue.severity) {
      case ReviewSeverity.CRITICAL:
        score -= 20;
        break;
      case ReviewSeverity.ERROR:
        score -= 10;
        break;
      case ReviewSeverity.WARNING:
        score -= 5;
        break;
      case ReviewSeverity.INFO:
        score -= 1;
        break;
    }
  }

  // Adjust score based on code volume
  const totalChanges = additions + deletions;
  if (totalChanges > 0) {
    const issuesPerLine = issues.length / totalChanges;
    if (issuesPerLine > 0.1) {
      score -= 10;
    } else if (issuesPerLine > 0.05) {
      score -= 5;
    }
  }

  // Ensure score is in 0-100 range
  return Math.max(0, Math.min(100, score));
}
