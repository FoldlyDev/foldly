// =============================================================================
// FILE TREE CONTEXT TYPES - Context-specific interfaces and configurations
// =============================================================================
// 🎯 Defines different behaviors for workspace, files, and upload contexts

import type { DatabaseId, File, Folder, Link } from '@/lib/supabase/types';
import type { TreeNode, TreeAction } from './tree-types';

// =============================================================================
// WORKSPACE CONTEXT - Personal file management
// =============================================================================

/**
 * Workspace context configuration
 */
export interface WorkspaceContextConfig {
  workspaceId: DatabaseId;
  allowFolderCreation: boolean;
  allowFileUpload: boolean;
  allowDragDrop: boolean;
  allowContextMenu: boolean;
  maxDepth: number;
  showInlineActions: boolean;
}

/**
 * Workspace tree operations
 */
export interface WorkspaceOperations {
  createFolder: (parentId: DatabaseId | null, name: string) => Promise<Folder>;
  renameItem: (nodeId: DatabaseId, newName: string) => Promise<void>;
  deleteItem: (nodeId: DatabaseId) => Promise<void>;
  moveItem: (
    nodeId: DatabaseId,
    targetParentId: DatabaseId | null
  ) => Promise<void>;
  downloadItem: (nodeId: DatabaseId) => Promise<void>;
  uploadFile: (parentId: DatabaseId | null, file: File) => Promise<void>;
}

/**
 * Workspace context menu actions
 */
