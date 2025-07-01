'use client';

import { useState, useCallback, useMemo } from 'react';

export type LinkStatus = 'active' | 'paused' | 'expired';
export type ViewType = 'grid' | 'list';
export type SortOption = 'recent' | 'created' | 'uploads' | 'views' | 'name';

export interface LinkData {
  id: string;
  name: string;
  slug: string;
  url: string;
  status: LinkStatus;
  uploads: number;
  views: number;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
  linkType: 'base' | 'custom';
  topic?: string;

  // Visibility and Security Controls (from ARCHITECTURE.md)
  isPublic: boolean;
  requireEmail: boolean;
  requirePassword: boolean;
  passwordHash?: string;

  // File and Upload Limits
  maxFiles: number;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[]; // MIME types

  // Organization Settings
  autoCreateFolders: boolean;
  defaultFolderId?: string;

  // Legacy settings (maintaining backward compatibility)
  settings: {
    requireEmail: boolean;
    allowMultiple: boolean;
    maxFileSize: string;
    customMessage: string;
  };
}

export interface FilterValues {
  status: string;
  sortBy: string;
  dateRange: string;
  fileTypes: string;
}

export interface DashboardLinksState {
  // View State
  view: ViewType;
  searchQuery: string;
  filterValues: FilterValues;
  showAdvancedFilters: boolean;

  // Selection State
  selectedLinks: string[];
  selectedLink: string | null;

  // Modal States
  showCreateModal: boolean;
  showTemplates: boolean;
  showLinkDetails: boolean;
  showShareModal: boolean;
  showSettingsModal: boolean;
  activeLink: LinkData | null;
}

const initialFilterValues: FilterValues = {
  status: 'all',
  sortBy: 'recent',
  dateRange: '',
  fileTypes: 'all',
};

const initialState: DashboardLinksState = {
  view: 'grid',
  searchQuery: '',
  filterValues: initialFilterValues,
  showAdvancedFilters: false,
  selectedLinks: [],
  selectedLink: null,
  showCreateModal: false,
  showTemplates: false,
  showLinkDetails: false,
  showShareModal: false,
  showSettingsModal: false,
  activeLink: null,
};

export function useDashboardLinks(initialLinks: LinkData[] = []) {
  const [state, setState] = useState<DashboardLinksState>(initialState);
  const [links] = useState<LinkData[]>(initialLinks);

  // View Actions
  const setView = useCallback((view: ViewType) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setState(prev => ({ ...prev, searchQuery }));
  }, []);

  const setShowAdvancedFilters = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showAdvancedFilters: show }));
  }, []);

  const updateFilter = useCallback((key: keyof FilterValues, value: string) => {
    setState(prev => ({
      ...prev,
      filterValues: { ...prev.filterValues, [key]: value },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filterValues: initialFilterValues,
    }));
  }, []);

  // Selection Actions
  const handleLinkSelect = useCallback(
    (linkId: string) => {
      const link = links.find(l => l.id === linkId);
      if (link) {
        setState(prev => ({
          ...prev,
          activeLink: link,
          showLinkDetails: true,
        }));
      }
    },
    [links]
  );

  const handleMultiSelect = useCallback((linkId: string) => {
    setState(prev => ({
      ...prev,
      selectedLinks: prev.selectedLinks.includes(linkId)
        ? prev.selectedLinks.filter(id => id !== linkId)
        : [...prev.selectedLinks, linkId],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedLinks: [] }));
  }, []);

  // Modal Actions
  const openModal = useCallback(
    (
      modalType: keyof Pick<
        DashboardLinksState,
        | 'showCreateModal'
        | 'showTemplates'
        | 'showLinkDetails'
        | 'showShareModal'
        | 'showSettingsModal'
      >,
      link?: LinkData
    ) => {
      setState(prev => ({
        ...prev,
        [modalType]: true,
        ...(link && { activeLink: link }),
      }));
    },
    []
  );

  const closeModal = useCallback(
    (
      modalType: keyof Pick<
        DashboardLinksState,
        | 'showCreateModal'
        | 'showTemplates'
        | 'showLinkDetails'
        | 'showShareModal'
        | 'showSettingsModal'
      >
    ) => {
      setState(prev => ({
        ...prev,
        [modalType]: false,
        ...(modalType !== 'showCreateModal' &&
          modalType !== 'showTemplates' && { activeLink: null }),
      }));
    },
    []
  );

  // Filtered and Sorted Links
  const filteredLinks = useMemo(() => {
    let filtered = [...links];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        link =>
          link.name.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (state.filterValues.status !== 'all') {
      filtered = filtered.filter(
        link => link.status === state.filterValues.status
      );
    }

    // Apply sorting
    switch (state.filterValues.sortBy) {
      case 'recent':
        filtered.sort(
          (a, b) =>
            new Date(b.lastActivity).getTime() -
            new Date(a.lastActivity).getTime()
        );
        break;
      case 'created':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'uploads':
        filtered.sort((a, b) => b.uploads - a.uploads);
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [links, state.searchQuery, state.filterValues]);

  // Bulk Actions
  const handleBulkAction = useCallback(
    (action: string, selectedItems: string[]) => {
      // Implementation would depend on the specific action
      console.log(`Performing ${action} on items:`, selectedItems);
      // Clear selection after action
      clearSelection();
    },
    [clearSelection]
  );

  return {
    // State
    ...state,
    links: filteredLinks,

    // View Actions
    setView,
    setSearchQuery,
    setShowAdvancedFilters,
    updateFilter,
    clearFilters,

    // Selection Actions
    handleLinkSelect,
    handleMultiSelect,
    clearSelection,

    // Modal Actions
    openModal,
    closeModal,

    // Bulk Actions
    handleBulkAction,
  };
}
