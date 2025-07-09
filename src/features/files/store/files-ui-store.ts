/**
 * FilesUIStore - Focused store for UI state management
 * Handles view mode, search, filters, selection, and sorting
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FileId, FolderId } from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
  CARD: 'card',
} as const;

export const SORT_BY = {
  NAME: 'name',
  SIZE: 'size',
  TYPE: 'type',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  DOWNLOAD_COUNT: 'downloadCount',
} as const;

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const FILTER_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  PROCESSING: 'processing',
} as const;

export const FILTER_TYPE = {
  ALL: 'all',
  FILES: 'files',
  FOLDERS: 'folders',
  IMAGES: 'images',
  DOCUMENTS: 'documents',
  VIDEOS: 'videos',
  AUDIO: 'audio',
  OTHERS: 'others',
} as const;

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface FilesUIState {
  // View and layout
  viewMode: 'grid' | 'list' | 'card';
  sortBy:
    | 'name'
    | 'size'
    | 'type'
    | 'createdAt'
    | 'updatedAt'
    | 'downloadCount';
  sortDirection: 'asc' | 'desc';

  // Navigation
  currentFolderId: FolderId | null;
  navigationHistory: (FolderId | null)[];
  historyIndex: number;

  // Search and filtering
  searchQuery: string;
  filterStatus: 'all' | 'active' | 'archived' | 'processing';
  filterType: 'all' | 'images' | 'documents' | 'videos' | 'audio' | 'others';

  // Selection state
  isMultiSelectMode: boolean;
  selectedFileIds: Set<FileId>;
  selectedFolderIds: Set<FolderId>;

  // Drag and drop
  isDragging: boolean;
  draggedItems: {
    fileIds: FileId[];
    folderIds: FolderId[];
  };

  // UI states
  showHiddenFiles: boolean;
  showPreviewPanel: boolean;
  previewFileId: FileId | null;

  // Pagination
  currentPage: number;
  itemsPerPage: number;

  // Additional UI states needed by composite hooks
  draggedItemIds: string[];
  focusedItemId: string | null;
  expandedFolderIds: string[];
  dragOverFolderId: string | null;

  // Sort order for compatibility
  sortOrder: 'asc' | 'desc';

  // Actions
  setViewMode: (mode: 'grid' | 'list' | 'card') => void;
  setSorting: (
    sortBy:
      | 'name'
      | 'size'
      | 'type'
      | 'createdAt'
      | 'updatedAt'
      | 'downloadCount',
    direction?: 'asc' | 'desc'
  ) => void;
  setSortOrder: (direction: 'asc' | 'desc') => void;

  navigateToFolder: (folderId: FolderId | null) => void;
  navigateBack: () => void;
  navigateForward: () => void;

  setSearchQuery: (query: string) => void;
  setStatusFilter: (
    status: 'all' | 'active' | 'archived' | 'processing'
  ) => void;
  setTypeFilter: (
    type: 'all' | 'images' | 'documents' | 'videos' | 'audio' | 'others'
  ) => void;
  setFilterStatus: (
    status: 'all' | 'active' | 'archived' | 'processing'
  ) => void;
  setFilterType: (
    type: 'all' | 'images' | 'documents' | 'videos' | 'audio' | 'others'
  ) => void;

  toggleMultiSelectMode: () => void;
  selectFile: (fileId: FileId) => void;
  selectFolder: (folderId: FolderId) => void;
  deselectFile: (fileId: FileId) => void;
  deselectFolder: (folderId: FolderId) => void;
  toggleFileSelection: (fileId: FileId) => void;
  toggleFolderSelection: (folderId: FolderId) => void;
  selectAllFiles: (fileIds: FileId[]) => void;
  selectAllFolders: (folderIds: FolderId[]) => void;
  clearSelection: () => void;

  startDrag: (fileIds: FileId[], folderIds: FolderId[]) => void;
  endDrag: () => void;

  toggleHiddenFiles: () => void;
  togglePreviewPanel: () => void;
  setPreviewFile: (fileId: FileId | null) => void;

  setPage: (page: number) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;

  // Additional actions needed by composite hooks
  setFocusedItem: (id: string | null) => void;
  toggleFolderExpansion: (folderId: string) => void;
  setDragOver: (folderId: string | null) => void;
  clearFilters: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesUIStore = create<FilesUIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      viewMode: 'grid',
      sortBy: 'name',
      sortDirection: 'asc',

      currentFolderId: null,
      navigationHistory: [null],
      historyIndex: 0,

      searchQuery: '',
      filterStatus: 'all',
      filterType: 'all',

      isMultiSelectMode: false,
      selectedFileIds: new Set(),
      selectedFolderIds: new Set(),

      isDragging: false,
      draggedItems: {
        fileIds: [],
        folderIds: [],
      },

      showHiddenFiles: false,
      showPreviewPanel: false,
      previewFileId: null,

      currentPage: 1,
      itemsPerPage: 20,

      // Additional UI states needed by composite hooks
      draggedItemIds: [],
      focusedItemId: null,
      expandedFolderIds: [],
      dragOverFolderId: null,
      sortOrder: 'asc',

      // View and layout actions
      setViewMode: mode => set({ viewMode: mode }),

      setSorting: (sortBy, direction) =>
        set(state => ({
          sortBy,
          sortDirection:
            direction ||
            (state.sortBy === sortBy && state.sortDirection === 'asc'
              ? 'desc'
              : 'asc'),
          currentPage: 1,
        })),

      // Navigation actions
      navigateToFolder: folderId =>
        set(state => {
          const newHistory = state.navigationHistory.slice(
            0,
            state.historyIndex + 1
          );
          newHistory.push(folderId);
          return {
            currentFolderId: folderId,
            navigationHistory: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      navigateBack: () =>
        set(state => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return {
              currentFolderId: state.navigationHistory[newIndex] || null,
              historyIndex: newIndex,
            };
          }
          return {};
        }),

      navigateForward: () =>
        set(state => {
          if (state.historyIndex < state.navigationHistory.length - 1) {
            const newIndex = state.historyIndex + 1;
            return {
              currentFolderId: state.navigationHistory[newIndex] || null,
              historyIndex: newIndex,
            };
          }
          return {};
        }),

      // Search and filter actions
      setSearchQuery: query =>
        set({
          searchQuery: query,
          currentPage: 1,
        }),

      setStatusFilter: status =>
        set({
          filterStatus: status,
          currentPage: 1,
        }),

      setTypeFilter: type =>
        set({
          filterType: type,
          currentPage: 1,
        }),

      setFilterStatus: status =>
        set({
          filterStatus: status,
          currentPage: 1,
        }),

      setFilterType: type =>
        set({
          filterType: type,
          currentPage: 1,
        }),

      setSortOrder: direction =>
        set({
          sortDirection: direction,
          currentPage: 1,
        }),

      // Selection actions
      toggleMultiSelectMode: () =>
        set(state => ({
          isMultiSelectMode: !state.isMultiSelectMode,
          selectedFileIds: new Set(),
          selectedFolderIds: new Set(),
        })),

      selectFile: fileId =>
        set(state => ({
          selectedFileIds: new Set([...state.selectedFileIds, fileId]),
        })),

      selectFolder: folderId =>
        set(state => ({
          selectedFolderIds: new Set([...state.selectedFolderIds, folderId]),
        })),

      deselectFile: fileId =>
        set(state => {
          const newSelection = new Set(state.selectedFileIds);
          newSelection.delete(fileId);
          return { selectedFileIds: newSelection };
        }),

      deselectFolder: folderId =>
        set(state => {
          const newSelection = new Set(state.selectedFolderIds);
          newSelection.delete(folderId);
          return { selectedFolderIds: newSelection };
        }),

      toggleFileSelection: fileId =>
        set(state => {
          const newSelection = new Set(state.selectedFileIds);
          if (newSelection.has(fileId)) {
            newSelection.delete(fileId);
          } else {
            newSelection.add(fileId);
          }
          return { selectedFileIds: newSelection };
        }),

      toggleFolderSelection: folderId =>
        set(state => {
          const newSelection = new Set(state.selectedFolderIds);
          if (newSelection.has(folderId)) {
            newSelection.delete(folderId);
          } else {
            newSelection.add(folderId);
          }
          return { selectedFolderIds: newSelection };
        }),

      selectAllFiles: fileIds =>
        set({
          selectedFileIds: new Set(fileIds),
        }),

      selectAllFolders: folderIds =>
        set({
          selectedFolderIds: new Set(folderIds),
        }),

      clearSelection: () =>
        set({
          selectedFileIds: new Set(),
          selectedFolderIds: new Set(),
          isMultiSelectMode: false,
        }),

      // Drag and drop actions
      startDrag: (fileIds, folderIds) =>
        set({
          isDragging: true,
          draggedItems: { fileIds, folderIds },
          draggedItemIds: [...fileIds, ...folderIds],
        }),

      endDrag: () =>
        set({
          isDragging: false,
          draggedItems: { fileIds: [], folderIds: [] },
          draggedItemIds: [],
          dragOverFolderId: null,
        }),

      // UI state actions
      toggleHiddenFiles: () =>
        set(state => ({
          showHiddenFiles: !state.showHiddenFiles,
        })),

      togglePreviewPanel: () =>
        set(state => ({
          showPreviewPanel: !state.showPreviewPanel,
        })),

      setPreviewFile: fileId => set({ previewFileId: fileId }),

      // Pagination actions
      setPage: page => set({ currentPage: Math.max(1, page) }),

      setCurrentPage: page => set({ currentPage: Math.max(1, page) }),

      resetFilters: () =>
        set({
          searchQuery: '',
          filterStatus: 'all',
          filterType: 'all',
          currentPage: 1,
        }),

      // Additional actions needed by composite hooks
      setFocusedItem: id => set({ focusedItemId: id }),

      toggleFolderExpansion: folderId =>
        set(state => {
          const expanded = new Set(state.expandedFolderIds);
          if (expanded.has(folderId)) {
            expanded.delete(folderId);
          } else {
            expanded.add(folderId);
          }
          return { expandedFolderIds: Array.from(expanded) };
        }),

      setDragOver: folderId => set({ dragOverFolderId: folderId }),

      clearFilters: () =>
        set({
          searchQuery: '',
          filterStatus: 'all',
          filterType: 'all',
          currentPage: 1,
        }),
    }),
    { name: 'FilesUIStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const filesUISelectors = {
  viewMode: (state: FilesUIState) => state.viewMode,
  sorting: (state: FilesUIState) => ({
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
  }),

  navigation: (state: FilesUIState) => ({
    currentFolderId: state.currentFolderId,
    canGoBack: state.historyIndex > 0,
    canGoForward: state.historyIndex < state.navigationHistory.length - 1,
  }),

  searchQuery: (state: FilesUIState) => state.searchQuery,
  filters: (state: FilesUIState) => ({
    status: state.filterStatus,
    type: state.filterType,
  }),

  selection: (state: FilesUIState) => ({
    isMultiSelectMode: state.isMultiSelectMode,
    selectedFileIds: state.selectedFileIds,
    selectedFolderIds: state.selectedFolderIds,
    selectedFileCount: state.selectedFileIds.size,
    selectedFolderCount: state.selectedFolderIds.size,
  }),

  dragDrop: (state: FilesUIState) => ({
    isDragging: state.isDragging,
    draggedItems: state.draggedItems,
  }),

  uiState: (state: FilesUIState) => ({
    showHiddenFiles: state.showHiddenFiles,
    showPreviewPanel: state.showPreviewPanel,
    previewFileId: state.previewFileId,
  }),

  pagination: (state: FilesUIState) => ({
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
  }),

  isFileSelected: (fileId: FileId) => (state: FilesUIState) =>
    state.selectedFileIds.has(fileId),

  isFolderSelected: (folderId: FolderId) => (state: FilesUIState) =>
    state.selectedFolderIds.has(folderId),
};
