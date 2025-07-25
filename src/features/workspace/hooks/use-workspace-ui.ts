// =============================================================================
// WORKSPACE UI HOOK - UI state management for workspace
// =============================================================================

'use client';

import { useState, useCallback } from 'react';

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
  isUploadModalOpen: boolean;
}

interface WorkspaceUIActions {
  setSearchQuery: (query: string) => void;
  setFilterBy: (filter: FilterBy) => void;
  setSortBy: (sort: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useWorkspaceUI(): WorkspaceUIState & WorkspaceUIActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const openUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  return {
    // State
    searchQuery,
    filterBy,
    sortBy,
    sortOrder,
    isUploadModalOpen,

    // Actions
    setSearchQuery,
    setFilterBy,
    setSortBy,
    setSortOrder,
    openUploadModal,
    closeUploadModal,
  };
}
