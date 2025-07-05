// Files UI Store - View State, Search, Filters, and Selection
// Zustand store for file UI state management
// Following 2025 TypeScript best practices with pure reducers

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  FileId,
  FolderId,
  FileFilters,
  SearchOptions,
  FilesUIState,
  BreadcrumbItem,
  FileType,
  FolderColor,
  WORKSPACE_VIEW,
  SORT_OPTIONS,
} from '../types';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import { DEFAULT_VALUES } from '../constants';

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface FilesUIStateStore extends FilesUIState {
  // View controls
  readonly viewMode: 'grid' | 'list' | 'card';
  readonly sortBy:
    | 'name'
    | 'size'
    | 'type'
    | 'createdAt'
    | 'updatedAt'
    | 'downloadCount';
  readonly sortOrder: 'asc' | 'desc';
  readonly showHiddenFiles: boolean;
  readonly thumbnailSize: 'small' | 'medium' | 'large';

  // Navigation
  readonly currentFolderId: FolderId | null;
  readonly breadcrumbs: BreadcrumbItem[];
  readonly navigationHistory: string[];
  readonly historyIndex: number;

  // Search and filters
  readonly searchQuery: string;
  readonly searchOptions: SearchOptions;
  readonly activeFilters: FileFilters;
  readonly isFilterPanelOpen: boolean;
  readonly savedSearches: Array<{
    name: string;
    query: string;
    filters: FileFilters;
  }>;

  // Selection
  readonly selectedFileIds: FileId[];
  readonly selectedFolderIds: FolderId[];
  readonly isMultiSelectMode: boolean;
  readonly lastSelectedId: string | null;

  // Drag and drop
  readonly draggedItems: Array<{ id: string; type: 'file' | 'folder' }>;
  readonly dragOverFolderId: FolderId | null;
  readonly isDragging: boolean;

  // UI state
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly expandedFolderIds: FolderId[];
  readonly collapsedFolderIds: FolderId[];
  readonly focusedItemId: string | null;

  // Panels and modals
  readonly isUploadPanelOpen: boolean;
  readonly isCreateFolderModalOpen: boolean;
  readonly isFileDetailsModalOpen: boolean;
  readonly isShareModalOpen: boolean;
  readonly isDeleteConfirmModalOpen: boolean;

  // Preferences
  readonly preferences: {
    readonly autoSelectOnNavigation: boolean;
    readonly showFileExtensions: boolean;
    readonly showItemCount: boolean;
    readonly enableKeyboardNavigation: boolean;
    readonly enableInfiniteScroll: boolean;
    readonly itemsPerPage: number;
  };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FilesUIStateStore = {
  // View controls
  viewMode: DEFAULT_VALUES.VIEW_MODE,
  sortBy: DEFAULT_VALUES.SORT_BY,
  sortOrder: DEFAULT_VALUES.SORT_ORDER,
  showHiddenFiles: false,
  thumbnailSize: 'medium',

  // Navigation
  currentFolderId: null,
  breadcrumbs: [{ name: 'Home', path: '/', folderId: null, isLast: true }],
  navigationHistory: ['/'],
  historyIndex: 0,

  // Search and filters
  searchQuery: '',
  searchOptions: {
    includeContent: false,
    includeMetadata: true,
    includeTags: true,
    caseSensitive: false,
    useRegex: false,
  },
  activeFilters: {
    types: [],
    tags: [],
    sizeMin: undefined,
    sizeMax: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    isShared: undefined,
    isPublic: undefined,
    query: '',
  },
  isFilterPanelOpen: false,
  savedSearches: [],

  // Selection
  selectedFileIds: [],
  selectedFolderIds: [],
  isMultiSelectMode: false,
  lastSelectedId: null,

  // Drag and drop
  draggedItems: [],
  dragOverFolderId: null,
  isDragging: false,

  // UI state
  isLoading: false,
  isRefreshing: false,
  expandedFolderIds: [],
  collapsedFolderIds: [],
  focusedItemId: null,

  // Panels and modals
  isUploadPanelOpen: false,
  isCreateFolderModalOpen: false,
  isFileDetailsModalOpen: false,
  isShareModalOpen: false,
  isDeleteConfirmModalOpen: false,

  // Preferences
  preferences: {
    autoSelectOnNavigation: true,
    showFileExtensions: true,
    showItemCount: true,
    enableKeyboardNavigation: true,
    enableInfiniteScroll: false,
    itemsPerPage: 50,
  },
};

// =============================================================================
// PURE REDUCERS
// =============================================================================

const uiReducers = createReducers<
  FilesUIStateStore,
  {
    // View controls
    setViewMode: (
      state: FilesUIStateStore,
      mode: 'grid' | 'list' | 'card'
    ) => FilesUIStateStore;
    setSortBy: (
      state: FilesUIStateStore,
      sortBy:
        | 'name'
        | 'size'
        | 'type'
        | 'createdAt'
        | 'updatedAt'
        | 'downloadCount'
    ) => FilesUIStateStore;
    setSortOrder: (
      state: FilesUIStateStore,
      order: 'asc' | 'desc'
    ) => FilesUIStateStore;
    setShowHiddenFiles: (
      state: FilesUIStateStore,
      show: boolean
    ) => FilesUIStateStore;
    setThumbnailSize: (
      state: FilesUIStateStore,
      size: 'small' | 'medium' | 'large'
    ) => FilesUIStateStore;

    // Navigation
    navigateToFolder: (
      state: FilesUIStateStore,
      folderId: FolderId | null,
      breadcrumbs: BreadcrumbItem[]
    ) => FilesUIStateStore;
    navigateBack: (state: FilesUIStateStore) => FilesUIStateStore;
    navigateForward: (state: FilesUIStateStore) => FilesUIStateStore;
    updateBreadcrumbs: (
      state: FilesUIStateStore,
      breadcrumbs: BreadcrumbItem[]
    ) => FilesUIStateStore;

    // Search and filters
    setSearchQuery: (
      state: FilesUIStateStore,
      query: string
    ) => FilesUIStateStore;
    setSearchOptions: (
      state: FilesUIStateStore,
      options: Partial<SearchOptions>
    ) => FilesUIStateStore;
    setActiveFilters: (
      state: FilesUIStateStore,
      filters: Partial<FileFilters>
    ) => FilesUIStateStore;
    clearFilters: (state: FilesUIStateStore) => FilesUIStateStore;
    toggleFilterPanel: (state: FilesUIStateStore) => FilesUIStateStore;
    setFilterPanelOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    addSavedSearch: (
      state: FilesUIStateStore,
      search: { name: string; query: string; filters: FileFilters }
    ) => FilesUIStateStore;
    removeSavedSearch: (
      state: FilesUIStateStore,
      name: string
    ) => FilesUIStateStore;

    // Selection
    selectFile: (
      state: FilesUIStateStore,
      fileId: FileId,
      multiSelect?: boolean
    ) => FilesUIStateStore;
    selectFolder: (
      state: FilesUIStateStore,
      folderId: FolderId,
      multiSelect?: boolean
    ) => FilesUIStateStore;
    deselectFile: (
      state: FilesUIStateStore,
      fileId: FileId
    ) => FilesUIStateStore;
    deselectFolder: (
      state: FilesUIStateStore,
      folderId: FolderId
    ) => FilesUIStateStore;
    selectAll: (
      state: FilesUIStateStore,
      fileIds: FileId[],
      folderIds: FolderId[]
    ) => FilesUIStateStore;
    deselectAll: (state: FilesUIStateStore) => FilesUIStateStore;
    toggleMultiSelectMode: (state: FilesUIStateStore) => FilesUIStateStore;
    setMultiSelectMode: (
      state: FilesUIStateStore,
      enabled: boolean
    ) => FilesUIStateStore;

    // Drag and drop
    startDrag: (
      state: FilesUIStateStore,
      items: Array<{ id: string; type: 'file' | 'folder' }>
    ) => FilesUIStateStore;
    endDrag: (state: FilesUIStateStore) => FilesUIStateStore;
    setDragOverFolder: (
      state: FilesUIStateStore,
      folderId: FolderId | null
    ) => FilesUIStateStore;

    // UI state
    setLoading: (
      state: FilesUIStateStore,
      loading: boolean
    ) => FilesUIStateStore;
    setRefreshing: (
      state: FilesUIStateStore,
      refreshing: boolean
    ) => FilesUIStateStore;
    expandFolder: (
      state: FilesUIStateStore,
      folderId: FolderId
    ) => FilesUIStateStore;
    collapseFolder: (
      state: FilesUIStateStore,
      folderId: FolderId
    ) => FilesUIStateStore;
    toggleFolderExpansion: (
      state: FilesUIStateStore,
      folderId: FolderId
    ) => FilesUIStateStore;
    setFocusedItem: (
      state: FilesUIStateStore,
      itemId: string | null
    ) => FilesUIStateStore;

    // Panels and modals
    setUploadPanelOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    setCreateFolderModalOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    setFileDetailsModalOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    setShareModalOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    setDeleteConfirmModalOpen: (
      state: FilesUIStateStore,
      open: boolean
    ) => FilesUIStateStore;
    closeAllModals: (state: FilesUIStateStore) => FilesUIStateStore;

    // Preferences
    updatePreferences: (
      state: FilesUIStateStore,
      preferences: Partial<FilesUIStateStore['preferences']>
    ) => FilesUIStateStore;

    // Reset
    resetUIState: (state: FilesUIStateStore) => FilesUIStateStore;
  }
>({
  // View controls
  setViewMode: (state, mode) => ({
    ...state,
    viewMode: mode,
  }),

  setSortBy: (state, sortBy) => ({
    ...state,
    sortBy,
  }),

  setSortOrder: (state, order) => ({
    ...state,
    sortOrder: order,
  }),

  setShowHiddenFiles: (state, show) => ({
    ...state,
    showHiddenFiles: show,
  }),

  setThumbnailSize: (state, size) => ({
    ...state,
    thumbnailSize: size,
  }),

  // Navigation
  navigateToFolder: (state, folderId, breadcrumbs) => {
    const newPath = breadcrumbs.map(b => b.path).join('');
    const newHistory = [
      ...state.navigationHistory.slice(0, state.historyIndex + 1),
      newPath,
    ];

    return {
      ...state,
      currentFolderId: folderId,
      breadcrumbs,
      navigationHistory: newHistory,
      historyIndex: newHistory.length - 1,
    };
  },

  navigateBack: state => {
    if (state.historyIndex > 0) {
      return {
        ...state,
        historyIndex: state.historyIndex - 1,
      };
    }
    return state;
  },

  navigateForward: state => {
    if (state.historyIndex < state.navigationHistory.length - 1) {
      return {
        ...state,
        historyIndex: state.historyIndex + 1,
      };
    }
    return state;
  },

  updateBreadcrumbs: (state, breadcrumbs) => ({
    ...state,
    breadcrumbs,
  }),

  // Search and filters
  setSearchQuery: (state, query) => ({
    ...state,
    searchQuery: query,
    activeFilters: {
      ...state.activeFilters,
      query,
    },
  }),

  setSearchOptions: (state, options) => ({
    ...state,
    searchOptions: {
      ...state.searchOptions,
      ...options,
    },
  }),

  setActiveFilters: (state, filters) => ({
    ...state,
    activeFilters: {
      ...state.activeFilters,
      ...filters,
    },
  }),

  clearFilters: state => ({
    ...state,
    activeFilters: {
      types: [],
      tags: [],
      sizeMin: undefined,
      sizeMax: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      isShared: undefined,
      isPublic: undefined,
      query: '',
    },
    searchQuery: '',
  }),

  toggleFilterPanel: state => ({
    ...state,
    isFilterPanelOpen: !state.isFilterPanelOpen,
  }),

  setFilterPanelOpen: (state, open) => ({
    ...state,
    isFilterPanelOpen: open,
  }),

  addSavedSearch: (state, search) => ({
    ...state,
    savedSearches: [...state.savedSearches, search],
  }),

  removeSavedSearch: (state, name) => ({
    ...state,
    savedSearches: state.savedSearches.filter(search => search.name !== name),
  }),

  // Selection
  selectFile: (state, fileId, multiSelect = false) => {
    if (multiSelect) {
      const isSelected = state.selectedFileIds.includes(fileId);
      return {
        ...state,
        selectedFileIds: isSelected
          ? state.selectedFileIds.filter(id => id !== fileId)
          : [...state.selectedFileIds, fileId],
        lastSelectedId: fileId,
        isMultiSelectMode: true,
      };
    } else {
      return {
        ...state,
        selectedFileIds: [fileId],
        selectedFolderIds: [],
        lastSelectedId: fileId,
        isMultiSelectMode: false,
      };
    }
  },

  selectFolder: (state, folderId, multiSelect = false) => {
    if (multiSelect) {
      const isSelected = state.selectedFolderIds.includes(folderId);
      return {
        ...state,
        selectedFolderIds: isSelected
          ? state.selectedFolderIds.filter(id => id !== folderId)
          : [...state.selectedFolderIds, folderId],
        lastSelectedId: folderId,
        isMultiSelectMode: true,
      };
    } else {
      return {
        ...state,
        selectedFileIds: [],
        selectedFolderIds: [folderId],
        lastSelectedId: folderId,
        isMultiSelectMode: false,
      };
    }
  },

  deselectFile: (state, fileId) => ({
    ...state,
    selectedFileIds: state.selectedFileIds.filter(id => id !== fileId),
  }),

  deselectFolder: (state, folderId) => ({
    ...state,
    selectedFolderIds: state.selectedFolderIds.filter(id => id !== folderId),
  }),

  selectAll: (state, fileIds, folderIds) => ({
    ...state,
    selectedFileIds: fileIds,
    selectedFolderIds: folderIds,
    isMultiSelectMode: fileIds.length > 1 || folderIds.length > 1,
  }),

  deselectAll: state => ({
    ...state,
    selectedFileIds: [],
    selectedFolderIds: [],
    isMultiSelectMode: false,
    lastSelectedId: null,
  }),

  toggleMultiSelectMode: state => ({
    ...state,
    isMultiSelectMode: !state.isMultiSelectMode,
    selectedFileIds: state.isMultiSelectMode ? [] : state.selectedFileIds,
    selectedFolderIds: state.isMultiSelectMode ? [] : state.selectedFolderIds,
  }),

  setMultiSelectMode: (state, enabled) => ({
    ...state,
    isMultiSelectMode: enabled,
    selectedFileIds: enabled ? state.selectedFileIds : [],
    selectedFolderIds: enabled ? state.selectedFolderIds : [],
  }),

  // Drag and drop
  startDrag: (state, items) => ({
    ...state,
    draggedItems: items,
    isDragging: true,
  }),

  endDrag: state => ({
    ...state,
    draggedItems: [],
    isDragging: false,
    dragOverFolderId: null,
  }),

  setDragOverFolder: (state, folderId) => ({
    ...state,
    dragOverFolderId: folderId,
  }),

  // UI state
  setLoading: (state, loading) => ({
    ...state,
    isLoading: loading,
  }),

  setRefreshing: (state, refreshing) => ({
    ...state,
    isRefreshing: refreshing,
  }),

  expandFolder: (state, folderId) => ({
    ...state,
    expandedFolderIds: state.expandedFolderIds.includes(folderId)
      ? state.expandedFolderIds
      : [...state.expandedFolderIds, folderId],
    collapsedFolderIds: state.collapsedFolderIds.filter(id => id !== folderId),
  }),

  collapseFolder: (state, folderId) => ({
    ...state,
    collapsedFolderIds: state.collapsedFolderIds.includes(folderId)
      ? state.collapsedFolderIds
      : [...state.collapsedFolderIds, folderId],
    expandedFolderIds: state.expandedFolderIds.filter(id => id !== folderId),
  }),

  toggleFolderExpansion: (state, folderId) => {
    const isExpanded = state.expandedFolderIds.includes(folderId);

    if (isExpanded) {
      return {
        ...state,
        expandedFolderIds: state.expandedFolderIds.filter(
          id => id !== folderId
        ),
        collapsedFolderIds: [...state.collapsedFolderIds, folderId],
      };
    } else {
      return {
        ...state,
        expandedFolderIds: [...state.expandedFolderIds, folderId],
        collapsedFolderIds: state.collapsedFolderIds.filter(
          id => id !== folderId
        ),
      };
    }
  },

  setFocusedItem: (state, itemId) => ({
    ...state,
    focusedItemId: itemId,
  }),

  // Panels and modals
  setUploadPanelOpen: (state, open) => ({
    ...state,
    isUploadPanelOpen: open,
  }),

  setCreateFolderModalOpen: (state, open) => ({
    ...state,
    isCreateFolderModalOpen: open,
  }),

  setFileDetailsModalOpen: (state, open) => ({
    ...state,
    isFileDetailsModalOpen: open,
  }),

  setShareModalOpen: (state, open) => ({
    ...state,
    isShareModalOpen: open,
  }),

  setDeleteConfirmModalOpen: (state, open) => ({
    ...state,
    isDeleteConfirmModalOpen: open,
  }),

  closeAllModals: state => ({
    ...state,
    isUploadPanelOpen: false,
    isCreateFolderModalOpen: false,
    isFileDetailsModalOpen: false,
    isShareModalOpen: false,
    isDeleteConfirmModalOpen: false,
  }),

  // Preferences
  updatePreferences: (state, preferences) => ({
    ...state,
    preferences: {
      ...state.preferences,
      ...preferences,
    },
  }),

  // Reset
  resetUIState: state => ({
    ...initialState,
    preferences: state.preferences, // Keep preferences
  }),
});

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesUIStore = create<
  FilesUIStateStore &
    ReturnType<
      typeof convertReducersToActions<FilesUIStateStore, typeof uiReducers>
    >
>()(
  devtools(
    set => ({
      ...initialState,
      ...convertReducersToActions(set, uiReducers),
    }),
    {
      name: 'files-ui-store',
    }
  )
);

// =============================================================================
// COMPUTED SELECTORS
// =============================================================================

/**
 * Check if any item is selected
 */
export const hasSelection = (state: FilesUIStateStore): boolean => {
  return state.selectedFileIds.length > 0 || state.selectedFolderIds.length > 0;
};

/**
 * Get total selected items count
 */
export const getSelectedCount = (state: FilesUIStateStore): number => {
  return state.selectedFileIds.length + state.selectedFolderIds.length;
};

/**
 * Check if file is selected
 */
export const isFileSelected = (
  state: FilesUIStateStore,
  fileId: FileId
): boolean => {
  return state.selectedFileIds.includes(fileId);
};

/**
 * Check if folder is selected
 */
export const isFolderSelected = (
  state: FilesUIStateStore,
  folderId: FolderId
): boolean => {
  return state.selectedFolderIds.includes(folderId);
};

/**
 * Check if folder is expanded
 */
export const isFolderExpanded = (
  state: FilesUIStateStore,
  folderId: FolderId
): boolean => {
  return state.expandedFolderIds.includes(folderId);
};

/**
 * Check if any filters are active
 */
export const hasActiveFilters = (state: FilesUIStateStore): boolean => {
  const { activeFilters } = state;
  return !!(
    activeFilters.query ||
    activeFilters.types.length > 0 ||
    activeFilters.tags.length > 0 ||
    activeFilters.sizeMin !== undefined ||
    activeFilters.sizeMax !== undefined ||
    activeFilters.dateFrom !== undefined ||
    activeFilters.dateTo !== undefined ||
    activeFilters.isShared !== undefined ||
    activeFilters.isPublic !== undefined
  );
};

/**
 * Get active filters count
 */
export const getActiveFiltersCount = (state: FilesUIStateStore): number => {
  const { activeFilters } = state;
  let count = 0;

  if (activeFilters.query) count++;
  if (activeFilters.types.length > 0) count++;
  if (activeFilters.tags.length > 0) count++;
  if (activeFilters.sizeMin !== undefined) count++;
  if (activeFilters.sizeMax !== undefined) count++;
  if (activeFilters.dateFrom !== undefined) count++;
  if (activeFilters.dateTo !== undefined) count++;
  if (activeFilters.isShared !== undefined) count++;
  if (activeFilters.isPublic !== undefined) count++;

  return count;
};

/**
 * Check if any modal is open
 */
export const isAnyModalOpen = (state: FilesUIStateStore): boolean => {
  return (
    state.isUploadPanelOpen ||
    state.isCreateFolderModalOpen ||
    state.isFileDetailsModalOpen ||
    state.isShareModalOpen ||
    state.isDeleteConfirmModalOpen
  );
};

/**
 * Get current path string
 */
export const getCurrentPath = (state: FilesUIStateStore): string => {
  return state.breadcrumbs.map(b => b.path).join('');
};

/**
 * Check if navigation can go back
 */
export const canNavigateBack = (state: FilesUIStateStore): boolean => {
  return state.historyIndex > 0;
};

/**
 * Check if navigation can go forward
 */
export const canNavigateForward = (state: FilesUIStateStore): boolean => {
  return state.historyIndex < state.navigationHistory.length - 1;
};
