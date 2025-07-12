// =============================================================================
// FILE TREE TYPES - Core interfaces for dynamic file tree component
// =============================================================================
// 🎯 Based on existing types from src/lib/supabase/types
// Following single source of truth principle

import type {
  DatabaseId,
  File,
  Folder,
  Link,
  UploadFile,
} from '@/lib/supabase/types';

// =============================================================================
// CORE TREE TYPES - Universal tree node interface
// =============================================================================

/**
 * TreeNode - Universal interface for all tree items
 * Works across workspace, files, and upload contexts
 */
export interface TreeNode {
  id: DatabaseId;
  name: string;
  type: 'file' | 'folder' | 'link';
  size?: number;
  mimeType?: string;
  path?: string;
  parentId?: DatabaseId | null;
  children?: TreeNode[];

  // Context-specific data
  fileData?: File;
  folderData?: Folder;
  linkData?: Link;
  uploadData?: UploadFile;

  // UI state
  isExpanded?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
  level?: number;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// COMPONENT PROPS - Props for tree components
// =============================================================================

/**
 * TreeContainer component props
 */
export interface TreeContainerProps {
  contextType: 'workspace' | 'files' | 'upload';
  data: TreeNode[];
  onNodeSelect?: (nodeId: DatabaseId) => void;
  onNodeExpand?: (nodeId: DatabaseId) => void;
  onNodeAction?: (action: string, nodeId: DatabaseId) => void;
  multiSelect?: boolean;
  dragEnabled?: boolean;
  contextMenuEnabled?: boolean;
  maxDepth?: number;
  className?: string;
  loading?: boolean;
  empty?: {
    message?: string;
    icon?: React.ReactNode;
  };
}

/**
 * TreeNode component props
 */
export interface TreeNodeProps {
  node: TreeNode;
  contextType: 'workspace' | 'files' | 'upload';
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onExpand: () => void;
  onSelect: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  multiSelect?: boolean;
  dragEnabled?: boolean;
  contextMenuEnabled?: boolean;
  className?: string;
}

// =============================================================================
// STATE MANAGEMENT - Zustand store interface
// =============================================================================

/**
 * Tree state management interface
 */
export interface TreeState {
  // Selection state
  expandedNodes: Set<DatabaseId>;
  selectedNodes: Set<DatabaseId>;

  // Drag and drop state
  draggedItems: TreeNode[];
  dragOverNode: DatabaseId | null;
  isDragging: boolean;

  // Context menu state
  contextMenuNode: DatabaseId | null;
  contextMenuPosition: { x: number; y: number } | null;

  // Loading state
  loadingNodes: Set<DatabaseId>;

  // Actions
  toggleNode: (nodeId: DatabaseId) => void;
  expandNode: (nodeId: DatabaseId) => void;
  collapseNode: (nodeId: DatabaseId) => void;
  selectNode: (nodeId: DatabaseId, multiSelect?: boolean) => void;
  clearSelection: () => void;

  // Drag actions
  setDraggedItems: (items: TreeNode[]) => void;
  setDragOverNode: (nodeId: DatabaseId | null) => void;
  setIsDragging: (isDragging: boolean) => void;

  // Context menu actions
  showContextMenu: (
    nodeId: DatabaseId,
    position: { x: number; y: number }
  ) => void;
  hideContextMenu: () => void;

  // Loading actions
  setNodeLoading: (nodeId: DatabaseId, loading: boolean) => void;

