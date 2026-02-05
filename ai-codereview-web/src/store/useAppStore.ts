import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  loading: boolean;
  currentProject: string | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCurrentProject: (project: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  loading: false,
  currentProject: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),

  setLoading: (loading: boolean) =>
    set({ loading }),

  setCurrentProject: (project: string | null) =>
    set({ currentProject: project }),
}));
