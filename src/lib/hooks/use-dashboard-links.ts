'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  UploadLink,
  LinkType,
  BatchStatus,
  FileProcessingStatus,
} from '@/types';

// Re-export commonly used types for convenience
export type LinkStatus = 'active' | 'paused' | 'expired';
export type ViewType = 'grid' | 'list';
export type SortOption = 'recent' | 'created' | 'uploads' | 'views' | 'name';

// Dashboard-specific adapter type that extends the database schema
// for UI-friendly field names and computed properties
export interface LinkData {
  // Core identification (adapted from UploadLink)
  readonly id: string;
  readonly name: string; // Mapped from UploadLink.title
  readonly slug: string;
  readonly url: string; // Computed field: constructed from slug/topic
  readonly topic?: string;
  readonly linkType: 'base' | 'custom';

  // Status and activity (computed fields)
  readonly status: LinkStatus; // Computed from expiresAt and other factors
  readonly uploads: number; // Mapped from UploadLink.totalUploads
  readonly views: number; // Computed from access logs
  readonly lastActivity: string; // Computed from lastUploadAt

  // Dates (from UploadLink)
  readonly createdAt: string; // ISO string format for UI
  readonly expiresAt: string; // ISO string format, "Never" if null

  // Security controls (from UploadLink)
  readonly isPublic: boolean;
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly passwordHash?: string;

  // File and upload limits (from UploadLink)
  readonly maxFiles: number;
  readonly maxFileSize: number; // in bytes
  readonly allowedFileTypes: string[];

  // Organization settings (from UploadLink)
  readonly autoCreateFolders: boolean;

  // Legacy UI settings for backward compatibility
  readonly settings?: {
    requireEmail: boolean;
    allowMultiple: boolean;
    maxFileSize: string; // Human-readable format like "50MB"
    customMessage: string;
  };
}

// Utility function to convert UploadLink to LinkData for UI consumption
export function adaptUploadLinkForUI(uploadLink: UploadLink): LinkData {
  const baseUrl = 'foldly.com'; // This should come from config
  const url = uploadLink.topic
    ? `${baseUrl}/${uploadLink.slug}/${uploadLink.topic}`
    : `${baseUrl}/${uploadLink.slug}`;

  // Determine status based on expiration and other factors
  const now = new Date();
  const expiresAt = uploadLink.expiresAt
    ? new Date(uploadLink.expiresAt)
    : null;
  const status: LinkStatus =
    expiresAt && expiresAt < now ? 'expired' : 'active'; // TODO: Add paused logic

  return {
    id: uploadLink.id,
    name: uploadLink.title,
    slug: uploadLink.slug,
    url,
    ...(uploadLink.topic && { topic: uploadLink.topic }),
    linkType: uploadLink.topic ? 'custom' : 'base',
    status,
    uploads: uploadLink.totalUploads,
    views: 0, // TODO: Compute from access logs
    lastActivity: uploadLink.lastUploadAt
      ? formatRelativeTime(uploadLink.lastUploadAt)
      : 'No activity',
    createdAt: uploadLink.createdAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : 'Never',
    isPublic: uploadLink.isPublic,
    requireEmail: uploadLink.requireEmail,
    requirePassword: uploadLink.requirePassword,
    ...(uploadLink.passwordHash && { passwordHash: uploadLink.passwordHash }),
    maxFiles: uploadLink.maxFiles,
    maxFileSize: uploadLink.maxFileSize,
    allowedFileTypes: [...(uploadLink.allowedFileTypes || [])],
    autoCreateFolders: uploadLink.autoCreateFolders,
    settings: {
      requireEmail: uploadLink.requireEmail,
      allowMultiple: uploadLink.maxFiles > 1,
      maxFileSize: formatFileSize(uploadLink.maxFileSize),
      customMessage: uploadLink.instructions || '',
    },
  };
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size)}${units[unitIndex]}`;
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

export interface FilterValues extends Record<string, string> {
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
