'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import type {
  Link,
  LinkWithStats,
  LinkInsert,
  LinkUpdate,
  LinkType,
  LinkSortField,
} from '@/lib/supabase/types';
import type { DatabaseId, DatabaseResult } from '@/lib/supabase/types';
import { FILE_UPLOAD_LIMITS } from '../lib/constants/validation';

// ===== 2025 ZUSTAND BEST PRACTICES =====
// ✅ Pure reducers pattern
// ✅ No destructuring in selectors (prevents unnecessary re-renders)
// ✅ Use useShallow for multiple values
// ✅ Branded types for type safety
// ✅ Result pattern for error handling

// ===== CONSTANTS =====
export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
} as const satisfies Record<string, string>;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export const LINK_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
} as const satisfies Record<string, string>;

export type LinkFilter = (typeof LINK_FILTER)[keyof typeof LINK_FILTER];

export const SORT_OPTION = {
  CREATED_DESC: 'created_desc',
  CREATED_ASC: 'created_asc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  UPLOADS_DESC: 'uploads_desc',
  UPLOADS_ASC: 'uploads_asc',
  SIZE_DESC: 'size_desc',
  SIZE_ASC: 'size_asc',
} as const satisfies Record<string, string>;

export type SortOption = (typeof SORT_OPTION)[keyof typeof SORT_OPTION];

// ===== STORE STATE =====
export interface LinksStoreState {
  // Data
  readonly links: readonly LinkWithStats[];
  readonly isLoading: boolean;
  readonly error: string | null;

  // Selection
  readonly selectedLinkIds: readonly DatabaseId[];

  // UI State
  readonly searchQuery: string;
  readonly filter: LinkFilter;
  readonly viewMode: ViewMode;
  readonly sortOption: SortOption;

  // Pagination
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalCount: number;

  // Modal states
  readonly isCreateModalOpen: boolean;
  readonly isEditModalOpen: boolean;
  readonly editingLinkId: DatabaseId | null;
}

// ===== STORE ACTIONS =====
export interface LinksStoreActions {
  // Data actions
  readonly setLinks: (links: readonly LinkWithStats[]) => void;
  readonly addLink: (link: LinkWithStats) => void;
  readonly updateLink: (
    linkId: DatabaseId,
    updates: Partial<LinkUpdate>
  ) => void;
  readonly removeLink: (linkId: DatabaseId) => void;

  // Async actions
  readonly createLink: (
    input: LinkInsert
  ) => Promise<DatabaseResult<LinkWithStats>>;
  readonly createBaseLink: (
    input: LinkInsert
  ) => Promise<DatabaseResult<LinkWithStats>>;
  readonly fetchLinks: () => Promise<void>;
  readonly publishCreatedLinks: () => Promise<void>;
  readonly deleteLink: (linkId: DatabaseId) => Promise<DatabaseResult<void>>;

