'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools, persist } from 'zustand/middleware';
import { useMemo, useCallback } from 'react';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import type { FileId, FolderId } from '@/types';
import type { FileUpload, Folder } from '../types/database';

// Type aliases for consistency
export type FileData = FileUpload;
export type FolderData = Folder;

// ===== 2025 ZUSTAND BEST PRACTICES =====
// ✅ Pure reducers pattern for workspace state only
// ✅ No destructuring in selectors (prevents unnecessary re-renders)
// ✅ Use useShallow for multiple values
// ✅ Branded types for type safety
// ✅ Focused on workspace concerns only
// ✅ Persistent state for settings and preferences

// ===== CONSTANTS =====
export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
  CARD: 'card',
} as const satisfies Record<string, string>;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export const SORT_BY = {
  NAME: 'name',
  SIZE: 'size',
  TYPE: 'type',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const satisfies Record<string, string>;

export type SortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const satisfies Record<string, string>;

export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

// Folder colors removed for MVP simplification

export const THUMBNAIL_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const satisfies Record<string, string>;

export type ThumbnailSize =
  (typeof THUMBNAIL_SIZE)[keyof typeof THUMBNAIL_SIZE];

export const OPERATION_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const satisfies Record<string, string>;

export type OperationStatus =
  (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

// ===== WORKSPACE TYPES =====
export interface WorkspaceData {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly ownerId: string;
  readonly settings: WorkspaceSettings;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly rootFolderId: FolderId | null;
  readonly totalFiles: number;
  readonly totalFolders: number;
  readonly totalSize: number;
  readonly lastSyncAt: Date | null;
}

export interface WorkspaceSettings {
  readonly defaultView: ViewMode;
  readonly sortBy: SortBy;
  readonly sortOrder: SortOrder;
  readonly showHiddenFiles: boolean;
  readonly autoBackup: boolean;
  readonly thumbnailSize: ThumbnailSize;
  readonly enableVersioning: boolean;
  readonly maxVersions: number;
  readonly compressionLevel: number;
  readonly enableAutoSync: boolean;
  readonly syncInterval: number;
}

export interface FileTreeNode {
  readonly id: string;
  readonly name: string;
  readonly type: 'file' | 'folder';
  readonly path: string;
  readonly size?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly children: readonly FileTreeNode[];
  readonly parentId: string | null;
  readonly color?: FolderColor;
  readonly icon?: string;
  readonly tags?: readonly string[];
}

export interface TreeStats {
  readonly totalFiles: number;
  readonly totalFolders: number;
  readonly totalSize: number;
  readonly maxDepth: number;
  readonly averageDepth: number;
}

export interface NavigationSegment {
  readonly id: FolderId | null;
  readonly name: string;
  readonly path: string;
}

export interface FolderTemplate {
  readonly id: string;
  readonly name: string;
  readonly color: FolderColor;
  readonly icon: string;
  readonly description: string;
  readonly predefinedTags: readonly string[];
  readonly isBuiltIn: boolean;
}

// ===== STORE STATE =====
export interface FilesWorkspaceState {
  // Workspace data
  readonly currentWorkspace: WorkspaceData | null;
  readonly workspaceSettings: WorkspaceSettings;

  // File tree state
  readonly fileTree: readonly FileTreeNode[];
  readonly treeStats: TreeStats | null;
  readonly treeOperationStatus: OperationStatus;
  readonly treeError: string | null;

  // Navigation state
  readonly currentFolderId: FolderId | null;
  readonly currentPath: string;
  readonly parentFolderId: FolderId | null;
  readonly rootFolderId: FolderId | null;
  readonly navigationPath: readonly NavigationSegment[];

  // Tree view state
  readonly expandedNodes: readonly string[];
  readonly selectedNodes: readonly string[];
  readonly focusedNodeId: string | null;
  readonly showTreeView: boolean;
  readonly treeWidth: number;

  // Operations status
  readonly workspaceOperations: {
    readonly isLoading: boolean;
    readonly isSaving: boolean;
    readonly isSyncing: boolean;
    readonly lastSyncAt: Date | null;
    readonly syncError: string | null;
  };

  readonly folderOperations: {
    readonly isCreating: boolean;
    readonly isDeleting: boolean;
    readonly isMoving: boolean;
    readonly isRenaming: boolean;
    readonly operationError: string | null;
  };

  // Quick access
  readonly recentFolders: readonly FolderId[];
  readonly favoriteFolders: readonly FolderId[];
  readonly pinnedFolders: readonly FolderId[];

  // Folder templates
  readonly folderTemplates: readonly FolderTemplate[];

  // Preferences
  readonly preferences: {
    readonly autoExpandTree: boolean;
    readonly showTreeLineNumbers: boolean;
    readonly enableKeyboardNavigation: boolean;
    readonly rememberExpandedNodes: boolean;
    readonly showFolderSizes: boolean;
    readonly enableDragAndDrop: boolean;
  };
}

// ===== STORE ACTIONS =====
export interface FilesWorkspaceActions {
  // Workspace management
  readonly setCurrentWorkspace: (workspace: WorkspaceData | null) => void;
  readonly updateWorkspaceSettings: (
    settings: Partial<WorkspaceSettings>
  ) => void;
  readonly setWorkspaceLoading: (loading: boolean) => void;
  readonly setWorkspaceSaving: (saving: boolean) => void;
  readonly setWorkspaceSyncing: (syncing: boolean) => void;
  readonly setSyncCompleted: (timestamp: Date) => void;
  readonly setSyncError: (error: string | null) => void;

  // File tree management
  readonly setFileTree: (tree: readonly FileTreeNode[]) => void;
  readonly updateTreeStats: (stats: TreeStats) => void;
  readonly setTreeOperationStatus: (status: OperationStatus) => void;
  readonly setTreeError: (error: string | null) => void;
  readonly refreshTree: () => void;

  // Tree view operations
  readonly expandTreeNode: (nodeId: string) => void;
  readonly collapseTreeNode: (nodeId: string) => void;
  readonly toggleTreeNode: (nodeId: string) => void;
  readonly selectTreeNode: (nodeId: string, multiSelect?: boolean) => void;
  readonly deselectAllTreeNodes: () => void;
  readonly setFocusedTreeNode: (nodeId: string | null) => void;
  readonly setTreeViewVisible: (visible: boolean) => void;
  readonly setTreeWidth: (width: number) => void;

  // Navigation operations
  readonly navigateToFolder: (folderId: FolderId | null, path: string) => void;
  readonly updateNavigationPath: (
    segments: readonly NavigationSegment[]
  ) => void;
  readonly setCurrentFolder: (folderId: FolderId | null) => void;
  readonly goBack: () => void;
  readonly goForward: () => void;
  readonly goToRoot: () => void;

  // Folder operations
  readonly setFolderCreating: (creating: boolean) => void;
  readonly setFolderDeleting: (deleting: boolean) => void;
  readonly setFolderMoving: (moving: boolean) => void;
  readonly setFolderRenaming: (renaming: boolean) => void;
  readonly setFolderOperationError: (error: string | null) => void;
  readonly clearFolderOperationStates: () => void;

  // Quick access operations
  readonly addRecentFolder: (folderId: FolderId) => void;
  readonly addFavoriteFolder: (folderId: FolderId) => void;
  readonly removeFavoriteFolder: (folderId: FolderId) => void;
  readonly toggleFavoriteFolder: (folderId: FolderId) => void;
  readonly addPinnedFolder: (folderId: FolderId) => void;
  readonly removePinnedFolder: (folderId: FolderId) => void;
  readonly togglePinnedFolder: (folderId: FolderId) => void;

  // Template operations
  readonly addFolderTemplate: (template: FolderTemplate) => void;
  readonly removeFolderTemplate: (templateId: string) => void;
  readonly updateFolderTemplate: (
    templateId: string,
    updates: Partial<FolderTemplate>
  ) => void;

  // Preferences
  readonly updatePreferences: (
    preferences: Partial<FilesWorkspaceState['preferences']>
  ) => void;

  // Utility
  readonly reset: () => void;
}

// ===== INITIAL STATE =====
const initialState: FilesWorkspaceState = {
  // Workspace data
  currentWorkspace: null,
  workspaceSettings: {
    defaultView: VIEW_MODE.GRID,
    sortBy: SORT_BY.NAME,
    sortOrder: SORT_ORDER.ASC,
    showHiddenFiles: false,
    autoBackup: true,
    thumbnailSize: THUMBNAIL_SIZE.MEDIUM,
    enableVersioning: true,
    maxVersions: 10,
    compressionLevel: 6,
    enableAutoSync: true,
    syncInterval: 300000, // 5 minutes
  },

  // File tree state
  fileTree: [],
  treeStats: null,
  treeOperationStatus: OPERATION_STATUS.IDLE,
  treeError: null,

  // Navigation state
  currentFolderId: null,
  currentPath: '/',
  parentFolderId: null,
  rootFolderId: null,
  navigationPath: [{ id: null, name: 'Home', path: '/' }],

  // Tree view state
  expandedNodes: [],
  selectedNodes: [],
  focusedNodeId: null,
  showTreeView: true,
  treeWidth: 280,

  // Operations status
  workspaceOperations: {
    isLoading: false,
    isSaving: false,
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
  },

  folderOperations: {
    isCreating: false,
    isDeleting: false,
    isMoving: false,
    isRenaming: false,
    operationError: null,
  },

  // Quick access
  recentFolders: [],
  favoriteFolders: [],
  pinnedFolders: [],

  // Folder templates
  folderTemplates: [
    {
      id: 'documents',
      name: 'Documents',
      color: FOLDER_COLOR.BLUE,
      icon: '📁',
      description: 'For storing documents and reports',
      predefinedTags: ['documents', 'official'],
      isBuiltIn: true,
    },
    {
      id: 'projects',
      name: 'Projects',
      color: FOLDER_COLOR.GREEN,
      icon: '📊',
      description: 'For project files and deliverables',
      predefinedTags: ['projects', 'work'],
      isBuiltIn: true,
    },
    {
      id: 'media',
      name: 'Media',
      color: FOLDER_COLOR.PURPLE,
      icon: '🎬',
      description: 'For videos, images, and audio files',
      predefinedTags: ['media', 'content'],
      isBuiltIn: true,
    },
    {
      id: 'archive',
      name: 'Archive',
      color: FOLDER_COLOR.GRAY,
      icon: '📦',
      description: 'For archived and old files',
      predefinedTags: ['archive', 'backup'],
      isBuiltIn: true,
    },
  ],

  // Preferences
  preferences: {
    autoExpandTree: false,
    showTreeLineNumbers: false,
    enableKeyboardNavigation: true,
    rememberExpandedNodes: true,
    showFolderSizes: true,
    enableDragAndDrop: true,
  },
};

// ===== PURE REDUCERS =====
const workspaceReducers = createReducers<
  FilesWorkspaceState,
  {
    setCurrentWorkspace: (
      state: FilesWorkspaceState,
      workspace: WorkspaceData | null
    ) => FilesWorkspaceState;
    updateWorkspaceSettings: (
      state: FilesWorkspaceState,
      settings: Partial<WorkspaceSettings>
    ) => FilesWorkspaceState;
    setWorkspaceLoading: (
      state: FilesWorkspaceState,
      loading: boolean
    ) => FilesWorkspaceState;
    setWorkspaceSaving: (
      state: FilesWorkspaceState,
      saving: boolean
    ) => FilesWorkspaceState;
    setWorkspaceSyncing: (
      state: FilesWorkspaceState,
      syncing: boolean
    ) => FilesWorkspaceState;
    setSyncCompleted: (
      state: FilesWorkspaceState,
      timestamp: Date
    ) => FilesWorkspaceState;
    setSyncError: (
      state: FilesWorkspaceState,
      error: string | null
    ) => FilesWorkspaceState;

    setFileTree: (
      state: FilesWorkspaceState,
      tree: readonly FileTreeNode[]
    ) => FilesWorkspaceState;
    updateTreeStats: (
      state: FilesWorkspaceState,
      stats: TreeStats
    ) => FilesWorkspaceState;
    setTreeOperationStatus: (
      state: FilesWorkspaceState,
      status: OperationStatus
    ) => FilesWorkspaceState;
    setTreeError: (
      state: FilesWorkspaceState,
      error: string | null
    ) => FilesWorkspaceState;
    refreshTree: (state: FilesWorkspaceState) => FilesWorkspaceState;

    expandTreeNode: (
      state: FilesWorkspaceState,
      nodeId: string
    ) => FilesWorkspaceState;
    collapseTreeNode: (
      state: FilesWorkspaceState,
      nodeId: string
    ) => FilesWorkspaceState;
    toggleTreeNode: (
      state: FilesWorkspaceState,
      nodeId: string
    ) => FilesWorkspaceState;
    selectTreeNode: (
      state: FilesWorkspaceState,
      nodeId: string,
      multiSelect?: boolean
    ) => FilesWorkspaceState;
    deselectAllTreeNodes: (state: FilesWorkspaceState) => FilesWorkspaceState;
    setFocusedTreeNode: (
      state: FilesWorkspaceState,
      nodeId: string | null
    ) => FilesWorkspaceState;
    setTreeViewVisible: (
      state: FilesWorkspaceState,
      visible: boolean
    ) => FilesWorkspaceState;
    setTreeWidth: (
      state: FilesWorkspaceState,
      width: number
    ) => FilesWorkspaceState;

    navigateToFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId | null,
      path: string
    ) => FilesWorkspaceState;
    updateNavigationPath: (
      state: FilesWorkspaceState,
      segments: readonly NavigationSegment[]
    ) => FilesWorkspaceState;
    setCurrentFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId | null
    ) => FilesWorkspaceState;
    goBack: (state: FilesWorkspaceState) => FilesWorkspaceState;
    goForward: (state: FilesWorkspaceState) => FilesWorkspaceState;
    goToRoot: (state: FilesWorkspaceState) => FilesWorkspaceState;

    setFolderCreating: (
      state: FilesWorkspaceState,
      creating: boolean
    ) => FilesWorkspaceState;
    setFolderDeleting: (
      state: FilesWorkspaceState,
      deleting: boolean
    ) => FilesWorkspaceState;
    setFolderMoving: (
      state: FilesWorkspaceState,
      moving: boolean
    ) => FilesWorkspaceState;
    setFolderRenaming: (
      state: FilesWorkspaceState,
      renaming: boolean
    ) => FilesWorkspaceState;
    setFolderOperationError: (
      state: FilesWorkspaceState,
      error: string | null
    ) => FilesWorkspaceState;
    clearFolderOperationStates: (
      state: FilesWorkspaceState
    ) => FilesWorkspaceState;

    addRecentFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    addFavoriteFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    removeFavoriteFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    toggleFavoriteFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    addPinnedFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    removePinnedFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    togglePinnedFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;

    addFolderTemplate: (
      state: FilesWorkspaceState,
      template: FolderTemplate
    ) => FilesWorkspaceState;
    removeFolderTemplate: (
      state: FilesWorkspaceState,
      templateId: string
    ) => FilesWorkspaceState;
    updateFolderTemplate: (
      state: FilesWorkspaceState,
      templateId: string,
      updates: Partial<FolderTemplate>
    ) => FilesWorkspaceState;

    updatePreferences: (
      state: FilesWorkspaceState,
      preferences: Partial<FilesWorkspaceState['preferences']>
    ) => FilesWorkspaceState;
  }
