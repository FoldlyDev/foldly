'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  FolderId,
  UserId,
  WorkspaceId,
  FileId,
  BatchId,
} from '@/types/ids';
import type { FileData, FolderData } from '../types';
import type { Workspace } from '@/lib/supabase/types';

// Enhanced color support with modern CSS color system
export const FOLDER_COLOR = {
  DEFAULT: '#64748b',
  RED: '#ef4444',
  ORANGE: '#f97316',
  YELLOW: '#eab308',
  GREEN: '#22c55e',
  BLUE: '#3b82f6',
  INDIGO: '#6366f1',
  PURPLE: '#a855f7',
  PINK: '#ec4899',
  GRAY: '#6b7280',
  EMERALD: '#10b981',
  ROSE: '#f43f5e',
  CYAN: '#06b6d4',
  LIME: '#84cc16',
} as const;

export type FolderColor = (typeof FOLDER_COLOR)[keyof typeof FOLDER_COLOR];

// Modern view modes for 2025 UX standards
export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
  CARD: 'card',
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

// Comprehensive sorting options
export const SORT_BY = {
  NAME: 'name',
  DATE_CREATED: 'dateCreated',
  DATE_MODIFIED: 'dateModified',
  SIZE: 'size',
  TYPE: 'type',
} as const;

export type SortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export const THUMBNAIL_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type ThumbnailSize =
  (typeof THUMBNAIL_SIZE)[keyof typeof THUMBNAIL_SIZE];