export const WORKSPACE_FOLDER_ACTIONS: TreeAction[] = [
  {
    type: 'create-folder',
    label: 'Add Folder',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'rename',
    label: 'Rename',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'delete',
    label: 'Delete',
    destructive: true,
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'download',
    label: 'Download',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

export const WORKSPACE_FILE_ACTIONS: TreeAction[] = [
  {
    type: 'download',
    label: 'Download',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'rename',
    label: 'Rename',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'move',
    label: 'Move',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'delete',
    label: 'Delete',
    destructive: true,
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

// =============================================================================
// FILES CONTEXT - Link management and workspace integration
// =============================================================================

/**
 * Files context configuration
 */
export interface FilesContextConfig {
  showLinkPanel: boolean;
  showWorkspacePanel: boolean;
  allowDragFromLinks: boolean;
  allowMultiSelect: boolean;
  workspaceId: DatabaseId;
  selectedLinks: DatabaseId[];
}

/**
 * Files context operations
 */
export interface FilesOperations {
  loadLinkContents: (linkId: DatabaseId) => Promise<TreeNode[]>;
  sendToWorkspace: (
    nodeIds: DatabaseId[],
    targetFolderId?: DatabaseId
  ) => Promise<void>;
  downloadFromLink: (nodeId: DatabaseId) => Promise<void>;
  expandLink: (linkId: DatabaseId) => Promise<TreeNode[]>;
}

/**
 * Files context menu actions (limited)
 */
export const FILES_LINK_ACTIONS: TreeAction[] = [
  {
    type: 'download',
    label: 'Download',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

export const FILES_SELECTION_ACTIONS: TreeAction[] = [
  {
    type: 'send-to-workspace',
    label: 'Send to Workspace',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'download',
    label: 'Download Selected',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

// =============================================================================
// UPLOAD CONTEXT - File organization during upload
// =============================================================================

/**
 * Upload context configuration
 */
export interface UploadContextConfig {
  allowFolderCreation: boolean;
  allowFileReorganization: boolean;
  allowDragDrop: boolean;
  maxDepth: number;
  targetLinkId: DatabaseId;
  temporaryStructure: boolean;
}

/**
 * Upload context operations
 */
export interface UploadOperations {
  createTempFolder: (
    parentId: DatabaseId | null,
    name: string
  ) => Promise<TreeNode>;
  organizeFiles: (files: File[], structure: TreeNode[]) => Promise<void>;
  removeFromStructure: (nodeId: DatabaseId) => Promise<void>;
  moveInStructure: (
    nodeId: DatabaseId,
    targetParentId: DatabaseId | null
  ) => Promise<void>;
}

/**
 * Upload context menu actions
 */
export const UPLOAD_FOLDER_ACTIONS: TreeAction[] = [
  {
    type: 'create-folder',
    label: 'Create Folder',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'rename',
    label: 'Rename',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'delete',
    label: 'Remove',
    destructive: true,
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

export const UPLOAD_FILE_ACTIONS: TreeAction[] = [
  {
    type: 'move',
    label: 'Move',
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
  {
    type: 'delete',
    label: 'Remove',
    destructive: true,
    handler: async (nodeId: DatabaseId) => {
      // Implementation will be added in hooks
    },
  },
];

// =============================================================================
// CONTEXT FACTORY - Factory functions to create context configurations
// =============================================================================

/**
 * Context configuration factory
 */
export interface ContextConfigFactory {
  createWorkspaceConfig: (workspaceId: DatabaseId) => WorkspaceContextConfig;
  createFilesConfig: (
    workspaceId: DatabaseId,
    linkIds: DatabaseId[]
  ) => FilesContextConfig;
  createUploadConfig: (linkId: DatabaseId) => UploadContextConfig;
}

/**
 * Context operations factory
 */
export interface ContextOperationsFactory {
  createWorkspaceOperations: (workspaceId: DatabaseId) => WorkspaceOperations;
  createFilesOperations: (workspaceId: DatabaseId) => FilesOperations;
  createUploadOperations: (linkId: DatabaseId) => UploadOperations;
}

// =============================================================================
// CONTEXT TYPES UNION - Union types for all contexts
// =============================================================================

/**
 * All context configurations
 */
export type ContextConfig =
  | WorkspaceContextConfig
  | FilesContextConfig
  | UploadContextConfig;

/**
 * All context operations
 */
export type ContextOperations =
  | WorkspaceOperations
  | FilesOperations
  | UploadOperations;

/**
 * Context type discriminator
 */
export type ContextType = 'workspace' | 'files' | 'upload';

/**
 * Context with type information
 */
export interface TypedContext<T extends ContextType> {
  type: T;
  config: T extends 'workspace'
    ? WorkspaceContextConfig
    : T extends 'files'
      ? FilesContextConfig
      : T extends 'upload'
        ? UploadContextConfig
        : never;
  operations: T extends 'workspace'
    ? WorkspaceOperations
    : T extends 'files'
      ? FilesOperations
      : T extends 'upload'
        ? UploadOperations
        : never;
}

// =============================================================================
// CONTEXT HELPERS - Helper functions for context management
// =============================================================================

/**
 * Get context menu actions for a node
 */
export const getContextMenuActions = (
  contextType: ContextType,
  nodeType: 'file' | 'folder' | 'link'
): TreeAction[] => {
  switch (contextType) {
    case 'workspace':
      return nodeType === 'folder'
        ? WORKSPACE_FOLDER_ACTIONS
        : WORKSPACE_FILE_ACTIONS;
    case 'files':
      return nodeType === 'link' ? FILES_LINK_ACTIONS : FILES_SELECTION_ACTIONS;
    case 'upload':
      return nodeType === 'folder'
        ? UPLOAD_FOLDER_ACTIONS
        : UPLOAD_FILE_ACTIONS;
    default:
      return [];
  }
};

/**
 * Check if context supports drag and drop
 */
export const supportsDragDrop = (contextType: ContextType): boolean => {
  switch (contextType) {
    case 'workspace':
    case 'upload':
      return true;
    case 'files':
      return false; // Only drag from links to workspace
    default:
      return false;
  }
};

/**
 * Check if context supports folder creation
 */
export const supportsFolderCreation = (contextType: ContextType): boolean => {
  switch (contextType) {
    case 'workspace':
    case 'upload':
      return true;
    case 'files':
      return false;
    default:
      return false;
  }
};

/**
 * Check if context supports context menu
 */
export const supportsContextMenu = (contextType: ContextType): boolean => {
  switch (contextType) {
    case 'workspace':
    case 'upload':
      return true;
    case 'files':
      return false; // Limited context menu only
    default:
      return false;
  }
};

/**
 * Get maximum depth for context
 */
export const getMaxDepth = (contextType: ContextType): number => {
  switch (contextType) {
    case 'workspace':
      return 10;
    case 'files':
      return 5;
    case 'upload':
      return 5;
    default:
      return 3;
  }
};

/**
 * Get default configuration for context
 */
export const getDefaultConfig = (
  contextType: ContextType
): Partial<ContextConfig> => {
  switch (contextType) {
    case 'workspace':
      return {
        allowFolderCreation: true,
        allowFileUpload: true,
        allowDragDrop: true,
        allowContextMenu: true,
        maxDepth: 10,
        showInlineActions: true,
      };
    case 'files':
      return {
        showLinkPanel: true,
        showWorkspacePanel: true,
        allowDragFromLinks: true,
        allowMultiSelect: true,
        selectedLinks: [],
      };
    case 'upload':
      return {
        allowFolderCreation: true,
        allowFileReorganization: true,
        allowDragDrop: true,
        maxDepth: 5,
        temporaryStructure: true,
      };
    default:
      return {};
  }
};