>({
  // Workspace management
  setCurrentWorkspace: (state, workspace) => ({
    ...state,
    currentWorkspace: workspace,
  }),

  updateWorkspaceSettings: (state, settings) => ({
    ...state,
    workspaceSettings: {
      ...state.workspaceSettings,
      ...settings,
    },
  }),

  setWorkspaceLoading: (state, loading) => ({
    ...state,
    workspaceOperations: {
      ...state.workspaceOperations,
      isLoading: loading,
    },
  }),

  setWorkspaceSaving: (state, saving) => ({
    ...state,
    workspaceOperations: {
      ...state.workspaceOperations,
      isSaving: saving,
    },
  }),

  setWorkspaceSyncing: (state, syncing) => ({
    ...state,
    workspaceOperations: {
      ...state.workspaceOperations,
      isSyncing: syncing,
    },
  }),

  setSyncCompleted: (state, timestamp) => ({
    ...state,
    workspaceOperations: {
      ...state.workspaceOperations,
      isSyncing: false,
      lastSyncAt: timestamp,
      syncError: null,
    },
  }),

  setSyncError: (state, error) => ({
    ...state,
    workspaceOperations: {
      ...state.workspaceOperations,
      isSyncing: false,
      syncError: error,
    },
  }),

  // File tree management
  setFileTree: (state, tree) => ({
    ...state,
    fileTree: tree,
  }),

  updateTreeStats: (state, stats) => ({
    ...state,
    treeStats: stats,
  }),

  setTreeOperationStatus: (state, status) => ({
    ...state,
    treeOperationStatus: status,
  }),

  setTreeError: (state, error) => ({
    ...state,
    treeError: error,
    treeOperationStatus: error ? OPERATION_STATUS.ERROR : OPERATION_STATUS.IDLE,
  }),

  refreshTree: state => ({
    ...state,
    treeOperationStatus: OPERATION_STATUS.LOADING,
  }),

  // Tree view operations
  expandTreeNode: (state, nodeId) => ({
    ...state,
    expandedNodes: state.expandedNodes.includes(nodeId)
      ? state.expandedNodes
      : [...state.expandedNodes, nodeId],
  }),

  collapseTreeNode: (state, nodeId) => ({
    ...state,
    expandedNodes: state.expandedNodes.filter(id => id !== nodeId),
  }),

  toggleTreeNode: (state, nodeId) => ({
    ...state,
    expandedNodes: state.expandedNodes.includes(nodeId)
      ? state.expandedNodes.filter(id => id !== nodeId)
      : [...state.expandedNodes, nodeId],
  }),

  selectTreeNode: (state, nodeId, multiSelect = false) => ({
    ...state,
    selectedNodes: multiSelect
      ? state.selectedNodes.includes(nodeId)
        ? state.selectedNodes.filter(id => id !== nodeId)
        : [...state.selectedNodes, nodeId]
      : [nodeId],
  }),

  deselectAllTreeNodes: state => ({
    ...state,
    selectedNodes: [],
  }),

  setFocusedTreeNode: (state, nodeId) => ({
    ...state,
    focusedNodeId: nodeId,
  }),

  setTreeViewVisible: (state, visible) => ({
    ...state,
    showTreeView: visible,
  }),

  setTreeWidth: (state, width) => ({
    ...state,
    treeWidth: Math.max(200, Math.min(600, width)),
  }),

  // Navigation operations
  navigateToFolder: (state, folderId, path) => ({
    ...state,
    currentFolderId: folderId,
    currentPath: path,
  }),

  updateNavigationPath: (state, segments) => ({
    ...state,
    navigationPath: segments,
  }),

  setCurrentFolder: (state, folderId) => ({
    ...state,
    currentFolderId: folderId,
  }),

  goBack: state => ({
    ...state,
    currentFolderId: state.parentFolderId,
  }),

  goForward: state => state, // Will be implemented based on navigation history

  goToRoot: state => ({
    ...state,
    currentFolderId: state.rootFolderId,
    currentPath: '/',
  }),

  // Folder operations
  setFolderCreating: (state, creating) => ({
    ...state,
    folderOperations: {
      ...state.folderOperations,
      isCreating: creating,
    },
  }),

  setFolderDeleting: (state, deleting) => ({
    ...state,
    folderOperations: {
      ...state.folderOperations,
      isDeleting: deleting,
    },
  }),

  setFolderMoving: (state, moving) => ({
    ...state,
    folderOperations: {
      ...state.folderOperations,
      isMoving: moving,
    },
  }),

  setFolderRenaming: (state, renaming) => ({
    ...state,
    folderOperations: {
      ...state.folderOperations,
      isRenaming: renaming,
    },
  }),

  setFolderOperationError: (state, error) => ({
    ...state,
    folderOperations: {
      ...state.folderOperations,
      operationError: error,
    },
  }),

  clearFolderOperationStates: state => ({
    ...state,
    folderOperations: {
      isCreating: false,
      isDeleting: false,
      isMoving: false,
      isRenaming: false,
      operationError: null,
    },
  }),

  // Quick access operations
  addRecentFolder: (state, folderId) => ({
    ...state,
    recentFolders: [
      folderId,
      ...state.recentFolders.filter(id => id !== folderId),
    ].slice(0, 10), // Keep only last 10
  }),

  addFavoriteFolder: (state, folderId) => ({
    ...state,
    favoriteFolders: state.favoriteFolders.includes(folderId)
      ? state.favoriteFolders
      : [...state.favoriteFolders, folderId],
  }),

  removeFavoriteFolder: (state, folderId) => ({
    ...state,
    favoriteFolders: state.favoriteFolders.filter(id => id !== folderId),
  }),

  toggleFavoriteFolder: (state, folderId) => ({
    ...state,
    favoriteFolders: state.favoriteFolders.includes(folderId)
      ? state.favoriteFolders.filter(id => id !== folderId)
      : [...state.favoriteFolders, folderId],
  }),

  addPinnedFolder: (state, folderId) => ({
    ...state,
    pinnedFolders: state.pinnedFolders.includes(folderId)
      ? state.pinnedFolders
      : [...state.pinnedFolders, folderId],
  }),

  removePinnedFolder: (state, folderId) => ({
    ...state,
    pinnedFolders: state.pinnedFolders.filter(id => id !== folderId),
  }),

  togglePinnedFolder: (state, folderId) => ({
    ...state,
    pinnedFolders: state.pinnedFolders.includes(folderId)
      ? state.pinnedFolders.filter(id => id !== folderId)
      : [...state.pinnedFolders, folderId],
  }),

  // Template operations
  addFolderTemplate: (state, template) => ({
    ...state,
    folderTemplates: [...state.folderTemplates, template],
  }),

  removeFolderTemplate: (state, templateId) => ({
    ...state,
    folderTemplates: state.folderTemplates.filter(
      template => template.id !== templateId
    ),
  }),

  updateFolderTemplate: (state, templateId, updates) => ({
    ...state,
    folderTemplates: state.folderTemplates.map(template =>
      template.id === templateId ? { ...template, ...updates } : template
    ),
  }),

  // Preferences
  updatePreferences: (state, preferences) => ({
    ...state,
    preferences: {
      ...state.preferences,
      ...preferences,
    },
  }),
});

