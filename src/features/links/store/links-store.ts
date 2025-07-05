'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import type {
  UploadLink,
  CreateUploadLinkInput,
  CreateBaseLinkInput,
  UpdateUploadLinkInput,
  LinkType,
} from '../types';
import type { LinkId, Result } from '@/types';
import { FILE_UPLOAD_LIMITS } from '../constants/validation';

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
} as const satisfies Record<string, string>;

export type SortOption = (typeof SORT_OPTION)[keyof typeof SORT_OPTION];

// ===== STORE STATE =====
export interface LinksStoreState {
  // Data
  readonly links: readonly UploadLink[];
  readonly isLoading: boolean;
  readonly error: string | null;

  // Selection
  readonly selectedLinkIds: readonly LinkId[];

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
  readonly editingLinkId: LinkId | null;

  // Temporary storage for created links (simulates database persistence)
  readonly _createdLinks: readonly UploadLink[];
}

// ===== STORE ACTIONS =====
export interface LinksStoreActions {
  // Data actions
  readonly setLinks: (links: readonly UploadLink[]) => void;
  readonly addLink: (link: UploadLink) => void;
  readonly updateLink: (linkId: LinkId, updates: Partial<UploadLink>) => void;
  readonly removeLink: (linkId: LinkId) => void;

  // Async actions
  readonly createLink: (
    input: CreateUploadLinkInput
  ) => Promise<Result<UploadLink, string>>;
  readonly createBaseLink: (
    input: CreateBaseLinkInput
  ) => Promise<Result<UploadLink, string>>;
  readonly fetchLinks: () => Promise<void>;
  readonly publishCreatedLinks: () => Promise<void>;
  readonly deleteLink: (linkId: LinkId) => Promise<Result<void, string>>;

