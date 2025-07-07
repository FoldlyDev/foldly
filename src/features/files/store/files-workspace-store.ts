// Files Workspace Store - Workspace and Folder Management
// Zustand store for workspace-specific operations and folder hierarchies
// Following 2025 TypeScript best practices with pure reducers

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  WorkspaceData,
  FolderData,
  FileData,
  FileTreeNode,
  WorkspaceId,
  FolderId,
  FileId,
  FolderColor,
} from '../types';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import {
  createFileTree,
  createEnhancedTree,
  expandNode,
  collapseNode,
  toggleNode,
  selectNode,
  deselectAllNodes,
  validateTree,
  calculateTreeStats,
} from '../utils';

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface FilesWorkspaceState {
  // Workspace data
  readonly currentWorkspace: WorkspaceData | null;
  readonly workspaceSettings: {
    readonly defaultView: 'grid' | 'list' | 'card';
    readonly sortBy: 'name' | 'size' | 'type' | 'createdAt' | 'updatedAt';
    readonly sortOrder: 'asc' | 'desc';
    readonly showHiddenFiles: boolean;
    readonly autoBackup: boolean;
    readonly thumbnailSize: 'small' | 'medium' | 'large';
    readonly enableVersioning: boolean;
    readonly maxVersions: number;
    readonly compressionLevel: number;
  };

  // File tree state
  readonly fileTree: FileTreeNode[];
  readonly treeStats: ReturnType<typeof calculateTreeStats> | null;
  readonly isTreeLoading: boolean;
  readonly treeError: string | null;

  // Folder operations
  readonly folderOperations: {
    readonly isCreating: boolean;
    readonly isDeleting: boolean;
    readonly isMoving: boolean;
    readonly isRenaming: boolean;
    readonly operationError: string | null;
  };

  // Workspace operations
  readonly workspaceOperations: {
    readonly isSaving: boolean;
    readonly isLoading: boolean;
    readonly isSyncing: boolean;
    readonly lastSyncAt: Date | null;
    readonly syncError: string | null;
  };

  // Navigation state
  readonly navigationState: {
    readonly currentPath: string;
    readonly currentFolderId: FolderId | null;
    readonly parentFolderId: FolderId | null;
    readonly rootFolderId: FolderId | null;
    readonly pathSegments: Array<{
      id: FolderId | null;
      name: string;
      path: string;
    }>;
  };

  // Tree view state
  readonly treeViewState: {
    readonly expandedNodes: string[];
    readonly selectedNodes: string[];
    readonly collapsedNodes: string[];
    readonly focusedNodeId: string | null;
    readonly showTreeView: boolean;
    readonly treeWidth: number;
  };

  // Folder templates
  readonly folderTemplates: Array<{
    readonly id: string;
    readonly name: string;
    readonly color: FolderColor;
    readonly icon: string;
    readonly description: string;
    readonly predefinedTags: string[];
  }>;

  // Quick access
  readonly quickAccess: {
    readonly recentFolders: FolderId[];
    readonly favoriteFolders: FolderId[];
    readonly pinnedFolders: FolderId[];
  };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FilesWorkspaceState = {
  // Workspace data
  currentWorkspace: null,
  workspaceSettings: {
    defaultView: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHiddenFiles: false,
    autoBackup: true,
    thumbnailSize: 'medium',
    enableVersioning: true,
    maxVersions: 10,
    compressionLevel: 6,
  },

  // File tree state
  fileTree: [],
  treeStats: null,
  isTreeLoading: false,
  treeError: null,

  // Folder operations
  folderOperations: {
    isCreating: false,
    isDeleting: false,
    isMoving: false,
    isRenaming: false,
    operationError: null,
  },

  // Workspace operations
  workspaceOperations: {
    isSaving: false,
    isLoading: false,
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
  },

  // Navigation state
  navigationState: {
    currentPath: '/',
    currentFolderId: null,
    parentFolderId: null,
    rootFolderId: null,
    pathSegments: [{ id: null, name: 'Home', path: '/' }],
  },

  // Tree view state
  treeViewState: {
    expandedNodes: [],
    selectedNodes: [],
    collapsedNodes: [],
    focusedNodeId: null,
    showTreeView: true,
    treeWidth: 280,
  },

  // Folder templates
  folderTemplates: [
    {
      id: 'documents',
      name: 'Documents',
      color: 'blue',
      icon: '📁',
      description: 'For storing documents and reports',
      predefinedTags: ['documents', 'official'],
    },
    {
      id: 'projects',
      name: 'Projects',
      color: 'green',
      icon: '📊',
      description: 'For project files and deliverables',
      predefinedTags: ['projects', 'work'],
    },
    {
      id: 'media',
      name: 'Media',
      color: 'purple',
      icon: '🎬',
      description: 'For videos, images, and audio files',
      predefinedTags: ['media', 'content'],
    },
    {
      id: 'archive',
      name: 'Archive',
      color: 'gray',
      icon: '📦',
      description: 'For archived and old files',
      predefinedTags: ['archive', 'backup'],
    },
  ],

  // Quick access
  quickAccess: {
    recentFolders: [],
    favoriteFolders: [],
    pinnedFolders: [],
  },
};

// =============================================================================
// PURE REDUCERS
// =============================================================================

const workspaceReducers = createReducers<
  FilesWorkspaceState,
  {
    // Workspace operations
    setCurrentWorkspace: (
      state: FilesWorkspaceState,
      workspace: WorkspaceData | null
    ) => FilesWorkspaceState;
    updateWorkspaceSettings: (
      state: FilesWorkspaceState,
      settings: Partial<FilesWorkspaceState['workspaceSettings']>
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

    // File tree operations
    setFileTree: (
      state: FilesWorkspaceState,
      tree: FileTreeNode[]
    ) => FilesWorkspaceState;
    updateFileTree: (
      state: FilesWorkspaceState,
      files: FileData[],
      folders: FolderData[]
    ) => FilesWorkspaceState;
    setTreeLoading: (
      state: FilesWorkspaceState,
      loading: boolean
    ) => FilesWorkspaceState;
    setTreeError: (
      state: FilesWorkspaceState,
      error: string | null
    ) => FilesWorkspaceState;
    refreshTreeStats: (state: FilesWorkspaceState) => FilesWorkspaceState;

    // Tree view operations
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

    // Navigation operations
    navigateToFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId | null,
      path: string
    ) => FilesWorkspaceState;
    updateNavigationPath: (
      state: FilesWorkspaceState,
      segments: Array<{ id: FolderId | null; name: string; path: string }>
    ) => FilesWorkspaceState;
    setCurrentFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId | null
    ) => FilesWorkspaceState;

    // Folder operations
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

    // Quick access operations
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
    addPinnedFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;
    removePinnedFolder: (
      state: FilesWorkspaceState,
      folderId: FolderId
    ) => FilesWorkspaceState;

    // Template operations
    addFolderTemplate: (
      state: FilesWorkspaceState,
      template: FilesWorkspaceState['folderTemplates'][0]
    ) => FilesWorkspaceState;
    removeFolderTemplate: (
      state: FilesWorkspaceState,
      templateId: string
    ) => FilesWorkspaceState;
    updateFolderTemplate: (
      state: FilesWorkspaceState,
      templateId: string,
      updates: Partial<FilesWorkspaceState['folderTemplates'][0]>
    ) => FilesWorkspaceState;

    // Reset operations
    resetWorkspaceState: (state: FilesWorkspaceState) => FilesWorkspaceState;
  }