// ===== STORE DEFINITION =====
export type FilesWorkspaceStore = FilesWorkspaceState & FilesWorkspaceActions;

export const useFilesWorkspaceStore = create<FilesWorkspaceStore>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        ...convertReducersToActions(set as any, workspaceReducers),

        // Additional utility reset method
        reset: () => set(() => ({ ...initialState })),
      }),
      {
        name: 'FilesWorkspaceStore',
        partialize: state => ({
          workspaceSettings: state.workspaceSettings,
          expandedNodes: state.expandedNodes,
          showTreeView: state.showTreeView,
          treeWidth: state.treeWidth,
          favoriteFolders: state.favoriteFolders,
          pinnedFolders: state.pinnedFolders,
          folderTemplates: state.folderTemplates,
          preferences: state.preferences,
        }),
      }
    ),
    { name: 'FilesWorkspaceStore' }
  )
);

// ===== 2025 HOOKS - FOLLOWING BEST PRACTICES =====

// ✅ CORRECT: Select single values to avoid unnecessary re-renders
export const useFilesCurrentWorkspace = () =>
  useFilesWorkspaceStore(state => state.currentWorkspace);
export const useFilesCurrentFolder = () =>
  useFilesWorkspaceStore(state => state.currentFolderId);
export const useFilesCurrentPath = () =>
  useFilesWorkspaceStore(state => state.currentPath);