  // UI actions
  readonly setLoading: (isLoading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilter: (filter: LinkFilter) => void;
  readonly setViewMode: (mode: ViewMode) => void;
  readonly setSortOption: (option: SortOption) => void;

  // Selection actions
  readonly setSelectedLinkIds: (linkIds: readonly DatabaseId[]) => void;
  readonly toggleLinkSelection: (linkId: DatabaseId) => void;
  readonly clearSelection: () => void;
  readonly selectAllLinks: () => void;

  // Modal actions
  readonly openCreateModal: () => void;
  readonly closeCreateModal: () => void;
  readonly openEditModal: (linkId: DatabaseId) => void;
  readonly closeEditModal: () => void;

  // Pagination actions
  readonly setCurrentPage: (page: number) => void;
  readonly setPageSize: (size: number) => void;

  // Utility actions
  readonly reset: () => void;
}

// ===== INITIAL STATE =====
const initialState: LinksStoreState = {
  // Data
  links: [],
  isLoading: false,
  error: null,

  // Selection
  selectedLinkIds: [],

  // UI State
  searchQuery: '',
  filter: LINK_FILTER.ALL,
  viewMode: VIEW_MODE.GRID,
  sortOption: SORT_OPTION.CREATED_DESC,

  // Pagination
  currentPage: 1,
  pageSize: 12,
  totalCount: 0,

  // Modal states
  isCreateModalOpen: false,
  isEditModalOpen: false,
  editingLinkId: null,
};

// ===== STORE DEFINITION =====
export type LinksStore = LinksStoreState & LinksStoreActions;

export const useLinksStore = create<LinksStore>()((set, get) => ({
  ...initialState,

  // ===== DATA ACTIONS =====
  setLinks: links =>
    set(state => ({
      ...state,
      links,
      totalCount: links.length,
      isLoading: false,
      error: null,
    })),

  addLink: link =>
    set(state => ({
      ...state,
      links: [...state.links, link],
      totalCount: state.totalCount + 1,
    })),

  updateLink: (linkId, updates) =>
    set(state => ({
      ...state,
      links: state.links.map(link =>
        link.id === linkId ? { ...link, ...updates } : link
      ),
    })),

  removeLink: linkId =>
    set(state => ({
      ...state,
      links: state.links.filter(link => link.id !== linkId),
      totalCount: Math.max(0, state.totalCount - 1),
      selectedLinkIds: state.selectedLinkIds.filter(id => id !== linkId),
    })),

  // ===== ASYNC ACTIONS =====
  createLink: async input => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      console.log('🚀 Creating link with database API...');
      console.log('Input received:', input);

      // Prepare data for the API
      const linkInput = {
        workspaceId: 'temp-workspace-id', // Will be resolved by server action
        title: input.title,
        topic: input.topic || undefined,
        description: input.description || undefined,
        requireEmail: input.requireEmail ?? false,
        requirePassword: input.requirePassword ?? false,
        password: input.passwordHash || undefined,
        isPublic: input.isPublic ?? true,
        isActive: true,
        maxFiles: input.maxFiles ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILES,
        maxFileSize:
          (input.maxFileSize ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILE_SIZE) /
          (1024 * 1024), // Convert bytes to MB for validation
        allowedFileTypes: input.allowedFileTypes || undefined,
        expiresAt: input.expiresAt?.toISOString() || undefined,
        brandEnabled: input.brandEnabled ?? false,
        brandColor: input.brandColor || undefined,
      };

      console.log('🚀 Calling API with:', linkInput);

      // Call the API route to save to database
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create link');
      }

      const linkData = await response.json();
      console.log('✅ Link saved to database:', linkData);

      // Create LinkWithStats object for the store
      const newLink: LinkWithStats = {
        ...linkData,
        // Add stats required for LinkWithStats
        stats: {
          fileCount: 0,
          batchCount: 0,
          folderCount: 0,
          totalViewCount: 0,
          uniqueViewCount: 0,
          averageFileSize: 0,
          storageUsedPercentage: 0,
          isNearLimit: false,
        },
      };

      // Add the created link to the store
      set(state => ({
        ...state,
        links: [...state.links, newLink],
        totalCount: state.totalCount + 1,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear selection after creating new link
      }));

      console.log('✅ Link added to store');
      console.log(
        '🔗 Link URL:',
        `https://foldly.io/${linkData.slug}${linkData.topic ? `/${linkData.topic}` : ''}`
      );

      return { success: true, data: newLink };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create link';
      console.error('❌ Link creation failed:', errorMessage);
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  },

  createBaseLink: async input => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      console.log('🚀 Creating base link with database API...');
      console.log('Input received:', input);

      // Prepare data for the API (using base link defaults)
      const linkInput = {
        title: input.title || 'Personal Collection',
        topic: undefined, // Base links have no topic
        description: input.description || undefined,
        requireEmail: input.requireEmail ?? false,
        requirePassword: input.requirePassword ?? false,
        password: input.passwordHash || undefined,
        isPublic: input.isPublic ?? true,
        isActive: true, // Base links are active by default
        maxFiles: input.maxFiles ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILES,
        maxFileSize:
          (input.maxFileSize ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILE_SIZE) /
          (1024 * 1024), // Convert bytes to MB for validation
        allowedFileTypes: input.allowedFileTypes || undefined,
        expiresAt: input.expiresAt?.toISOString() || undefined,
        brandEnabled: input.brandEnabled ?? false,
        brandColor: input.brandColor || undefined,
      };

      console.log('🚀 Calling API with:', linkInput);

      // Call the API route to save to database
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create base link');
      }

      const linkData = await response.json();
      console.log('✅ Base link saved to database:', linkData);