>({
  // Workspace operations
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

  // File tree operations
  setFileTree: (state, tree) => ({
    ...state,
    fileTree: tree,
    treeStats: calculateTreeStats(tree),
  }),

  updateFileTree: (state, files, folders) => {
    const newTree = createFileTree(
      files,
      folders,
      state.navigationState.rootFolderId
    );
    return {
      ...state,
      fileTree: newTree,
      treeStats: calculateTreeStats(newTree),
    };
  },

  setTreeLoading: (state, loading) => ({
    ...state,
    isTreeLoading: loading,
  }),

  setTreeError: (state, error) => ({
    ...state,
    treeError: error,
    isTreeLoading: false,
  }),

  refreshTreeStats: state => ({
    ...state,
    treeStats: calculateTreeStats(state.fileTree),
  }),

  // Tree view operations
  expandTreeNode: (state, nodeId) => ({
    ...state,
    fileTree: expandNode(state.fileTree, nodeId),
    treeViewState: {
      ...state.treeViewState,
      expandedNodes: state.treeViewState.expandedNodes.includes(nodeId)
        ? state.treeViewState.expandedNodes
        : [...state.treeViewState.expandedNodes, nodeId],
      collapsedNodes: state.treeViewState.collapsedNodes.filter(
        id => id !== nodeId
      ),
    },
  }),

  collapseTreeNode: (state, nodeId) => ({
    ...state,
    fileTree: collapseNode(state.fileTree, nodeId),
    treeViewState: {
      ...state.treeViewState,
      collapsedNodes: state.treeViewState.collapsedNodes.includes(nodeId)
        ? state.treeViewState.collapsedNodes
        : [...state.treeViewState.collapsedNodes, nodeId],
      expandedNodes: state.treeViewState.expandedNodes.filter(
        id => id !== nodeId
      ),
    },
  }),

  toggleTreeNode: (state, nodeId) => ({
    ...state,
    fileTree: toggleNode(state.fileTree, nodeId),
    treeViewState: {
      ...state.treeViewState,
      expandedNodes: state.treeViewState.expandedNodes.includes(nodeId)
        ? state.treeViewState.expandedNodes.filter(id => id !== nodeId)
        : [...state.treeViewState.expandedNodes, nodeId],
      collapsedNodes: state.treeViewState.collapsedNodes.includes(nodeId)
        ? state.treeViewState.collapsedNodes.filter(id => id !== nodeId)
        : [...state.treeViewState.collapsedNodes, nodeId],
    },
  }),

  selectTreeNode: (state, nodeId, multiSelect = false) => ({
    ...state,
    fileTree: selectNode(state.fileTree, nodeId, multiSelect),
    treeViewState: {
      ...state.treeViewState,
      selectedNodes: multiSelect
        ? state.treeViewState.selectedNodes.includes(nodeId)
          ? state.treeViewState.selectedNodes.filter(id => id !== nodeId)
          : [...state.treeViewState.selectedNodes, nodeId]
        : [nodeId],
    },
  }),

  deselectAllTreeNodes: state => ({
    ...state,
    fileTree: deselectAllNodes(state.fileTree),
    treeViewState: {
      ...state.treeViewState,
      selectedNodes: [],
    },
  }),

  setFocusedTreeNode: (state, nodeId) => ({
    ...state,
    treeViewState: {
      ...state.treeViewState,
      focusedNodeId: nodeId,
    },
  }),

  setTreeViewVisible: (state, visible) => ({
    ...state,
    treeViewState: {
      ...state.treeViewState,
      showTreeView: visible,
    },
  }),

  setTreeWidth: (state, width) => ({
    ...state,
    treeViewState: {
      ...state.treeViewState,
      treeWidth: Math.max(200, Math.min(600, width)),
    },
  }),

  // Navigation operations
  navigateToFolder: (state, folderId, path) => ({
    ...state,
    navigationState: {
      ...state.navigationState,
      currentFolderId: folderId,
      currentPath: path,
    },
  }),

  updateNavigationPath: (state, segments) => ({
    ...state,
    navigationState: {
      ...state.navigationState,
      pathSegments: segments,
    },
  }),

  setCurrentFolder: (state, folderId) => ({
    ...state,
    navigationState: {
      ...state.navigationState,
      currentFolderId: folderId,
    },
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
    quickAccess: {
      ...state.quickAccess,
      recentFolders: [
        folderId,
        ...state.quickAccess.recentFolders.filter(id => id !== folderId),
      ].slice(0, 10), // Keep only last 10
    },
  }),

  addFavoriteFolder: (state, folderId) => ({
    ...state,
    quickAccess: {
      ...state.quickAccess,
      favoriteFolders: state.quickAccess.favoriteFolders.includes(folderId)
        ? state.quickAccess.favoriteFolders
        : [...state.quickAccess.favoriteFolders, folderId],
    },
  }),

  removeFavoriteFolder: (state, folderId) => ({
    ...state,
    quickAccess: {
      ...state.quickAccess,
      favoriteFolders: state.quickAccess.favoriteFolders.filter(
        id => id !== folderId
      ),
    },
  }),

  addPinnedFolder: (state, folderId) => ({
    ...state,
    quickAccess: {
      ...state.quickAccess,
      pinnedFolders: state.quickAccess.pinnedFolders.includes(folderId)
        ? state.quickAccess.pinnedFolders
        : [...state.quickAccess.pinnedFolders, folderId],
    },
  }),

  removePinnedFolder: (state, folderId) => ({
    ...state,
    quickAccess: {
      ...state.quickAccess,
      pinnedFolders: state.quickAccess.pinnedFolders.filter(
        id => id !== folderId
      ),
    },
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

  // Reset operations
  resetWorkspaceState: state => ({
    ...initialState,
    folderTemplates: state.folderTemplates, // Keep user templates
  }),
});

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesWorkspaceStore = create<
  FilesWorkspaceState &
    ReturnType<
      typeof convertReducersToActions<
        FilesWorkspaceState,
        typeof workspaceReducers
      >
    >
>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        ...convertReducersToActions(set, workspaceReducers),
      }),
      {
        name: 'files-workspace-store',
        partialize: state => ({
          workspaceSettings: state.workspaceSettings,
          treeViewState: state.treeViewState,
          folderTemplates: state.folderTemplates,
          quickAccess: state.quickAccess,
        }),
      }
    ),
    {
      name: 'files-workspace-store',
    }
  )
);