export const useFilesTreeView = () =>
  useFilesWorkspaceStore(state => state.showTreeView);
export const useFilesTreeWidth = () =>
  useFilesWorkspaceStore(state => state.treeWidth);

// ✅ CORRECT: Use useShallow for multiple values when needed
export const useFilesWorkspaceSettings = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      settings: state.workspaceSettings,
      canSync: state.workspaceSettings.enableAutoSync,
      syncInterval: state.workspaceSettings.syncInterval,
    }))
  );

export const useFilesTreeState = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      tree: state.fileTree,
      stats: state.treeStats,
      operationStatus: state.treeOperationStatus,
      error: state.treeError,
      isLoading: state.treeOperationStatus === OPERATION_STATUS.LOADING,
      hasError: state.treeOperationStatus === OPERATION_STATUS.ERROR,
      isEmpty: state.fileTree.length === 0,
    }))
  );

export const useFilesNavigation = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      currentFolderId: state.currentFolderId,
      currentPath: state.currentPath,
      navigationPath: state.navigationPath,
      canGoBack: state.parentFolderId !== null,
      canGoToRoot: state.currentFolderId !== state.rootFolderId,
    }))
  );

export const useFilesTreeViewState = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      expandedNodes: state.expandedNodes,
      selectedNodes: state.selectedNodes,
      focusedNodeId: state.focusedNodeId,
      showTreeView: state.showTreeView,
      treeWidth: state.treeWidth,
      hasSelection: state.selectedNodes.length > 0,
      totalExpanded: state.expandedNodes.length,
    }))
  );

