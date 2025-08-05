// =============================================================================
// FOLDER TYPES - Database Folder Entity and Related Types
// =============================================================================
// 🎯 Based on folders table in drizzle/schema.ts

import type {
  DatabaseId,
  TimestampFields,
  WithoutSystemFields,
  PartialBy,
} from './common';

// =============================================================================
// BASE FOLDER TYPES - Direct from database schema
// =============================================================================

/**
 * Folder entity - exact match to database schema
 */
export interface Folder extends TimestampFields {
  id: DatabaseId;
  userId: DatabaseId;
  workspaceId: DatabaseId;
  parentFolderId: DatabaseId | null;
  linkId: DatabaseId | null;

  // Folder information
  name: string;
  path: string;
  depth: number;

  // Organization
  isArchived: boolean;
  sortOrder: number;

  // Statistics
  fileCount: number;
  totalSize: number;
}

/**
 * Folder insert type - for creating new folders
 */
export type FolderInsert = WithoutSystemFields<Folder>;

/**
 * Folder update type - for updating existing folders
 */
export type FolderUpdate = PartialBy<
  Omit<Folder, 'id' | 'userId' | 'workspaceId' | 'createdAt' | 'updatedAt'>,
  | 'parentFolderId'
  | 'linkId'
  | 'path'
  | 'depth'
  | 'isArchived'
  | 'sortOrder'
  | 'fileCount'
  | 'totalSize'
>;

// =============================================================================
// COMPUTED FOLDER TYPES - With calculated fields and relationships
// =============================================================================

/**
 * Folder with contents - includes files and subfolders
 */
export interface FolderWithContents extends Folder {
  files: Array<{
    id: DatabaseId;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  }>;
  subfolders: Array<{
    id: DatabaseId;
    name: string;
    fileCount: number;
    totalSize: number;
    depth: number;
  }>;
}

/**
 * Folder tree node - for hierarchical display
 */
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  parent: FolderTreeNode | null;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

/**
 * Folder with ancestry - includes parent chain
 */
export interface FolderWithAncestry extends Folder {
  ancestors: Array<{
    id: DatabaseId;
    name: string;
    depth: number;
  }>;
  breadcrumbs: Array<{
    id: DatabaseId;
    name: string;
    path: string;
  }>;
}

/**
 * Folder with statistics - includes detailed stats
 */
export interface FolderWithStats extends Folder {
  stats: {
    directFiles: number;
    directSize: number;
    totalFiles: number;
    totalSize: number;
    subfolderCount: number;
    maxDepth: number;
    lastActivity: Date | null;
  };
}

// =============================================================================
// FOLDER UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * Folder for listing - condensed info for lists
 */
export interface FolderListItem {
  id: DatabaseId;
  name: string;
  path: string;
  depth: number;
  fileCount: number;
  totalSize: number;
  isArchived: boolean;
  parentFolderId: DatabaseId | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Folder for navigation - info needed for navigation
 */
export interface FolderNavItem {
  id: DatabaseId;
  name: string;
  path: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isActive: boolean;
}

/**
 * Folder breadcrumb item
 */
export interface FolderBreadcrumb {
  id: DatabaseId;
  name: string;
  path: string;
  depth: number;
  isLast: boolean;
}

// =============================================================================
// FOLDER FORM TYPES - For form handling and validation
// =============================================================================

/**
 * Folder creation form data
 */
export interface FolderCreateForm {
  name: string;
  parentFolderId?: DatabaseId;
  linkId?: DatabaseId;
  sortOrder?: number;
}

/**
 * Folder update form data
 */
export interface FolderUpdateForm {
  name?: string;
  parentFolderId?: DatabaseId;
  isArchived?: boolean;
  sortOrder?: number;
}

/**
 * Folder move form data
 */
export interface FolderMoveForm {
  targetParentId: DatabaseId | null;
  sortOrder?: number;
}

// =============================================================================
// FOLDER VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * Folder validation constraints
 */
export interface FolderValidationConstraints {
  name: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    reservedWords: string[];
  };
  depth: {
    maxDepth: number;
  };
  path: {
    maxLength: number;
  };
}

/**
 * Folder field validation errors
 */