      // Create LinkWithStats object for the store
      const newBaseLink: LinkWithStats = {
        ...linkData,
        // Add stats required for LinkWithStats
        stats: {
          fileCount: 0,
          batchCount: 0,
          folderCount: 0,
          totalViewCount: 0,
          uniqueViewCount: 0,
          averageFileSize: 0,
          storageUsedPercentage: 0,
          isNearLimit: false,
        },
      };

      // Add the created link to the store
      set(state => ({
        ...state,
        links: [...state.links, newBaseLink],
        totalCount: state.totalCount + 1,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear selection after creating base link
      }));

      console.log('✅ Base link added to store');
      console.log('🔗 Link URL:', `https://foldly.io/${linkData.slug}`);

      return { success: true, data: newBaseLink };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create base link';
      console.error('❌ Base link creation failed:', errorMessage);
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  },

  fetchLinks: async () => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      console.log('🚀 Fetching links from database API...');

      // Call the API route to fetch from database
      const response = await fetch(
        '/api/links?includeInactive=false&limit=1000'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch links');
      }

      const linksData = await response.json();
      console.log(
        '✅ Links fetched from database:',
        linksData?.length || 0,
        'links'
      );

      set(state => ({
        ...state,
        links: linksData || [],
        totalCount: linksData?.length || 0,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear any selection when fetching fresh data
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch links';
      console.error('❌ Fetch links failed:', errorMessage);
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
    }
  },

  publishCreatedLinks: async () => {
    // This method is not needed anymore as links are created directly
    // Keeping for backward compatibility
  },

  deleteLink: async linkId => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      set(state => ({
        ...state,
        links: state.links.filter(link => link.id !== linkId),
        totalCount: Math.max(0, state.totalCount - 1),
        selectedLinkIds: state.selectedLinkIds.filter(id => id !== linkId),
        isLoading: false,
        error: null,
      }));

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete link';
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  },

  // ===== UI ACTIONS =====
  setLoading: isLoading => set(state => ({ ...state, isLoading })),
  setError: error => set(state => ({ ...state, error })),
  setSearchQuery: searchQuery => set(state => ({ ...state, searchQuery })),
  setFilter: filter => set(state => ({ ...state, filter })),
  setViewMode: viewMode => set(state => ({ ...state, viewMode })),
  setSortOption: sortOption => set(state => ({ ...state, sortOption })),

  // ===== SELECTION ACTIONS =====
  setSelectedLinkIds: selectedLinkIds =>
    set(state => ({ ...state, selectedLinkIds })),

  toggleLinkSelection: linkId =>
    set(state => ({
      ...state,
      selectedLinkIds: state.selectedLinkIds.includes(linkId)
        ? state.selectedLinkIds.filter(id => id !== linkId)
        : [...state.selectedLinkIds, linkId],
    })),

  clearSelection: () => set(state => ({ ...state, selectedLinkIds: [] })),

  selectAllLinks: () =>
    set(state => ({
      ...state,
      selectedLinkIds: state.links.map(link => link.id),
    })),

  // ===== MODAL ACTIONS =====
  openCreateModal: () => set(state => ({ ...state, isCreateModalOpen: true })),
  closeCreateModal: () =>
    set(state => ({ ...state, isCreateModalOpen: false })),

  openEditModal: linkId =>
    set(state => ({
      ...state,
      isEditModalOpen: true,
      editingLinkId: linkId,
    })),

  closeEditModal: () =>
    set(state => ({
      ...state,
      isEditModalOpen: false,
      editingLinkId: null,
    })),

  // ===== PAGINATION ACTIONS =====
  setCurrentPage: currentPage => set(state => ({ ...state, currentPage })),
  setPageSize: pageSize => set(state => ({ ...state, pageSize })),

  // ===== UTILITY ACTIONS =====
  reset: () => set(() => ({ ...initialState })),
}));

// ===== SELECTOR HOOKS =====
export const useLinksData = () => useLinksStore(state => state.links);
export const useLinksLoading = () => useLinksStore(state => state.isLoading);
export const useLinksError = () => useLinksStore(state => state.error);
export const useLinksSearchQuery = () =>
  useLinksStore(state => state.searchQuery);