  // State management
  reset: () => void;
}

// =============================================================================
// TREE ACTIONS - Action types for tree operations
// =============================================================================

/**
 * Tree action types
 */
export type TreeActionType =
  | 'create-folder'
  | 'rename'
  | 'delete'
  | 'move'
  | 'copy'
  | 'download'
  | 'upload'
  | 'share'
  | 'send-to-workspace';

/**
 * Tree action definition
 */
export interface TreeAction {
  type: TreeActionType;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  handler: (nodeId: DatabaseId) => void | Promise<void>;
}

// =============================================================================
// CONTEXT MENU TYPES - Context-specific menu configurations
// =============================================================================

/**
 * Context menu configuration
 */
export interface ContextMenuConfig {
  contextType: 'workspace' | 'files' | 'upload';
  nodeType: 'file' | 'folder' | 'link';
  actions: TreeAction[];
  separators?: number[]; // Indices where separators should appear
}

/**
 * Context menu item props
 */
export interface ContextMenuItemProps {
  action: TreeAction;
  nodeId: DatabaseId;
  onClose: () => void;
}

// =============================================================================
// TREE UTILITIES - Helper types and functions
// =============================================================================

/**
 * Tree node finder result
 */
export interface TreeNodeFinder {
  findById: (id: DatabaseId) => TreeNode | null;
  findByPath: (path: string) => TreeNode | null;
  findParent: (nodeId: DatabaseId) => TreeNode | null;
  findChildren: (nodeId: DatabaseId) => TreeNode[];
  findSiblings: (nodeId: DatabaseId) => TreeNode[];
}

/**
 * Tree flattener result
 */
export interface FlattenedTreeNode extends TreeNode {
  depth: number;
  hasChildren: boolean;
  isLastChild: boolean;
  indexPath: number[];
}

/**
 * Tree filter function
 */
export type TreeFilterFunction = (node: TreeNode) => boolean;

/**
 * Tree sort function
 */
export type TreeSortFunction = (a: TreeNode, b: TreeNode) => number;

// =============================================================================
// TREE BUILDER - Functions to build tree from different data sources
// =============================================================================

/**
 * Tree builder options
 */
export interface TreeBuilderOptions {
  sortFunction?: TreeSortFunction;
  filterFunction?: TreeFilterFunction;
  maxDepth?: number;
  includeEmpty?: boolean;
}

/**
 * Tree builder functions
 */
export interface TreeBuilder {
  fromWorkspace: (
    workspaceId: DatabaseId,
    options?: TreeBuilderOptions
  ) => Promise<TreeNode[]>;
  fromLinks: (
    linkIds: DatabaseId[],
    options?: TreeBuilderOptions
  ) => Promise<TreeNode[]>;
  fromUpload: (
    uploadData: UploadFile[],
    options?: TreeBuilderOptions
  ) => Promise<TreeNode[]>;
  fromFiles: (
    files: File[],
    folders: Folder[],
    options?: TreeBuilderOptions
  ) => TreeNode[];
  fromFolders: (folders: Folder[], options?: TreeBuilderOptions) => TreeNode[];
}

// =============================================================================
// TREE EVENTS - Event types for tree interactions
// =============================================================================

/**
 * Tree event types
 */
export interface TreeEvents {
  onNodeClick: (node: TreeNode, event: React.MouseEvent) => void;
  onNodeDoubleClick: (node: TreeNode, event: React.MouseEvent) => void;
  onNodeExpand: (node: TreeNode) => void;
  onNodeCollapse: (node: TreeNode) => void;
  onNodeSelect: (node: TreeNode, isMultiSelect: boolean) => void;
  onNodeDeselect: (node: TreeNode) => void;
  onNodeDragStart: (node: TreeNode, event: React.DragEvent) => void;
  onNodeDragOver: (node: TreeNode, event: React.DragEvent) => void;
  onNodeDrop: (
    targetNode: TreeNode,
    draggedNodes: TreeNode[],
    event: React.DragEvent
  ) => void;
  onNodeContextMenu: (node: TreeNode, event: React.MouseEvent) => void;
}

// =============================================================================
// TREE KEYBOARD NAVIGATION - Keyboard navigation types
// =============================================================================

/**
 * Keyboard navigation state
 */
export interface KeyboardNavState {
  focusedNode: DatabaseId | null;
  navigationMode: 'normal' | 'search' | 'select';
}

/**
 * Keyboard navigation handlers
 */
export interface KeyboardNavHandlers {
  handleArrowUp: () => void;
  handleArrowDown: () => void;
  handleArrowLeft: () => void;
  handleArrowRight: () => void;
  handleEnter: () => void;
  handleSpace: () => void;
  handleEscape: () => void;
  handleHome: () => void;
  handleEnd: () => void;
  handleSearch: (query: string) => void;
}

// =============================================================================
// TYPE EXPORTS - Re-export commonly used types
// =============================================================================

export type {
  DatabaseId,
  File,
  Folder,
  Link,
  UploadFile,
} from '@/lib/supabase/types';