export interface FolderValidationErrors {
  name?: string[];
  parentFolderId?: string[];
  depth?: string[];
  path?: string[];
}

// =============================================================================
// FOLDER FILTER TYPES - For querying and filtering folders
// =============================================================================

/**
 * Folder filter options
 */
export interface FolderFilterOptions {
  userId?: DatabaseId;
  workspaceId?: DatabaseId;
  linkId?: DatabaseId;
  parentFolderId?: DatabaseId;
  isArchived?: boolean;
  depth?: number;
  depthRange?: { min: number; max: number };
  fileCountRange?: { min: number; max: number };
  sizeRange?: { min: number; max: number };
  createdDateRange?: { start: Date; end: Date };
  hasFiles?: boolean;
  hasSubfolders?: boolean;
}

/**
 * Folder sort options
 */
export type FolderSortField =
  | 'name'
  | 'path'
  | 'depth'
  | 'fileCount'
  | 'totalSize'
  | 'sortOrder'
  | 'createdAt'
  | 'updatedAt';

/**
 * Folder query options
 */
export interface FolderQueryOptions {
  search?: string;
  filters?: FolderFilterOptions;
  sort?: {
    field: FolderSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    files?: boolean;
    subfolders?: boolean;
    ancestors?: boolean;
    stats?: boolean;
  };
}

// =============================================================================
// FOLDER HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

/**
 * Generate folder path
 */
export const generateFolderPath = (
  parentPath: string,
  folderName: string
): string => {
  if (!parentPath || parentPath === '/') {
    return `/${folderName}`;
  }
  return `${parentPath}/${folderName}`;
};

/**
 * Parse folder path into segments
 */
export const parseFolderPath = (path: string): string[] => {
  return path.split('/').filter(segment => segment.length > 0);
};

/**
 * Check if folder is root folder
 */
export const isRootFolder = (
  folder: Pick<Folder, 'parentFolderId' | 'depth'>
): boolean => {
  return folder.parentFolderId === null && folder.depth === 0;
};

/**
 * Check if folder is empty
 */
export const isFolderEmpty = (folder: Pick<Folder, 'fileCount'>): boolean => {
  return folder.fileCount === 0;
};

/**
 * Calculate folder depth from path
 */
export const calculateDepthFromPath = (path: string): number => {
  if (path === '/' || path === '') return 0;
  return parseFolderPath(path).length;
};

/**
 * Generate breadcrumbs from path
 */
export const generateBreadcrumbs = (
  path: string
): Array<{ name: string; path: string }> => {
  const segments = parseFolderPath(path);
  const breadcrumbs: Array<{ name: string; path: string }> = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: segment,
      path: currentPath,
    });
  }

  return breadcrumbs;
};

/**
 * Check if folder name is valid
 */
export const isValidFolderName = (name: string): boolean => {
  // No special characters that would break file systems
  const invalidChars = /[<>:"/\\|?*]/;
  return (
    !invalidChars.test(name) &&
    name.length >= 1 &&
    name.length <= 255 &&
    name.trim().length > 0
  );
};

/**
 * Check if folder can be moved to target parent
 */
export const canMoveToParent = (
  folder: Pick<Folder, 'id' | 'path'>,
  targetParentPath: string,
  maxDepth: number
): boolean => {
  // Can't move to self or descendant
  if (targetParentPath.startsWith(folder.path)) {
    return false;
  }

  // Check depth limit
  const targetDepth = calculateDepthFromPath(targetParentPath) + 1;
  if (targetDepth > maxDepth) {
    return false;
  }

  return true;
};

/**
 * Format folder size to human readable format
 */
export const formatFolderSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get folder icon based on content or name
 */
export const getFolderIcon = (
  folder: Pick<Folder, 'name' | 'fileCount'>
): string => {
  const name = folder.name.toLowerCase();

  if (name.includes('image') || name.includes('photo')) return '📸';
  if (name.includes('document') || name.includes('doc')) return '📄';
  if (name.includes('video') || name.includes('movie')) return '🎬';
  if (name.includes('music') || name.includes('audio')) return '🎵';
  if (name.includes('archive') || name.includes('zip')) return '📦';
  if (folder.fileCount === 0) return '📂';

  return '📁';
};
