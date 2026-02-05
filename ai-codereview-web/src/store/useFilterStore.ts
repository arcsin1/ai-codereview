import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReviewFilters {
  projectName?: string;
  author?: string;
  dateRange?: [string, string];
  minScore?: number;
  maxScore?: number;
}

interface FilterState {
  filters: ReviewFilters;

  setProjectName: (name?: string) => void;
  setAuthor: (author?: string) => void;
  setDateRange: (range?: [string, string]) => void;
  setScoreRange: (min?: number, max?: number) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      filters: {},

      setProjectName: (name) =>
        set((state) => ({ filters: { ...state.filters, projectName: name } })),

      setAuthor: (author) =>
        set((state) => ({ filters: { ...state.filters, author } })),

      setDateRange: (range) =>
        set((state) => ({ filters: { ...state.filters, dateRange: range } })),

      setScoreRange: (min, max) =>
        set((state) => ({
          filters: { ...state.filters, minScore: min, maxScore: max },
        })),

      clearFilters: () =>
        set({ filters: {} }),
    }),
    {
      name: 'filter-storage',
    }
  )
);