export const useFilesOperationStatus = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      workspace: state.workspaceOperations,
      folder: state.folderOperations,
      isAnyWorkspaceOperationInProgress:
        state.workspaceOperations.isLoading ||
        state.workspaceOperations.isSaving ||
        state.workspaceOperations.isSyncing,
      isAnyFolderOperationInProgress:
        state.folderOperations.isCreating ||
        state.folderOperations.isDeleting ||
        state.folderOperations.isMoving ||
        state.folderOperations.isRenaming,
    }))
  );

export const useFilesQuickAccess = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      recentFolders: state.recentFolders,
      favoriteFolders: state.favoriteFolders,
      pinnedFolders: state.pinnedFolders,
      hasRecent: state.recentFolders.length > 0,
      hasFavorites: state.favoriteFolders.length > 0,
      hasPinned: state.pinnedFolders.length > 0,
    }))
  );

export const useFilesFolderTemplates = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      templates: state.folderTemplates,
      builtInTemplates: state.folderTemplates.filter(t => t.isBuiltIn),
      userTemplates: state.folderTemplates.filter(t => !t.isBuiltIn),
      totalTemplates: state.folderTemplates.length,
    }))
  );

export const useFilesPreferences = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      preferences: state.preferences,
      keyboardNavigation: state.preferences.enableKeyboardNavigation,
      dragAndDrop: state.preferences.enableDragAndDrop,
      autoExpand: state.preferences.autoExpandTree,
    }))
  );

