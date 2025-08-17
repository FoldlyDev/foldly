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