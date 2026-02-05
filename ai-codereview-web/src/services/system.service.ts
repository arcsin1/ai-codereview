import api from '@/lib/api';

// ==================== Git配置相关 ====================

export const GitProvider = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  GITEA: 'gitea',
} as const;

export type GitProvider = typeof GitProvider[keyof typeof GitProvider];

export interface GitConfig {
  id: string;
  provider: GitProvider;
  url: string;
  accessToken: string;
  description?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGitConfigDto {
  provider: GitProvider;
  url: string;
  accessToken: string;
  description?: string;
  name?: string;
}

export interface UpdateGitConfigDto {
  url?: string;
  accessToken?: string;
  description?: string;
  name?: string;
}

export interface QueryGitConfigDto {
  provider?: GitProvider;
  name?: string;
}

export interface TestGitConfigResult {
  connected: boolean;
  provider: GitProvider;
  url: string;
}

// ==================== 系统配置相关 ====================

export interface SystemConfig {
  id: string;
  key: string;
  category: string;
  value: string;
  description: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemConfigDto {
  key: string;
  category: string;
  value: string;
  description: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isPublic?: boolean;
  isEnabled?: boolean;
}

export interface UpdateSystemConfigDto {
  value?: string;
  description?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isPublic?: boolean;
  isEnabled?: boolean;
}

export interface SystemConfigListResponse {
  items: SystemConfig[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemInfo {
  version: string;
  environment: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  platform: string;
  nodeVersion: string;
}

export const systemService = {
  // ==================== Git配置相关 ====================

  // 获取所有Git配置列表
  getGitConfigs: (params?: QueryGitConfigDto): Promise<GitConfig[]> => {
    return api.get('/git-configs', { params }).then((res: any) => res.data?.items || res.data || []);
  },

  // 获取指定Git配置
  getGitConfigById: (id: string): Promise<GitConfig> => {
    return api.get(`/git-configs/${id}`).then((res: any) => res.data);
  },

  // 按提供商获取Git配置
  getGitConfigsByProvider: (provider: GitProvider): Promise<GitConfig[]> => {
    return api.get(`/git-configs/provider/${provider}`).then((res: any) => res.data || []);
  },

  // 创建Git配置
  createGitConfig: (data: CreateGitConfigDto): Promise<GitConfig> => {
    return api.post('/git-configs', data).then((res: any) => res.data);
  },

  // 更新Git配置
  updateGitConfig: (id: string, data: UpdateGitConfigDto): Promise<GitConfig> => {
    return api.put(`/git-configs/${id}`, data).then((res: any) => res.data);
  },

  // 删除Git配置
  deleteGitConfig: (id: string): Promise<void> => {
    return api.delete(`/git-configs/${id}`);
  },

  // 测试Git配置连接
  testGitConfig: (id: string): Promise<TestGitConfigResult> => {
    return api.post(`/git-configs/${id}/test`).then((res: any) => res.data);
  },

  // ==================== 系统配置相关 ====================

  // 获取公开配置
  getConfig: (): Promise<Record<string, any>> => {
    return api.get('/system/config');
  },

  // 获取所有配置列表
  getConfigs: (params?: {
    category?: string;
    isEnabled?: boolean;
    page?: number;
    limit?: number;
  }): Promise<SystemConfigListResponse> => {
    return api.get('/system/configs', { params }).then((res: any) => res.data);
  },

  // 获取指定配置
  getConfigByKey: (key: string): Promise<SystemConfig> => {
    return api.get(`/system/configs/${key}`).then((res: any) => res.data);
  },

  // 按分类获取配置
  getConfigsByCategory: (category: string): Promise<SystemConfig[]> => {
    return api.get(`/system/configs/category/${category}`).then((res: any) => res.data || []);
  },

  // 创建配置
  createConfig: (data: CreateSystemConfigDto): Promise<SystemConfig> => {
    return api.post('/system/configs', data).then((res: any) => res.data);
  },

  // 更新配置
  updateConfig: (key: string, data: UpdateSystemConfigDto): Promise<SystemConfig> => {
    return api.put(`/system/configs/${key}`, data).then((res: any) => res.data);
  },

  // 批量更新配置
  batchUpdateConfig: (configs: Array<{ key: string; value: string }>): Promise<{ updated: number }> => {
    return api.put('/system/configs/batch', { configs }).then((res: any) => res.data);
  },

  // 删除配置
  deleteConfig: (key: string): Promise<void> => {
    return api.delete(`/system/configs/${key}`);
  },

  // 获取系统信息
  getSystemInfo: (): Promise<SystemInfo> => {
    return api.get('/system/info').then((res: any) => res.data);
  },
};
