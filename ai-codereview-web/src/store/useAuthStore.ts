import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/services/auth.service';
import { storage } from '@/utils/storage';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => void;
}

// 检查是否有 token 需要验证
const checkAuth = async (set: any) => {
  const token = storage.getAccessToken();
  if (!token) {
    set({ isLoading: false });
    return;
  }

  try {
    const userData = await getCurrentUser();
    set({
      user: { ...userData, createdAt: userData.createdAt || new Date().toISOString() },
      accessToken: token,
      refreshToken: storage.getRefreshToken(),
      isAuthenticated: true,
      isLoading: false,
    });
  } catch {
    storage.clearAuth();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await loginApi({ username, password });
          const user = {
            ...response.user,
            createdAt: response.user.createdAt || new Date().toISOString(),
          };

          storage.setAccessToken(response.accessToken);
          storage.setRefreshToken(response.refreshToken);
          storage.setUser(user);

          set({
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await logoutApi();
        } finally {
          get().clearAuth();
        }
      },

      refreshUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const userData = await getCurrentUser();
          set({ user: { ...userData, createdAt: userData.createdAt || new Date().toISOString() } });
        } catch {
          get().clearAuth();
        }
      },

      clearAuth: () => {
        storage.clearAuth();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 初始化认证状态
checkAuth(useAuthStore.setState);