// ✅ CORRECT: Action selectors to avoid passing entire store
export const useFilesWorkspaceActions = () =>
  useFilesWorkspaceStore(
    useShallow(state => ({
      // Workspace management
      setCurrentWorkspace: state.setCurrentWorkspace,
      updateWorkspaceSettings: state.updateWorkspaceSettings,
      setWorkspaceLoading: state.setWorkspaceLoading,
      setWorkspaceSaving: state.setWorkspaceSaving,
      setWorkspaceSyncing: state.setWorkspaceSyncing,
      setSyncCompleted: state.setSyncCompleted,
      setSyncError: state.setSyncError,

      // Tree management
      setFileTree: state.setFileTree,
      updateTreeStats: state.updateTreeStats,
      setTreeOperationStatus: state.setTreeOperationStatus,
      setTreeError: state.setTreeError,
      refreshTree: state.refreshTree,

      // Navigation
      navigateToFolder: state.navigateToFolder,
      updateNavigationPath: state.updateNavigationPath,
      setCurrentFolder: state.setCurrentFolder,
      goBack: state.goBack,
      goForward: state.goForward,
      goToRoot: state.goToRoot,

      // Tree view
      expandTreeNode: state.expandTreeNode,
      collapseTreeNode: state.collapseTreeNode,
      toggleTreeNode: state.toggleTreeNode,
      selectTreeNode: state.selectTreeNode,
      deselectAllTreeNodes: state.deselectAllTreeNodes,
      setFocusedTreeNode: state.setFocusedTreeNode,
      setTreeViewVisible: state.setTreeViewVisible,
      setTreeWidth: state.setTreeWidth,

      // Folder operations
      setFolderCreating: state.setFolderCreating,
      setFolderDeleting: state.setFolderDeleting,
      setFolderMoving: state.setFolderMoving,
      setFolderRenaming: state.setFolderRenaming,
      setFolderOperationError: state.setFolderOperationError,
      clearFolderOperationStates: state.clearFolderOperationStates,

      // Quick access
      addRecentFolder: state.addRecentFolder,
      toggleFavoriteFolder: state.toggleFavoriteFolder,
      togglePinnedFolder: state.togglePinnedFolder,

      // Templates
      addFolderTemplate: state.addFolderTemplate,
      removeFolderTemplate: state.removeFolderTemplate,
      updateFolderTemplate: state.updateFolderTemplate,

      // Preferences
      updatePreferences: state.updatePreferences,

      // Utility
      reset: state.reset,
    }))
  );

