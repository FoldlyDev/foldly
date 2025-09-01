// =============================================================================
// BASE TREE CONFIGURATION - Foundation for all tree types in files feature
// =============================================================================
// 🎯 Purpose: Define configuration types and base settings for trees
// 📦 Used by: All tree components in the files feature
// 🔧 Pattern: Configuration factory pattern matching workspace approach

import type { 
  DropOperationCallbacks 
} from '@/components/file-tree/handlers/drop-handler';
import type { 
  RenameOperationCallback 
} from '@/components/file-tree/handlers/rename-handler';
import type { 
  ContextMenuItem,
  ContextMenuProvider 
} from '@/components/file-tree/core/tree';
import type { TreeItem } from '@/components/file-tree/types/tree-types';

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Feature toggles for tree capabilities
 * Maps directly to FileTree component props
 */
export interface TreeFeatures {
  // Core interaction features
  selection: boolean;           // Allow item selection
  multiSelect: boolean;          // Allow multiple selection
  checkboxes: boolean;           // Show checkboxes for batch operations
  search: boolean;               // Enable search/filter
  
  // Item operations
  contextMenu: boolean;          // Right-click context menu
  rename: boolean;               // Inline rename capability
  delete: boolean;               // Delete items capability
  
  // Drag and drop
  dragDrop: boolean;             // Internal drag-drop reordering
  foreignDrag: boolean;          // Drag items OUT to other trees
  acceptDrops: boolean;          // Accept drops FROM other trees
  externalFileDrop: boolean;     // Accept OS file drops
}

/**
 * Display options for tree items
 * Controls what metadata is shown
 */
export interface TreeDisplayOptions {
  showFileSize: boolean;
  showFileDate: boolean;
  showFileStatus: boolean;
  showFolderCount: boolean;
  showFolderSize: boolean;
}

/**
 * Permission checks for operations
 * Can be functions for dynamic permissions
 */
export interface TreePermissions {
  canDragItems: boolean | ((item: TreeItem) => boolean);
  canDropItems: boolean | ((item: TreeItem, target: TreeItem) => boolean);
  canRename: boolean | ((item: TreeItem) => boolean);
  canDelete: boolean | ((item: TreeItem) => boolean);
  canCreateFolder: boolean | ((parentId: string) => boolean);
}

/**
 * Handler callbacks for tree operations
 * These connect tree events to actions
 */
export interface TreeHandlers {
  // Drop operations (internal tree drag-drop)
  dropCallbacks?: DropOperationCallbacks;
  
  // Rename operation
  renameCallback?: RenameOperationCallback;
  
  // Context menu provider
  contextMenuProvider?: ContextMenuProvider;
  
  // External file drop (from OS)
  onExternalFileDrop?: (
    files: File[], 
    targetFolderId: string | null, 
    folderStructure?: { [folder: string]: File[] }
  ) => void;
  
  // Selection change
  onSelectionChange?: (selectedItems: string[]) => void;
  
  // Tree ready callback
  onTreeReady?: (tree: any) => void;
}

/**
 * Complete tree configuration
 * Combines all aspects of tree behavior
 */
export interface TreeConfiguration {
  id: string;                          // Unique identifier for this config
  name: string;                         // Human-readable name
  description: string;                  // Purpose of this tree type
  features: TreeFeatures;               // Feature toggles
  display: TreeDisplayOptions;          // Display options
  permissions: TreePermissions;         // Permission checks
  handlers?: TreeHandlers;              // Event handlers (optional, added at runtime)
}

// =============================================================================
// BASE CONFIGURATIONS
// =============================================================================

/**
 * Default display options shared across most trees
 */
export const defaultDisplayOptions: TreeDisplayOptions = {
  showFileSize: true,
  showFileDate: false,
  showFileStatus: false,
  showFolderCount: true,
  showFolderSize: false,
};

/**
 * Base configuration with all features disabled
 * Use as starting point for specific configs
 */
export const baseTreeConfig: Omit<TreeConfiguration, 'id' | 'name' | 'description'> = {
  features: {
    selection: false,
    multiSelect: false,
    checkboxes: false,
    search: false,
    contextMenu: false,
    rename: false,
    delete: false,
    dragDrop: false,
    foreignDrag: false,
    acceptDrops: false,
    externalFileDrop: false,
  },
  display: defaultDisplayOptions,
  permissions: {
    canDragItems: false,
    canDropItems: false,
    canRename: false,
    canDelete: false,
    canCreateFolder: false,
  },
};

// =============================================================================
// CONFIGURATION HELPERS
// =============================================================================

/**
 * Helper to create a tree configuration with defaults
 */
export function createTreeConfig(
  id: string,
  name: string,
  description: string,
  overrides: Partial<Omit<TreeConfiguration, 'id' | 'name' | 'description'>> = {}
): TreeConfiguration {
  return {
    id,
    name,
    description,
    features: {
      ...baseTreeConfig.features,
      ...(overrides.features || {}),
    },
    display: {
      ...baseTreeConfig.display,
      ...(overrides.display || {}),
    },
    permissions: {
      ...baseTreeConfig.permissions,
      ...(overrides.permissions || {}),
    },
    ...(overrides.handlers && { handlers: overrides.handlers }),
  };
}

/**
 * Check if a permission allows an operation
 */
export function checkPermission<T>(
  permission: boolean | ((item: T) => boolean),
  item?: T
): boolean {
  if (typeof permission === 'boolean') {
    return permission;
  }
  return item ? permission(item) : false;
}

/**
 * Merge two configurations, with second overriding first
 */
export function mergeConfigs(
  base: TreeConfiguration,
  overrides: Partial<TreeConfiguration>
): TreeConfiguration {
  return {
    ...base,
    ...overrides,
    features: {
      ...base.features,
      ...overrides.features,
    },
    display: {
      ...base.display,
      ...overrides.display,
    },
    permissions: {
      ...base.permissions,
      ...overrides.permissions,
    },
    handlers: {
      ...base.handlers,
      ...overrides.handlers,
    },
  };
}