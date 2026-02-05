import api from '@/lib/api';

export type PlatformType = 'gitlab' | 'github' | 'gitea';

export interface Project {
  id: string;
  name: string;
  description?: string;
  platform: PlatformType;
  repositoryUrl: string;
  webhookUrl?: string;
  webhookType?: 'feishu' | 'dingtalk';
  webhookSecret?: string;
  isEnabled: boolean;
  autoReviewEnabled: boolean;
  reviewConfigId?: string;
  reviewConfig?: Record<string, any>;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  platform: PlatformType;
  repositoryUrl: string;
  webhookUrl?: string;
  webhookType?: 'feishu' | 'dingtalk';
  webhookSecret?: string;
  autoReviewEnabled?: boolean;
  reviewConfigId?: string;
  ownerId?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  repositoryUrl?: string;
  webhookUrl?: string;
  webhookType?: 'feishu' | 'dingtalk';
  webhookSecret?: string;
  isEnabled?: boolean;
  autoReviewEnabled?: boolean;
  reviewConfigId?: string;
  ownerId?: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export const projectService = {
  // 获取项目列表
  getProjects: (params?: {
    page?: number;
    pageSize?: number;
    platform?: string;
  }): Promise<ProjectListResponse> => {
    return api.get('/projects', { params });
  },

  // 获取单个项目
  getProject: (id: string): Promise<Project> => {
    return api.get(`/projects/${id}`);
  },

  // 创建项目
  createProject: (data: CreateProjectDto): Promise<Project> => {
    return api.post('/projects', data);
  },

  // 更新项目
  updateProject: (id: string, data: UpdateProjectDto): Promise<Project> => {
    return api.put(`/projects/${id}`, data);
  },

  // 删除项目
  deleteProject: (id: string): Promise<void> => {
    return api.delete(`/projects/${id}`);
  },

  // 切换启用状态
  toggleEnabled: (id: string): Promise<Project> => {
    return api.post(`/projects/${id}/toggle-enabled`);
  },

  // 切换自动审查状态
  toggleAutoReview: (id: string): Promise<Project> => {
    return api.post(`/projects/${id}/toggle-auto-review`);
  },
};