// ===== COMPUTED SELECTORS =====
export const useIsTreeNodeExpanded = (nodeId: string) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.expandedNodes.includes(nodeId), [nodeId])
  );
};

export const useIsTreeNodeSelected = (nodeId: string) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.selectedNodes.includes(nodeId), [nodeId])
  );
};

export const useIsTreeNodeFocused = (nodeId: string) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.focusedNodeId === nodeId, [nodeId])
  );
};

export const useIsFolderFavorite = (folderId: FolderId) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.favoriteFolders.includes(folderId), [folderId])
  );
};

export const useIsFolderPinned = (folderId: FolderId) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.pinnedFolders.includes(folderId), [folderId])
  );
};

export const useIsFolderRecent = (folderId: FolderId) => {
  return useFilesWorkspaceStore(
    useCallback(state => state.recentFolders.includes(folderId), [folderId])
  );
};

export const useFolderTemplate = (templateId: string) => {
  return useFilesWorkspaceStore(
    useCallback(
      state => state.folderTemplates.find(t => t.id === templateId) || null,
      [templateId]
    )
  );
};

export const useFilesWorkspaceComputedState = () => {
  return useFilesWorkspaceStore(
    useMemo(
      () => state => ({
        hasWorkspace: state.currentWorkspace !== null,
        hasTree: state.fileTree.length > 0,
        hasSelection: state.selectedNodes.length > 0,
        hasExpanded: state.expandedNodes.length > 0,
        hasQuickAccess:
          state.recentFolders.length > 0 ||
          state.favoriteFolders.length > 0 ||
          state.pinnedFolders.length > 0,
        isTreeEmpty: state.fileTree.length === 0,
        isTreeLoading: state.treeOperationStatus === OPERATION_STATUS.LOADING,
        isTreeError: state.treeOperationStatus === OPERATION_STATUS.ERROR,
        canSync: state.workspaceSettings.enableAutoSync,
        needsSync:
          state.workspaceOperations.lastSyncAt === null ||
          (state.workspaceOperations.lastSyncAt &&
            Date.now() - state.workspaceOperations.lastSyncAt.getTime() >
              state.workspaceSettings.syncInterval),
      }),
      []
    )
  );
};
