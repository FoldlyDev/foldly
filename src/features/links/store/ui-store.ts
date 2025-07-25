/**
 * Simplified UI Store - 2025 Best Practices
 * Handles ONLY view preferences, search, and basic filters
 * No CRUD operations - just UI state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LinkSortField, LinkType } from '@/lib/supabase/types';

interface UIState {
  // View preferences - persisted for user convenience
  viewMode: 'grid' | 'list';

  // Sorting preferences
  sortBy: LinkSortField;
  sortDirection: 'asc' | 'desc';

  // Search and filters - not persisted, reset on page load
  searchQuery: string;
  filterType: LinkType | 'all';
  filterStatus: 'all' | 'active' | 'paused' | 'expired';
}

interface UIActions {
  // View mode
  setViewMode: (mode: 'grid' | 'list') => void;

  // Sorting
  setSorting: (field: LinkSortField, direction?: 'asc' | 'desc') => void;

  // Search and filters
  setSearchQuery: (query: string) => void;
  setFilterType: (type: LinkType | 'all') => void;
  setFilterStatus: (status: 'all' | 'active' | 'paused' | 'expired') => void;

  // Reset filters
  clearFilters: () => void;
}

// Initial state
const initialState: UIState = {
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  searchQuery: '',
  filterType: 'all',
  filterStatus: 'all',
};

// Create store with persistence for view preferences only
export const useUIStore = create<UIState & UIActions>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        // View mode - persisted
        setViewMode: viewMode => {
          set({ viewMode });
        },

        // Sorting - persisted
        setSorting: (sortBy, direction) => {
          const currentState = get();
          const newDirection =
            direction ||
            (currentState.sortBy === sortBy &&
            currentState.sortDirection === 'desc'
              ? 'asc'
              : 'desc');

          set({
            sortBy,
            sortDirection: newDirection,
          });
        },

        // Search and filters - not persisted
        setSearchQuery: searchQuery => {
          set({ searchQuery });
        },

        setFilterType: filterType => {
          set({ filterType });
        },

        setFilterStatus: filterStatus => {
          set({ filterStatus });
        },

        // Reset filters
        clearFilters: () => {
          set({
            searchQuery: '',
            filterType: 'all',
            filterStatus: 'all',
          });
        },
      }),
      { name: 'UIStore' }
    ),
    {
      name: 'links-ui-preferences',
      // Only persist view preferences, not search/filters
      partialize: state => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      }),
    }
  )
);

// Individual property selectors (no object creation - prevents infinite loops)
export const useViewMode = () => useUIStore(state => state.viewMode);
export const useSearchQuery = () => useUIStore(state => state.searchQuery);
export const useFilterType = () => useUIStore(state => state.filterType);
export const useFilterStatus = () => useUIStore(state => state.filterStatus);
export const useSortBy = () => useUIStore(state => state.sortBy);
export const useSortDirection = () => useUIStore(state => state.sortDirection);
