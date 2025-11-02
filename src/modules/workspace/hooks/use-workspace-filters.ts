// =============================================================================
// WORKSPACE FILTERS STORE - Zustand State Management
// =============================================================================
// Global filter state for workspace view (grouping, sorting, filtering)
// Used by FilterToolbar, FilterBottomSheet, and all layout components

import { create } from 'zustand';

/**
 * Grouping options for workspace files
 */
export type GroupBy = 'none' | 'email' | 'date' | 'folder' | 'type';

/**
 * Sort field options
 */
export type SortBy = 'name' | 'uploadDate' | 'size';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Workspace filter state
 */
interface WorkspaceFiltersState {
  // Grouping
  groupBy: GroupBy;
  setGroupBy: (groupBy: GroupBy) => void;

  // Sorting
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  setSortOrder: (sortOrder: SortOrder) => void;
  toggleSortOrder: () => void;

  // Filtering
  filterEmail: string | null;
  setFilterEmail: (email: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Reset
  resetFilters: () => void;
}

/**
 * Default filter state
 */
const DEFAULT_STATE = {
  groupBy: 'none' as GroupBy,
  sortBy: 'uploadDate' as SortBy,
  sortOrder: 'desc' as SortOrder,
  filterEmail: null,
  searchQuery: '',
};

/**
 * Zustand store for workspace filters
 *
 * @example
 * ```tsx
 * function FilterToolbar() {
 *   const { groupBy, setGroupBy } = useWorkspaceFilters();
 *
 *   return (
 *     <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
 *       <option value="none">None</option>
 *       <option value="email">By Email</option>
 *       <option value="date">By Date</option>
 *     </select>
 *   );
 * }
 * ```
 */
export const useWorkspaceFilters = create<WorkspaceFiltersState>((set) => ({
  // Initial state
  ...DEFAULT_STATE,

  // Grouping actions
  setGroupBy: (groupBy) => set({ groupBy }),

  // Sorting actions
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  // Filtering actions
  setFilterEmail: (filterEmail) => set({ filterEmail }),

  // Search actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Reset to defaults
  resetFilters: () => set(DEFAULT_STATE),
}));