  // UI actions
  readonly setLoading: (isLoading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilter: (filter: LinkFilter) => void;
  readonly setViewMode: (mode: ViewMode) => void;
  readonly setSortOption: (option: SortOption) => void;

  // Selection actions
  readonly setSelectedLinkIds: (linkIds: readonly LinkId[]) => void;
  readonly toggleLinkSelection: (linkId: LinkId) => void;
  readonly clearSelection: () => void;
  readonly selectAllLinks: () => void;

  // Modal actions
  readonly openCreateModal: () => void;
  readonly closeCreateModal: () => void;
  readonly openEditModal: (linkId: LinkId) => void;
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

  // Temporary storage for created links (simulates database persistence)
  _createdLinks: [],
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
      // Mock API call - replace with actual API call
      const newLink: UploadLink = {
        id: `link_${Date.now()}` as LinkId,
        userId: 'user_123' as any, // Replace with actual user ID from Clerk
        slug: input.slug,
        title: input.title,
        linkType: input.linkType || 'base',
        autoCreateFolders: input.autoCreateFolders ?? true,
        requireEmail: input.requireEmail ?? false,
        requirePassword: input.requirePassword ?? false,
        isPublic: input.isPublic ?? true,
        allowFolderCreation: input.allowFolderCreation ?? true,
        maxFiles: input.maxFiles ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILES,
        maxFileSize:
          input.maxFileSize ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILE_SIZE,
        brandingEnabled: input.brandingEnabled ?? false,
        totalUploads: 0,
        totalFiles: 0,
        totalSize: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Conditionally include optional properties only when they have values
        ...(input.topic && { topic: input.topic }),
        ...(input.description && { description: input.description }),
        ...(input.instructions && { instructions: input.instructions }),
        ...(input.defaultFolderId && {
          defaultFolderId: input.defaultFolderId,
        }),
        ...(input.password && { passwordHash: 'hashed_password' }),
        ...(input.allowedFileTypes && {
          allowedFileTypes: input.allowedFileTypes,
        }),
        ...(input.expiresAt && { expiresAt: input.expiresAt }),
        ...(input.brandColor && { brandColor: input.brandColor }),
        ...(input.accentColor && { accentColor: input.accentColor }),
        ...(input.logoUrl && { logoUrl: input.logoUrl }),
        ...(input.customCss && { customCss: input.customCss }),
        ...(input.welcomeMessage && { welcomeMessage: input.welcomeMessage }),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      set(state => ({
        ...state,
        links: [...state.links, newLink],
        totalCount: state.totalCount + 1,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear selection after creating new link
      }));

      return { success: true, data: newLink };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create link';
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  },

  createBaseLink: async input => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      console.log('=== BASE LINK CREATION DATA ===');
      console.log('Input received:', input);

      // Process logo file if provided
      let logoUrl: string | undefined = undefined;
      if (input.logoUrl && input.logoUrl.startsWith('blob:')) {
        // In a real app, you would upload this to your storage service
        // For now, we'll simulate a URL
        logoUrl = `https://storage.foldly.io/logos/${input.username}_${Date.now()}.png`;
        console.log('Logo file processed, generated URL:', logoUrl);
      } else if (input.logoUrl) {
        logoUrl = input.logoUrl;
      }

      // Create the base link using the CreateBaseLinkInput interface
      const newBaseLink: UploadLink = {
        id: `base_link_${Date.now()}` as LinkId,
        userId: 'user_123' as any, // Replace with actual user ID from Clerk
        slug: input.username, // Base links use username as slug
        title: input.title || 'Personal Collection', // Use input title or fallback
        linkType: 'base' as LinkType,
        autoCreateFolders: true,
        requireEmail: input.requireEmail ?? false,
        requirePassword: input.requirePassword ?? false,
        ...(input.password && { passwordHash: input.password }), // In real app, hash the password
        isPublic: input.isPublic ?? true,
        allowFolderCreation: true,
        maxFiles: input.maxFiles ?? FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILES,
        maxFileSize: FILE_UPLOAD_LIMITS.DEFAULT_MAX_FILE_SIZE,
        brandingEnabled: input.brandingEnabled ?? false,
        totalUploads: 0,
        totalFiles: 0,
        totalSize: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Conditionally include optional properties only when they have values
        ...(input.description && { description: input.description }),
        ...(input.expiresAt && { expiresAt: input.expiresAt }),
        ...(input.brandColor && { brandColor: input.brandColor }),
        ...(input.accentColor && { accentColor: input.accentColor }),
        ...(logoUrl && { logoUrl }),
        ...(input.customCss && { customCss: input.customCss }),
      };

      console.log('=== GENERATED BASE LINK ===');
      console.log('Full base link object:', newBaseLink);
      console.log('Base link URL:', `https://foldly.io/${input.username}`);
      console.log('=== DATABASE STORAGE SIMULATION ===');
      console.log('This data would be saved to database:', {
        id: newBaseLink.id,
        user_id: newBaseLink.userId,
        slug: newBaseLink.slug,
        title: newBaseLink.title,
        description: newBaseLink.description || null,
        link_type: newBaseLink.linkType,
        require_email: newBaseLink.requireEmail,
        max_files: newBaseLink.maxFiles,
        branding_enabled: newBaseLink.brandingEnabled,
        brand_color: newBaseLink.brandColor || null,
        accent_color: newBaseLink.accentColor || null,
        logo_url: newBaseLink.logoUrl || null,
        custom_css: newBaseLink.customCss || null,
        created_at: newBaseLink.createdAt.toISOString(),
        updated_at: newBaseLink.updatedAt.toISOString(),
      });
      console.log('===========================');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add the created link directly to the main links array
      // This ensures it appears immediately on the dashboard
      set(state => ({
        ...state,
        links: [...state.links, newBaseLink],
        totalCount: state.totalCount + 1,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear selection after creating base link
      }));

      // Return the created link data
      return { success: true, data: newBaseLink };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create base link';
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  },

  fetchLinks: async () => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real app, this would fetch all user's links from the database
      // For development, we preserve any existing links that were created locally
      // This simulates the fact that in production, created links would persist in the database
      const { links: currentLinks } = get();

      // Simulate fetching from database - in real app this would be:
      // const response = await fetch('/api/links');
      // const linksFromDatabase = await response.json();

      // For now, we keep existing links (simulates database persistence)
      // In production, this would be replaced with actual API data
      const linksFromDatabase = currentLinks;

