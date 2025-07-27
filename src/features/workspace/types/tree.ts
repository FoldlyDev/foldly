// =============================================================================
// WORKSPACE TREE TYPES - Types for workspace tree implementation
// =============================================================================

import type { DatabaseId } from '@/lib/database/types/common';
import type { File } from '@/lib/database/types/files';
import type { Folder } from '@/lib/database/types/folders';

// =============================================================================
// TREE ITEM TYPES
// =============================================================================

export interface WorkspaceTreeItem {
  id: DatabaseId;
  name: string;
  type: 'file' | 'folder';
  parentId: DatabaseId | null;
  children?: string[];
  data: File | Folder;
  depth: number;
  sortOrder: number;
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface WorkspaceTreeFile extends WorkspaceTreeItem {
  type: 'file';
  data: File;
  fileSize: number;
  mimeType: string;
  extension: string;
  uploadedAt: Date;
}

export interface WorkspaceTreeFolder extends WorkspaceTreeItem {
  type: 'folder';
  data: Folder;
  children: string[];
  fileCount: number;
  totalSize: number;
  path: string;
}

// =============================================================================
// TREE STATE TYPES
// =============================================================================

export interface WorkspaceTreeState {
  items: Record<string, WorkspaceTreeItem>;
  rootItems: string[];
  expandedItems: Set<string>;
  selectedItems: Set<string>;
  draggedItem: string | null;
  dragTarget: string | null;
  isDragging: boolean;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// TREE ACTION TYPES
// =============================================================================

export interface WorkspaceTreeActions {
  loadTree: () => Promise<void>;
  expandItem: (itemId: string) => void;
  collapseItem: (itemId: string) => void;
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  clearSelection: () => void;
  moveItem: (itemId: string, targetId: string | null) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameItem: (itemId: string, newName: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  uploadFile: (file: File, parentId?: string) => Promise<void>;
}

// =============================================================================
// TREE CONTEXT TYPES
// =============================================================================

export interface WorkspaceTreeContextValue {
  state: WorkspaceTreeState;
  actions: WorkspaceTreeActions;
}

// =============================================================================
// TREE PROPS TYPES
// =============================================================================

export interface WorkspaceTreeProps {
  className?: string;
  onItemSelect?: (item: WorkspaceTreeItem) => void;
  onItemDoubleClick?: (item: WorkspaceTreeItem) => void;
  onItemRename?: (item: WorkspaceTreeItem, newName: string) => void;
  onItemDelete?: (item: WorkspaceTreeItem) => void;
  onItemMove?: (item: WorkspaceTreeItem, targetId: string | null) => void;
  onFolderCreate?: (name: string, parentId?: string) => void;
  onFileUpload?: (file: File, parentId?: string) => void;
  enableDragAndDrop?: boolean;
  enableContextMenu?: boolean;
  enableKeyboardNavigation?: boolean;
  maxDepth?: number;
  showFileExtensions?: boolean;
  showFileSizes?: boolean;
  showFileIcons?: boolean;
  showFolderIcons?: boolean;
}

// =============================================================================
// TREE DRAG AND DROP TYPES
// =============================================================================

export interface TreeDragData {
  itemId: string;
  itemType: 'file' | 'folder';
  sourceParentId: string | null;
}

export interface TreeDropData {
  targetId: string | null;
  targetType: 'folder' | 'root';
  dropPosition: 'before' | 'after' | 'inside';
}

// =============================================================================
// TREE CONTEXT MENU TYPES
// =============================================================================

export interface TreeContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface TreeContextMenuData {
  item: WorkspaceTreeItem;
  position: { x: number; y: number };
  items: TreeContextMenuItem[];
}

// =============================================================================
// TREE UTILITY TYPES
// =============================================================================

export type TreeItemId = string;
export type TreeItemPath = string[];
export type TreeExpandState = Record<string, boolean>;
export type TreeSelectState = Record<string, boolean>;
