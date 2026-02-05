// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  createdAt: string;
}

// 审查记录类型
export interface Review {
  id: string;
  reviewType?: 'mr' | 'push';
  projectName: string;
  author: string;
  sourceBranch?: string;
  targetBranch?: string;
  branch?: string;
  score: number;
  url?: string;
  additions: number;
  deletions: number;
  commitMessages?: string;
  createdAt: string;
  updatedAt: number;
  updatedAtDate?: string;
  lastCommitId?: string;
  reviewResult: ReviewResult;
}

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

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewStatistics {
  totalReviews: number;
  mrReviews: number;
  pushReviews: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ReviewConfig {
  id: string;
  reviewStyle: string;
  prompt: string;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewParams {
  reviewType?: 'mr' | 'push';
  projectName: string;
  author: string;
  sourceBranch?: string;
  targetBranch?: string;
  branch?: string;
  score: number;
  reviewResult: any;
  url?: string;
  lastCommitId: string;
  additions: number;
  deletions: number;
  commitMessages?: string;
}

// 统计数据类型

export interface AuthorStats {
  author: string;
  reviewCount: number;
  avgScore: number;
}

export interface ProjectStats {
  projectName: string;
  reviewCount: number;
  avgScore: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  platform: 'gitlab' | 'github' | 'gitea';
  url: string;
  webhookSecret?: string;
  accessToken?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Webhook 日志类型
export interface WebhookLog {
  id: string;
  platform: 'gitlab' | 'github' | 'gitea';
  eventType: string;
  projectName: string;
  projectId: string;
  author: string;
  sourceBranch?: string;
  targetBranch?: string;
  branch?: string;
  success: boolean;
  message: string;
  error?: string;
  processingTime?: number;
  reviewScore?: number;
  rawPayload?: any;
  createdAt: Date;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// LLM 相关类型
export type LLMProvider = 'OPENAI' | 'ANTHROPIC' | 'DEEPSEEK' | 'ZHIPUAI' | 'QWEN' | 'OLLAMA';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  provider: LLMProvider;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderModels {
  provider: LLMProvider;
  models: string[];
}

export interface ProviderCheckResult {
  provider: LLMProvider;
  available: boolean;
}

// System 配置分类
export type SystemConfigCategory = 'general' | 'review' | 'notification' | 'security' | 'integrations';

