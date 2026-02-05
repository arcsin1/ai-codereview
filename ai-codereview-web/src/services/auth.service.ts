import api from '@/lib/api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'USER' | 'VIEWER';
    createdAt?: string;
  };
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  return api.post('/auth/login', data);
};

export const logout = async (): Promise<void> => {
  return api.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<AuthResponse['user'] & { createdAt?: string }> => {
  return api.get('/auth/profile');
};

export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  return api.post('/auth/refresh', { refreshToken });
};
