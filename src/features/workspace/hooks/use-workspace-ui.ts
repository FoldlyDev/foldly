// =============================================================================
// WORKSPACE UI HOOK - UI state management for workspace
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceUploadModal } from '../stores/workspace-modal-store';

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
  openUploadModal: (workspaceId?: string, folderId?: string) => void;
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

  // Use Zustand store for modal state
  const {
    isOpen: isUploadModalOpen,
    openModal,
    closeModal,
  } = useWorkspaceUploadModal();

  const openUploadModal = useCallback(
    (workspaceId?: string, folderId?: string) => {
      openModal(workspaceId, folderId);
    },
    [openModal]
  );

  const closeUploadModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

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