export const useLinksFilter = () => useLinksStore(state => state.filter);
export const useLinksViewMode = () => useLinksStore(state => state.viewMode);
export const useLinksSelectedIds = () =>
  useLinksStore(state => state.selectedLinkIds);
export const useIsCreateModalOpen = () =>
  useLinksStore(state => state.isCreateModalOpen);

// ===== COMPOSITE SELECTORS =====
export const useLinksUIState = () =>
  useLinksStore(
    useShallow(state => ({
      searchQuery: state.searchQuery,
      filter: state.filter,
      viewMode: state.viewMode,
      sortOption: state.sortOption,
    }))
  );

export const useLinksSelection = () =>
  useLinksStore(
    useShallow(state => ({
      selectedLinkIds: state.selectedLinkIds,
      hasSelection: state.selectedLinkIds.length > 0,
      selectionCount: state.selectedLinkIds.length,
    }))
  );

export const useLinksModalState = () =>
  useLinksStore(
    useShallow(state => ({
      isCreateModalOpen: state.isCreateModalOpen,
      isEditModalOpen: state.isEditModalOpen,
      editingLinkId: state.editingLinkId,
    }))
  );

export const useLinksActions = () =>
  useLinksStore(
    useShallow(state => ({
      // Data actions
      setLinks: state.setLinks,
      addLink: state.addLink,
      updateLink: state.updateLink,
      removeLink: state.removeLink,
      createLink: state.createLink,
      createBaseLink: state.createBaseLink,
      fetchLinks: state.fetchLinks,
      deleteLink: state.deleteLink,
      // UI actions
      setSearchQuery: state.setSearchQuery,
      setFilter: state.setFilter,
      setViewMode: state.setViewMode,
      setSortOption: state.setSortOption,
      // Selection actions
      toggleLinkSelection: state.toggleLinkSelection,
      clearSelection: state.clearSelection,
      selectAllLinks: state.selectAllLinks,
      // Modal actions
      openCreateModal: state.openCreateModal,
      closeCreateModal: state.closeCreateModal,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
    }))
  );

// ===== COMPUTED SELECTORS =====
export const useFilteredLinks = () => {
  return useLinksStore(
    useMemo(
      () => state => {
        let filteredLinks = [...state.links];

        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filteredLinks = filteredLinks.filter(
            link =>
              link.title.toLowerCase().includes(query) ||
              link.slug.toLowerCase().includes(query) ||
              (link.topic && link.topic.toLowerCase().includes(query)) ||
              (link.description &&
                link.description.toLowerCase().includes(query))
          );
        }

        // Apply status filter
        if (state.filter !== LINK_FILTER.ALL) {
          filteredLinks = filteredLinks.filter(link => {
            switch (state.filter) {
              case LINK_FILTER.ACTIVE:
                return link.isActive && !link.expiresAt;
              case LINK_FILTER.PAUSED:
                return !link.isActive;
              case LINK_FILTER.EXPIRED:
                return link.expiresAt && new Date(link.expiresAt) < new Date();
              default:
                return true;
            }
          });
        }

        // Apply sorting
        filteredLinks.sort((a, b) => {
          switch (state.sortOption) {
            case SORT_OPTION.CREATED_ASC:
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case SORT_OPTION.CREATED_DESC:
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case SORT_OPTION.TITLE_ASC:
              return a.title.localeCompare(b.title);
            case SORT_OPTION.TITLE_DESC:
              return b.title.localeCompare(a.title);
            case SORT_OPTION.UPLOADS_ASC:
              return a.totalUploads - b.totalUploads;
            case SORT_OPTION.UPLOADS_DESC:
              return b.totalUploads - a.totalUploads;
            case SORT_OPTION.SIZE_ASC:
              return a.totalSize - b.totalSize;
            case SORT_OPTION.SIZE_DESC:
              return b.totalSize - a.totalSize;
            default:
              return 0;
          }
        });

        return filteredLinks;
      },
      []
    )
  );
};

export const useLinksPagination = () =>
  useLinksStore(
    useShallow(state => ({
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      totalCount: state.totalCount,
      totalPages: Math.ceil(state.totalCount / state.pageSize),
      hasNextPage: state.currentPage * state.pageSize < state.totalCount,
      hasPreviousPage: state.currentPage > 1,
    }))
  );