export const OPERATION_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type OperationStatus =
  (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

// ===== WORKSPACE TYPES =====
/**
 * Extended workspace data with additional UI-specific properties for files feature
 * Based on canonical Workspace type from single source of truth
 */
export interface WorkspaceData extends Workspace {
  // Additional computed properties for files feature
  readonly settings: WorkspaceSettings;
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

export type FilesWorkspaceStore = FilesWorkspaceState & FilesWorkspaceActions;

// ===== DEFAULT STATE =====
const defaultWorkspaceSettings: WorkspaceSettings = {
  defaultView: VIEW_MODE.GRID,
  sortBy: SORT_BY.NAME,
  sortOrder: SORT_ORDER.ASC,
  showHiddenFiles: false,
  autoBackup: true,
  thumbnailSize: THUMBNAIL_SIZE.MEDIUM,
  enableVersioning: false,
  maxVersions: 5,
  compressionLevel: 6,
  enableAutoSync: false,
  syncInterval: 300000, // 5 minutes
};

const initialState: FilesWorkspaceState = {
  // Workspace data
  currentWorkspace: null,
  workspaceSettings: defaultWorkspaceSettings,

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
  navigationPath: [],

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
  folderTemplates: [],

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

// ===== ZUSTAND STORE =====
export const useFilesWorkspaceStore = create<FilesWorkspaceStore>()(
  subscribeWithSelector(
    devtools(
      immer((set, get) => ({
        ...initialState,

        // Workspace management
        setCurrentWorkspace: (workspace: WorkspaceData | null) => {
          set(state => {
            state.currentWorkspace = workspace;
          });
        },

        updateWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => {
          set(state => {
            Object.assign(state.workspaceSettings, settings);
          });
        },

        setWorkspaceLoading: (loading: boolean) => {
          set(state => {
            state.workspaceOperations.isLoading = loading;
          });
        },

        setWorkspaceSaving: (saving: boolean) => {
          set(state => {
            state.workspaceOperations.isSaving = saving;
          });
        },

        setWorkspaceSyncing: (syncing: boolean) => {
          set(state => {
            state.workspaceOperations.isSyncing = syncing;
          });
        },

        setSyncCompleted: (timestamp: Date) => {
          set(state => {
            state.workspaceOperations.lastSyncAt = timestamp;
            state.workspaceOperations.syncError = null;
            state.workspaceOperations.isSyncing = false;
          });
        },

        setSyncError: (error: string | null) => {
          set(state => {
            state.workspaceOperations.syncError = error;
            state.workspaceOperations.isSyncing = false;
          });
        },

        // File tree management
        setFileTree: (tree: readonly FileTreeNode[]) => {
          set(state => {
            state.fileTree = tree as any;
          });
        },

        updateTreeStats: (stats: TreeStats) => {
          set(state => {
            state.treeStats = stats;
          });
        },

        setTreeOperationStatus: (status: OperationStatus) => {
          set(state => {
            state.treeOperationStatus = status;
          });
        },

        setTreeError: (error: string | null) => {
          set(state => {
            state.treeError = error;
          });
        },

        refreshTree: () => {
          set(state => {
            state.treeOperationStatus = OPERATION_STATUS.LOADING;
          });
        },

        // Tree view operations
        expandTreeNode: (nodeId: string) => {
          set(state => {
            if (!state.expandedNodes.includes(nodeId)) {
              state.expandedNodes.push(nodeId);
            }
          });
        },

        collapseTreeNode: (nodeId: string) => {
          set(state => {
            const index = state.expandedNodes.indexOf(nodeId);
            if (index > -1) {
              state.expandedNodes.splice(index, 1);
            }
          });
        },

        toggleTreeNode: (nodeId: string) => {
          const isExpanded = get().expandedNodes.includes(nodeId);
          if (isExpanded) {
            get().collapseTreeNode(nodeId);
          } else {
            get().expandTreeNode(nodeId);
          }
        },

        selectTreeNode: (nodeId: string, multiSelect = false) => {
          set(state => {
            if (multiSelect) {
              if (!state.selectedNodes.includes(nodeId)) {
                state.selectedNodes.push(nodeId);
              }
            } else {
              state.selectedNodes = [nodeId];
            }
          });
        },

        deselectAllTreeNodes: () => {
          set(state => {
            state.selectedNodes = [];
          });
        },

        setFocusedTreeNode: (nodeId: string | null) => {
          set(state => {
            state.focusedNodeId = nodeId;
          });
        },

        setTreeViewVisible: (visible: boolean) => {
          set(state => {
            state.showTreeView = visible;
          });
        },

        setTreeWidth: (width: number) => {
          set(state => {
            state.treeWidth = Math.max(200, Math.min(600, width));
          });
        },

        // Navigation operations
        navigateToFolder: (folderId: FolderId | null, path: string) => {
          set(state => {
            state.currentFolderId = folderId;
            state.currentPath = path;
          });
        },

        updateNavigationPath: (segments: readonly NavigationSegment[]) => {
          set(state => {
            state.navigationPath = segments as any;
          });
        },

        setCurrentFolder: (folderId: FolderId | null) => {
          set(state => {
            state.currentFolderId = folderId;
          });
        },

        goBack: () => {
          const { navigationPath } = get();
          if (navigationPath.length > 1) {
            const previousSegment = navigationPath[navigationPath.length - 2];
            if (previousSegment) {
              get().navigateToFolder(previousSegment.id, previousSegment.path);
            }
          }
        },

        goForward: () => {
          // Implementation depends on navigation history
        },

        goToRoot: () => {
          get().navigateToFolder(null, '/');
        },

        // Folder operations
        setFolderCreating: (creating: boolean) => {
          set(state => {
            state.folderOperations.isCreating = creating;
          });
        },

        setFolderDeleting: (deleting: boolean) => {
          set(state => {
            state.folderOperations.isDeleting = deleting;
          });
        },

        setFolderMoving: (moving: boolean) => {
          set(state => {
            state.folderOperations.isMoving = moving;
          });
        },

        setFolderRenaming: (renaming: boolean) => {
          set(state => {
            state.folderOperations.isRenaming = renaming;
          });
        },

        setFolderOperationError: (error: string | null) => {
          set(state => {
            state.folderOperations.operationError = error;
          });
        },

        clearFolderOperationStates: () => {
          set(state => {
            state.folderOperations.isCreating = false;
            state.folderOperations.isDeleting = false;
            state.folderOperations.isMoving = false;
            state.folderOperations.isRenaming = false;
            state.folderOperations.operationError = null;
          });
        },

        // Quick access operations
        addRecentFolder: (folderId: FolderId) => {
          set(state => {
            const recentFolders = state.recentFolders.filter(
              id => id !== folderId
            );
            recentFolders.unshift(folderId);
            state.recentFolders = recentFolders.slice(0, 10); // Keep last 10
          });
        },

        addFavoriteFolder: (folderId: FolderId) => {
          set(state => {
            if (!state.favoriteFolders.includes(folderId)) {
              state.favoriteFolders.push(folderId);
            }
          });
        },

        removeFavoriteFolder: (folderId: FolderId) => {
          set(state => {
            const index = state.favoriteFolders.indexOf(folderId);
            if (index > -1) {
              state.favoriteFolders.splice(index, 1);
            }
          });
        },

        toggleFavoriteFolder: (folderId: FolderId) => {
          const isFavorite = get().favoriteFolders.includes(folderId);
          if (isFavorite) {
            get().removeFavoriteFolder(folderId);
          } else {
            get().addFavoriteFolder(folderId);
          }
        },

        addPinnedFolder: (folderId: FolderId) => {
          set(state => {
            if (!state.pinnedFolders.includes(folderId)) {
              state.pinnedFolders.push(folderId);
            }
          });
        },

        removePinnedFolder: (folderId: FolderId) => {
          set(state => {
            const index = state.pinnedFolders.indexOf(folderId);
            if (index > -1) {
              state.pinnedFolders.splice(index, 1);
            }
          });
        },

        togglePinnedFolder: (folderId: FolderId) => {
          const isPinned = get().pinnedFolders.includes(folderId);
          if (isPinned) {
            get().removePinnedFolder(folderId);
          } else {
            get().addPinnedFolder(folderId);
          }
        },

        // Template operations
        addFolderTemplate: (template: FolderTemplate) => {
          set(state => {
            state.folderTemplates.push(template as any);
          });
        },

        removeFolderTemplate: (templateId: string) => {
          set(state => {
            const index = state.folderTemplates.findIndex(
              t => t.id === templateId
            );
            if (index > -1) {
              state.folderTemplates.splice(index, 1);
            }
          });
        },

        updateFolderTemplate: (
          templateId: string,
          updates: Partial<FolderTemplate>
        ) => {
          set(state => {
            const template = state.folderTemplates.find(
              t => t.id === templateId
            );
            if (template) {
              Object.assign(template, updates);
            }
          });
        },

        // Preferences
        updatePreferences: (
          preferences: Partial<FilesWorkspaceState['preferences']>
        ) => {
          set(state => {
            Object.assign(state.preferences, preferences);
          });
        },

        // Utility
        reset: () => {
          set(initialState);
        },
      })),
      { name: 'files-workspace-store' }
    )
  )
);

// ===== SELECTORS =====
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

// Complex selectors
export const useFilesWorkspaceSettings = () =>
  useFilesWorkspaceStore(state => state.workspaceSettings);

export const useFilesTreeState = () =>
  useFilesWorkspaceStore(state => ({
    tree: state.fileTree,
    stats: state.treeStats,
    status: state.treeOperationStatus,
    error: state.treeError,
  }));

export const useFilesNavigation = () =>
  useFilesWorkspaceStore(state => ({
    currentFolderId: state.currentFolderId,
    currentPath: state.currentPath,
    navigationPath: state.navigationPath,
  }));

export const useFilesTreeViewState = () =>
  useFilesWorkspaceStore(state => ({
    expandedNodes: state.expandedNodes,
    selectedNodes: state.selectedNodes,
    focusedNodeId: state.focusedNodeId,
    showTreeView: state.showTreeView,
    treeWidth: state.treeWidth,
  }));

export const useFilesOperationStatus = () =>
  useFilesWorkspaceStore(state => ({
    workspace: state.workspaceOperations,
    folder: state.folderOperations,
  }));

export const useFilesQuickAccess = () =>
  useFilesWorkspaceStore(state => ({
    recentFolders: state.recentFolders,
    favoriteFolders: state.favoriteFolders,
    pinnedFolders: state.pinnedFolders,
  }));

export const useFilesFolderTemplates = () =>
  useFilesWorkspaceStore(state => state.folderTemplates);

export const useFilesPreferences = () =>
  useFilesWorkspaceStore(state => state.preferences);

// Actions selector
export const useFilesWorkspaceActions = () =>
  useFilesWorkspaceStore(state => ({
    setCurrentWorkspace: state.setCurrentWorkspace,
    updateWorkspaceSettings: state.updateWorkspaceSettings,
    setWorkspaceLoading: state.setWorkspaceLoading,
    setWorkspaceSaving: state.setWorkspaceSaving,
    setWorkspaceSyncing: state.setWorkspaceSyncing,
    setSyncCompleted: state.setSyncCompleted,
    setSyncError: state.setSyncError,
    setFileTree: state.setFileTree,
    updateTreeStats: state.updateTreeStats,
    setTreeOperationStatus: state.setTreeOperationStatus,
    setTreeError: state.setTreeError,
    refreshTree: state.refreshTree,
    expandTreeNode: state.expandTreeNode,
    collapseTreeNode: state.collapseTreeNode,
    toggleTreeNode: state.toggleTreeNode,
    selectTreeNode: state.selectTreeNode,
    deselectAllTreeNodes: state.deselectAllTreeNodes,
    setFocusedTreeNode: state.setFocusedTreeNode,
    setTreeViewVisible: state.setTreeViewVisible,
    setTreeWidth: state.setTreeWidth,
    navigateToFolder: state.navigateToFolder,
    updateNavigationPath: state.updateNavigationPath,
    setCurrentFolder: state.setCurrentFolder,
    goBack: state.goBack,
    goForward: state.goForward,
    goToRoot: state.goToRoot,
    setFolderCreating: state.setFolderCreating,
    setFolderDeleting: state.setFolderDeleting,
    setFolderMoving: state.setFolderMoving,
    setFolderRenaming: state.setFolderRenaming,
    setFolderOperationError: state.setFolderOperationError,
    clearFolderOperationStates: state.clearFolderOperationStates,
    addRecentFolder: state.addRecentFolder,
    addFavoriteFolder: state.addFavoriteFolder,
    removeFavoriteFolder: state.removeFavoriteFolder,
    toggleFavoriteFolder: state.toggleFavoriteFolder,
    addPinnedFolder: state.addPinnedFolder,
    removePinnedFolder: state.removePinnedFolder,
    togglePinnedFolder: state.togglePinnedFolder,
    addFolderTemplate: state.addFolderTemplate,
    removeFolderTemplate: state.removeFolderTemplate,
    updateFolderTemplate: state.updateFolderTemplate,
    updatePreferences: state.updatePreferences,
    reset: state.reset,
  }));

// Computed selectors with memoization
export const useIsTreeNodeExpanded = (nodeId: string) => {
  return useFilesWorkspaceStore(state => state.expandedNodes.includes(nodeId));
};

export const useIsTreeNodeSelected = (nodeId: string) => {
  return useFilesWorkspaceStore(state => state.selectedNodes.includes(nodeId));
};

export const useIsTreeNodeFocused = (nodeId: string) => {
  return useFilesWorkspaceStore(state => state.focusedNodeId === nodeId);
};

export const useIsFolderFavorite = (folderId: FolderId) => {
  return useFilesWorkspaceStore(state =>
    state.favoriteFolders.includes(folderId)
  );
};

export const useIsFolderPinned = (folderId: FolderId) => {
  return useFilesWorkspaceStore(state =>
    state.pinnedFolders.includes(folderId)
  );
};

export const useIsFolderRecent = (folderId: FolderId) => {
  return useFilesWorkspaceStore(state =>
    state.recentFolders.includes(folderId)
  );
};

export const useFolderTemplate = (templateId: string) => {
  return useFilesWorkspaceStore(state =>
    state.folderTemplates.find(t => t.id === templateId)
  );
};

// Advanced computed state
export const useFilesWorkspaceComputedState = () => {
  return useFilesWorkspaceStore(state => ({
    hasWorkspace: !!state.currentWorkspace,
    isAtRoot: state.currentFolderId === null,
    hasSelectedNodes: state.selectedNodes.length > 0,
    treeOperationInProgress:
      state.treeOperationStatus === OPERATION_STATUS.LOADING,
    anyFolderOperation:
      state.folderOperations.isCreating ||
      state.folderOperations.isDeleting ||
      state.folderOperations.isMoving ||
      state.folderOperations.isRenaming,
    workspaceOperationInProgress:
      state.workspaceOperations.isLoading ||
      state.workspaceOperations.isSaving ||
      state.workspaceOperations.isSyncing,
  }));
};
