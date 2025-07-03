/**
 * LinksUIStore - Focused store for UI state management
 * Handles view mode, search, filters, selection, and sorting
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import type { LinkId } from '@/types';

// State interface
interface LinksUIState {
  // View and layout
  viewMode: 'grid' | 'list';
  sortBy: 'createdAt' | 'name' | 'views' | 'uploads' | 'lastActivity';
  sortDirection: 'asc' | 'desc';

  // Search and filtering
  searchQuery: string;
  filterStatus: 'all' | 'active' | 'paused' | 'expired';
  filterType: 'all' | 'base' | 'topic';

  // Selection state
  isMultiSelectMode: boolean;
  selectedLinkIds: Set<LinkId>;

  // Pagination
  currentPage: number;
  itemsPerPage: number;
}

// Initial state
const initialState: LinksUIState = {
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  searchQuery: '',
  filterStatus: 'all',
  filterType: 'all',
  isMultiSelectMode: false,
  selectedLinkIds: new Set(),
  currentPage: 1,
  itemsPerPage: 20,
};

// Pure reducers for UI state
const uiReducers = createReducers<
  LinksUIState,
  {
    setViewMode: (state: LinksUIState, mode: 'grid' | 'list') => LinksUIState;
    setSorting: (
      state: LinksUIState,
      sortBy: LinksUIState['sortBy'],
      direction?: LinksUIState['sortDirection']
    ) => LinksUIState;
    setSearchQuery: (state: LinksUIState, query: string) => LinksUIState;
    setStatusFilter: (
      state: LinksUIState,
      status: LinksUIState['filterStatus']
    ) => LinksUIState;
    setTypeFilter: (
      state: LinksUIState,
      type: LinksUIState['filterType']
    ) => LinksUIState;
    toggleMultiSelectMode: (state: LinksUIState) => LinksUIState;
    selectLink: (state: LinksUIState, linkId: LinkId) => LinksUIState;
    deselectLink: (state: LinksUIState, linkId: LinkId) => LinksUIState;
    toggleLinkSelection: (state: LinksUIState, linkId: LinkId) => LinksUIState;
    selectAllLinks: (state: LinksUIState, linkIds: LinkId[]) => LinksUIState;
    clearSelection: (state: LinksUIState) => LinksUIState;
    setPage: (state: LinksUIState, page: number) => LinksUIState;
    resetFilters: (state: LinksUIState) => LinksUIState;
  }
>({
  setViewMode: (state, mode) => ({
    ...state,
    viewMode: mode,
  }),

  setSorting: (state, sortBy, direction) => ({
    ...state,
    sortBy,
    sortDirection:
      direction ||
      (state.sortBy === sortBy && state.sortDirection === 'desc'
        ? 'asc'
        : 'desc'),
    currentPage: 1, // Reset to first page when sorting changes
  }),

  setSearchQuery: (state, query) => ({
    ...state,
    searchQuery: query,
    currentPage: 1, // Reset to first page when searching
  }),

  setStatusFilter: (state, status) => ({
    ...state,
    filterStatus: status,
    currentPage: 1,
  }),

  setTypeFilter: (state, type) => ({
    ...state,
    filterType: type,
    currentPage: 1,
  }),

  toggleMultiSelectMode: state => ({
    ...state,
    isMultiSelectMode: !state.isMultiSelectMode,
    selectedLinkIds: new Set(), // Clear selection when toggling mode
  }),

  selectLink: (state, linkId) => ({
    ...state,
    selectedLinkIds: new Set([...state.selectedLinkIds, linkId]),
  }),

  deselectLink: (state, linkId) => {
    const newSelection = new Set(state.selectedLinkIds);
    newSelection.delete(linkId);
    return {
      ...state,
      selectedLinkIds: newSelection,
    };
  },

  toggleLinkSelection: (state, linkId) => {
    const newSelection = new Set(state.selectedLinkIds);
    if (newSelection.has(linkId)) {
      newSelection.delete(linkId);
    } else {
      newSelection.add(linkId);
    }
    return {
      ...state,
      selectedLinkIds: newSelection,
    };
  },

  selectAllLinks: (state, linkIds) => ({
    ...state,
    selectedLinkIds: new Set(linkIds),
  }),

  clearSelection: state => ({
    ...state,
    selectedLinkIds: new Set(),
    isMultiSelectMode: false,
  }),

  setPage: (state, page) => ({
    ...state,
    currentPage: Math.max(1, page),
  }),

  resetFilters: state => ({
    ...state,
    searchQuery: '',
    filterStatus: 'all',
    filterType: 'all',
    currentPage: 1,
  }),
});

// Create the store
export const useLinksUIStore = create<
  LinksUIState & ReturnType<typeof convertReducersToActions>
>()(
  devtools(
    (set, get) => ({
      ...initialState,
      ...convertReducersToActions(set as any, uiReducers),
    }),
    { name: 'LinksUIStore' }
  )
);

// Selectors for optimized subscriptions
export const linksUISelectors = {
  viewMode: (state: LinksUIState) => state.viewMode,
  sorting: (state: LinksUIState) => ({
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
  }),
  searchQuery: (state: LinksUIState) => state.searchQuery,
  filters: (state: LinksUIState) => ({
    status: state.filterStatus,
    type: state.filterType,
  }),
  selection: (state: LinksUIState) => ({
    isMultiSelectMode: state.isMultiSelectMode,
    selectedLinkIds: state.selectedLinkIds,
    selectedCount: state.selectedLinkIds.size,
  }),
  pagination: (state: LinksUIState) => ({
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
  }),
  isLinkSelected: (linkId: LinkId) => (state: LinksUIState) =>
    state.selectedLinkIds.has(linkId),
};