// =============================================================================
// COMPUTED SELECTORS
// =============================================================================

/**
 * Check if any folder operation is in progress
 */
export const isAnyFolderOperationInProgress = (
  state: FilesWorkspaceState
): boolean => {
  const ops = state.folderOperations;
  return ops.isCreating || ops.isDeleting || ops.isMoving || ops.isRenaming;
};

/**
 * Check if any workspace operation is in progress
 */
export const isAnyWorkspaceOperationInProgress = (
  state: FilesWorkspaceState
): boolean => {
  const ops = state.workspaceOperations;
  return ops.isLoading || ops.isSaving || ops.isSyncing;
};

/**
 * Get current folder breadcrumbs
 */
export const getCurrentBreadcrumbs = (state: FilesWorkspaceState) => {
  return state.navigationState.pathSegments;
};

/**
 * Check if folder is in favorites
 */
export const isFolderFavorite = (
  state: FilesWorkspaceState,
  folderId: FolderId
): boolean => {
  return state.quickAccess.favoriteFolders.includes(folderId);
};

/**
 * Check if folder is pinned
 */
export const isFolderPinned = (
  state: FilesWorkspaceState,
  folderId: FolderId
): boolean => {
  return state.quickAccess.pinnedFolders.includes(folderId);
};

/**
 * Check if tree node is expanded
 */
export const isTreeNodeExpanded = (
  state: FilesWorkspaceState,
  nodeId: string
): boolean => {
  return state.treeViewState.expandedNodes.includes(nodeId);
};

/**
 * Check if tree node is selected
 */
export const isTreeNodeSelected = (
  state: FilesWorkspaceState,
  nodeId: string
): boolean => {
  return state.treeViewState.selectedNodes.includes(nodeId);
};

/**
 * Get tree validation result
 */
export const getTreeValidation = (state: FilesWorkspaceState) => {
  return validateTree(state.fileTree);
};

/**
 * Get folder template by ID
 */
export const getFolderTemplateById = (
  state: FilesWorkspaceState,
  templateId: string
) => {
  return (
    state.folderTemplates.find(template => template.id === templateId) || null
  );
};
