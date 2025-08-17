// =============================================================================
// TREE TYPES - Shared types for file tree components
// =============================================================================

/**
 * Tree item can be either a file or folder
 */
export type TreeItemType = 'file' | 'folder';

/**
 * Base properties shared by all tree items
 */
export interface BaseTreeItem {
  id: string;
  name: string;
  type: TreeItemType;
  parentId?: string | null;
}

/**
 * File item in the tree
 */
export interface TreeFileItem extends BaseTreeItem {
  type: 'file';
  mimeType: string;
  fileSize: number;
  extension?: string | null;
  thumbnailPath?: string | null;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Folder item in the tree
 */
export interface TreeFolderItem extends BaseTreeItem {
  type: 'folder';
  children?: string[];
  path: string;
  depth: number;
  fileCount?: number;
  totalSize?: number;
  isArchived?: boolean;
}

/**
 * Union type for any tree item
 */
export type TreeItem = TreeFileItem | TreeFolderItem;

/**
 * Type guard to check if an item is a folder
 */
export function isFolder(item: TreeItem): item is TreeFolderItem {
  return item.type === 'folder';
}

/**
 * Type guard to check if an item is a file
 */
export function isFile(item: TreeItem): item is TreeFileItem {
  return item.type === 'file';
}

/**
 * Get children IDs for a tree item
 */
export function getItemChildren(item: TreeItem): string[] {
  if (isFolder(item)) {
    return item.children ?? [];
  }
  return [];
}

/**
 * Check if a tree item has children
 */
export function hasChildren(item: TreeItem): boolean {
  if (isFolder(item)) {
    return (item.children?.length ?? 0) > 0;
  }
  return false;
}

// =============================================================================
// TREE CONFIGURATION TYPES
// =============================================================================

import type { RenameHandler, DropHandler } from './handler-types';
import type { ForeignDropConfig } from '../handlers/foreign-drop';

/**
 * Configuration for tree handlers
 */
export interface TreeHandlerConfig<T extends TreeItem = TreeItem> {
  rename?: boolean | RenameHandler<T>;
  drop?: boolean | DropHandler<T>;
  foreignDrop?: boolean | ForeignDropConfig<T>;
  delete?: boolean | ((items: T[]) => void | Promise<void>);
  copy?: boolean | ((items: T[]) => void);
  paste?: boolean | ((items: T[], targetId: string) => void | Promise<void>);
  createFolder?: boolean | ((parentId: string, name: string) => void | Promise<void>);
}

/**
 * Configuration for tree features
 */
export interface TreeFeatureConfig {
  selection?: boolean;
  multiSelect?: boolean;
  checkboxes?: boolean;
  search?: boolean;
  contextMenu?: boolean;
  keyboard?: boolean;
  dragAndDrop?: boolean;
}

/**
 * Configuration for tree permissions
 */
export interface TreePermissionConfig {
  canDropInRoot?: boolean;
  canDragFolders?: boolean;
  canDragFiles?: boolean;
  canRename?: (item: TreeItem) => boolean;
  canDelete?: (item: TreeItem) => boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

/**
 * Complete tree configuration
 */
export interface TreeConfiguration<T extends TreeItem = TreeItem> {
  handlers?: TreeHandlerConfig<T>;
  features?: TreeFeatureConfig;
  permissions?: TreePermissionConfig;
}

/**
 * Props for the FileTree component
 */
export interface FileTreeProps<T extends TreeItem = TreeItem> {
  // Data
  data: Record<string, T>;
  rootId: string;
  
  // Configuration
  config?: TreeConfiguration<T>;
  
  // Optional: Initial state
  initialExpandedItems?: string[];
  initialSelectedItems?: string[];
  initialCheckedItems?: string[];
  
  // Optional: Styling
  indent?: number;
  className?: string;
  
  // Callbacks for state changes
  onExpandedItemsChange?: (items: string[]) => void;
  onSelectedItemsChange?: (items: string[]) => void;
  onCheckedItemsChange?: (items: string[]) => void;
}