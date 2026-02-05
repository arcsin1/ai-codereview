import api from '@/lib/api';

// LLM 提供商类型
export type LLMProvider = 'OPENAI' | 'ANTHROPIC' | 'DEEPSEEK' | 'ZHIPUAI' | 'QWEN' | 'OLLAMA';

// 消息类型
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// LLM 响应类型
export interface LLMResponse {
  provider: LLMProvider;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// LLM 完成请求参数
export interface LLMCompletionParams {
  provider: LLMProvider;
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// 提供商模型列表
export interface ProviderModels {
  provider: LLMProvider;
  models: string[];
}

// 提供商可用性检查
export interface ProviderCheckResult {
  provider: LLMProvider;
  available: boolean;
}

export interface LlmConfig {
  id: string;
  provider: string;
  name: string;
  apiKey?: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
  isEnabled: boolean;
  extraConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLlmConfigDto {
  provider: string;
  name: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  extraConfig?: Record<string, any>;
}

export interface UpdateLlmConfigDto {
  provider?: string;
  name?: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  extraConfig?: Record<string, any>;
}

export interface LlmConfigListResponse {
  items: LlmConfig[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// LLM 默认配置
export interface LlmDefaultConfig {
  llm_default_provider: string;
  llm_default_model: string;
}

export const llmService = {
  // 获取 LLM 配置列表
  getConfigs: (params?: {
    provider?: string;
    isEnabled?: boolean;
    page?: number;
    limit?: number;
  }): Promise<LlmConfigListResponse> => {
    return api.get('/llm/configs', { params }).then((res: any) => ({
      items: res.data?.items || [],
      total: res.data?.total || 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(res.data?.total || 0 / (params?.limit || 10)),
    }));
  },

  // 获取 LLM 配置详情
  getConfig: (id: string): Promise<LlmConfig> => {
    return api.get(`/llm/configs/${id}`);
  },

  // 创建 LLM 配置
  createConfig: (data: CreateLlmConfigDto): Promise<LlmConfig> => {
    return api.post('/llm/configs', data);
  },

  // 更新 LLM 配置
  updateConfig: (id: string, data: UpdateLlmConfigDto): Promise<LlmConfig> => {
    return api.put(`/llm/configs/${id}`, data);
  },

  // 删除 LLM 配置
  deleteConfig: (id: string): Promise<void> => {
    return api.delete(`/llm/configs/${id}`);
  },

  // 测试 LLM 配置
  testConfig: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.post(`/llm/configs/${id}/test`);
  },

  // 获取可用的提供商列表
  getProviders: (): Promise<{ providers: LLMProvider[]; count: number }> => {
    return api.get('/llm/providers');
  },

  // 检查提供商是否可用
  checkProvider: (provider: LLMProvider): Promise<ProviderCheckResult> => {
    return api.get(`/llm/providers/${provider}/check`);
  },

  // 获取指定提供商的模型列表
  getProviderModels: (provider: LLMProvider): Promise<ProviderModels> => {
    return api.get(`/llm/providers/${provider}/models`);
  },

  // LLM 文本生成
  complete: (params: LLMCompletionParams): Promise<LLMResponse> => {
    return api.post('/llm/complete', params);
  },

  // LLM 流式文本生成 (返回 SSEReadableStream)
  completeStream: (params: LLMCompletionParams): ReadableStream => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('accessToken');

    const body = JSON.stringify({
      provider: params.provider,
      messages: params.messages,
      model: params.model,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(`${baseUrl}/llm/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body,
          });

          if (!response.ok || !response.body) {
            throw new Error('Stream api failed');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    controller.enqueue(new TextEncoder().encode(data.chunk));
                  }
                } catch {
                  // Ignore parsing errors
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  },

  // 获取默认配置
  getDefaultConfig: (): Promise<LlmDefaultConfig> => {
    return api.get('/llm/default-config');
  },

  // 设置默认提供商
  setDefaultProvider: (value: string): Promise<void> => {
    return api.put('/llm/default-config/provider', { value });
  },

  // 设置默认模型
  setDefaultModel: (value: string): Promise<void> => {
    return api.put('/llm/default-config/model', { value });
  },
};
