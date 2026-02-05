import api from '@/lib/api';

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
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}

export interface WebhookLogsResponse {
  items: WebhookLog[];
  total: number;
}

export interface WebhookTestResponse {
  success: boolean;
  message: string;
}

export interface RetryWebhookResponse {
  success: boolean;
  message: string;
}

export const getWebhookLogs = async (params?: {
  page?: number;
  limit?: number;
  projectName?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WebhookLogsResponse> => {
  return api.get('/webhook/logs', { params }).then(res => res.data);
};

export const getWebhookLog = async (id: string): Promise<WebhookLog> => {
  return api.get(`/webhook/logs/${id}`).then(res => res.data);
};

export const testWebhook = async (payload: Record<string, unknown>): Promise<WebhookTestResponse> => {
  return api.post('/webhook/test', payload).then(res => res.data);
};

export const retryWebhook = async (id: string): Promise<RetryWebhookResponse> => {
  return api.post(`/webhook/logs/${id}/retry`).then(res => res.data);
};
