// =============================================================================
// LINK UI HOOK - UI state management for link upload
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useLinkUploadModal } from '../stores/link-modal-store';

// =============================================================================
// TYPES
// =============================================================================

type FilterBy = 'all' | 'files' | 'folders';
type SortBy = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

interface LinkUIState {
  searchQuery: string;
  filterBy: FilterBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
  isUploadModalOpen: boolean;
}

interface LinkUIActions {
  setSearchQuery: (query: string) => void;
  setFilterBy: (filter: FilterBy) => void;
  setSortBy: (sort: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  openUploadModal: (linkId?: string, folderId?: string) => void;
  closeUploadModal: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useLinkUI(): LinkUIState & LinkUIActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Use Zustand store for modal state
  const { isOpen: isUploadModalOpen, openModal, closeModal } = useLinkUploadModal();

  const openUploadModal = useCallback((linkId?: string, folderId?: string) => {
    openModal(linkId, folderId);
  }, [openModal]);

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