      set(state => ({
        ...state,
        links: linksFromDatabase,
        totalCount: linksFromDatabase.length,
        isLoading: false,
        error: null,
        selectedLinkIds: [], // Clear any selection when fetching fresh data
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch links';
      set(state => ({ ...state, isLoading: false, error: errorMessage }));
    }
  },

  deleteLink: async linkId => {
    set(state => ({ ...state, isLoading: true, error: null }));

    try {
      // Mock API call
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
  setSearchQuery: searchQuery =>
    set(state => ({ ...state, searchQuery, currentPage: 1 })),
  setFilter: filter => set(state => ({ ...state, filter, currentPage: 1 })),
  setViewMode: viewMode => set(state => ({ ...state, viewMode })),
  setSortOption: sortOption => set(state => ({ ...state, sortOption })),

  // ===== SELECTION ACTIONS =====
  setSelectedLinkIds: selectedLinkIds =>
    set(state => ({ ...state, selectedLinkIds })),

  toggleLinkSelection: linkId =>
    set(state => {
      const isSelected = state.selectedLinkIds.includes(linkId);
      return {
        ...state,
        selectedLinkIds: isSelected
          ? state.selectedLinkIds.filter(id => id !== linkId)
          : [...state.selectedLinkIds, linkId],
      };
    }),

  clearSelection: () => set(state => ({ ...state, selectedLinkIds: [] })),

  selectAllLinks: () => {
    const { links } = get();
    const allLinkIds = links.map(link => link.id) as LinkId[];
    set(state => ({ ...state, selectedLinkIds: allLinkIds }));
  },

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
  setPageSize: pageSize =>
    set(state => ({ ...state, pageSize, currentPage: 1 })),

  // ===== UTILITY ACTIONS =====
  reset: () => set(() => ({ ...initialState })),

  // Refresh links from the database (replaces the old publish mechanism)
  publishCreatedLinks: async () => {
    // Simply refresh the links from the database
    // In the old system, this moved links from _createdLinks to links
    // Now it just ensures we have the latest data from the server
    await get().fetchLinks();
  },
}));

// ===== 2025 HOOKS - FOLLOWING BEST PRACTICES =====

// ✅ CORRECT: Select single values to avoid unnecessary re-renders
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

// ✅ CORRECT: Use useShallow for multiple values when needed
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
      selectedCount: state.selectedLinkIds.length,
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

// ✅ CORRECT: Action selectors to avoid passing entire store
export const useLinksActions = () =>
  useLinksStore(
    useShallow(state => ({
      createLink: state.createLink,
      createBaseLink: state.createBaseLink,
      fetchLinks: state.fetchLinks,
      publishCreatedLinks: state.publishCreatedLinks,
      deleteLink: state.deleteLink,
      setSearchQuery: state.setSearchQuery,
      setFilter: state.setFilter,
      setViewMode: state.setViewMode,
      setSortOption: state.setSortOption,
      toggleLinkSelection: state.toggleLinkSelection,
      clearSelection: state.clearSelection,
      selectAllLinks: state.selectAllLinks,
      openCreateModal: state.openCreateModal,
      closeCreateModal: state.closeCreateModal,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
      setCurrentPage: state.setCurrentPage,
      setPageSize: state.setPageSize,
      reset: state.reset,
    }))
  );

// ===== COMPUTED SELECTORS =====
export const useFilteredLinks = () => {
  return useLinksStore(
    useMemo(
      () => state => {
        let filtered = [...state.links];

        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            link =>
              link.title.toLowerCase().includes(query) ||
              link.slug.toLowerCase().includes(query) ||
              link.description?.toLowerCase().includes(query)
          );
        }

        // Apply status filter
        switch (state.filter) {
          case LINK_FILTER.ACTIVE:
            filtered = filtered.filter(link => !link.expiresAt);
            break;
          case LINK_FILTER.PAUSED:
            // Add paused logic when implemented
            break;
          case LINK_FILTER.EXPIRED:
            filtered = filtered.filter(
              link => link.expiresAt && new Date(link.expiresAt) < new Date()
            );
            break;
        }

        // Apply sorting
        filtered.sort((a, b) => {
          switch (state.sortOption) {
            case SORT_OPTION.CREATED_DESC:
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case SORT_OPTION.CREATED_ASC:
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case SORT_OPTION.TITLE_ASC:
              return a.title.localeCompare(b.title);
            case SORT_OPTION.TITLE_DESC:
              return b.title.localeCompare(a.title);
            case SORT_OPTION.UPLOADS_DESC:
              return b.totalUploads - a.totalUploads;
            case SORT_OPTION.UPLOADS_ASC:
              return a.totalUploads - b.totalUploads;
            default:
              return 0;
          }
        });

        return filtered;
      },
      []
    )
  );
};
