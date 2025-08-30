// =============================================================================
// WORKSPACE UI HOOK - UI state management for workspace
// =============================================================================

'use client';

import { useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

type FilterBy = 'all' | 'files' | 'folders';
type SortBy = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

interface WorkspaceUIState {
  searchQuery: string;
  filterBy: FilterBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface WorkspaceUIActions {
  setSearchQuery: (query: string) => void;
  setFilterBy: (filter: FilterBy) => void;
  setSortBy: (sort: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for managing workspace UI state (search, filter, sort)
 * Note: Modal state is managed by the workspace-modal-store directly
 */
export function useWorkspaceUI(): WorkspaceUIState & WorkspaceUIActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  return {
    // State
    searchQuery,
    filterBy,
    sortBy,
    sortOrder,

    // Actions
    setSearchQuery,
    setFilterBy,
    setSortBy,
    setSortOrder,
  };
}
