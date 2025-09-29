// =============================================================================
// FILE OPERATIONS TYPES - Files Feature Operations and Actions
// =============================================================================
// 🎯 Database-first: All types derive from database schema types
// 📦 Handles file operations, transfers, and server actions

import type {
  File,
  FileListItem,
  FileWithLink,
} from '@/lib/database/types/files';
import type { DatabaseId } from '@/lib/database/types/common';
import type { FileProcessingStatus } from '@/lib/database/types/enums';

// Re-export for convenience
export type { FileListItem } from '@/lib/database/types/files';

// =============================================================================
// SERVER ACTION RESULTS
// =============================================================================

/**
 * Standard action result type for all server actions
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    itemId: DatabaseId;
    error: string;
  }>;
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  linkId?: DatabaseId;
  workspaceId?: DatabaseId;
  folderId?: DatabaseId;
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

/**
 * File move operation
 */
export interface FileMoveOperation {
  fileIds: DatabaseId[];
  sourceFolderId: DatabaseId | null;
  targetFolderId: DatabaseId;
  targetWorkspaceId?: DatabaseId;
  targetLinkId?: DatabaseId;
}

/**
 * File copy operation
 */
export interface FileCopyOperation {
  fileIds: DatabaseId[];
  targetFolderId: DatabaseId;
  targetWorkspaceId?: DatabaseId;
  targetLinkId?: DatabaseId;
  duplicateHandling: 'rename' | 'replace' | 'skip';
}

/**
 * File delete operation
 */
export interface FileDeleteOperation {
  fileIds: DatabaseId[];
  permanent?: boolean;
}

// =============================================================================
// DRAG & DROP OPERATIONS
// =============================================================================

/**
 * Data transferred during drag operations
 */
export interface DragTransferData {
  type: 'link' | 'files' | 'folder';
  linkId?: DatabaseId;
  fileIds?: DatabaseId[];
  folderId?: DatabaseId;
  sourceContext: 'links' | 'workspace';
}

/**
 * Drop target information
 */
export interface DropTarget {
  type: 'folder' | 'workspace' | 'link';
  id: DatabaseId;
  canAccept: boolean;
  isHovering: boolean;
}

/**
 * Drag operation state
 */
export interface DragOperationState {
  isDragging: boolean;
  draggedItem: DragTransferData | null;
  dropTarget: DropTarget | null;
  validDropTargets: DatabaseId[];
}

// =============================================================================
// FILE DISPLAY & LIST
// =============================================================================

/**
 * File item for display in files list
 * Directly uses database FileListItem type
 */
export type FilePanelItem = FileListItem;

/**
 * Files list configuration
 */
export interface FilesListConfig {
  viewMode: 'grid' | 'list' | 'table';
  sortBy: FilesSortField;
  sortOrder: 'asc' | 'desc';
  showThumbnails: boolean;
  showMetadata: boolean;
  groupBy?: 'date' | 'type' | 'folder';
}

/**
 * File sort field options
 */
export type FilesSortField = 
  | 'fileName' 
  | 'fileSize' 
  | 'uploadedAt' 
  | 'lastAccessedAt' 
  | 'downloadCount';

// =============================================================================
// FILE FILTERS
// =============================================================================

/**
 * Filter options for files list
 */
export interface FilesFilterOptions {
  linkId?: DatabaseId;
  folderId?: DatabaseId;
  fileType?: string | string[];
  processingStatus?: FileProcessingStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  isOrganized?: boolean;
  needsReview?: boolean;
}

// =============================================================================
// FILE COMPONENT PROPS
// =============================================================================

/**
 * Props for FilesList component
 */
export interface FilesListProps {
  linkId?: DatabaseId;
  files: FilePanelItem[];
  config?: FilesListConfig;
  filters?: FilesFilterOptions;
  onFileSelect?: (fileId: DatabaseId) => void;
  onFileDelete?: (fileId: DatabaseId) => void;
  onFilesMove?: (operation: FileMoveOperation) => void;
  onFilesCopy?: (operation: FileCopyOperation) => void;
}

/**
 * Props for FileCard component
 */
export interface FileCardProps {
  file: FilePanelItem;
  isSelected?: boolean;
  showThumbnail?: boolean;
  showMetadata?: boolean;
  onSelect?: (fileId: DatabaseId) => void;
  onDelete?: (fileId: DatabaseId) => void;
  onDownload?: (fileId: DatabaseId) => void;
}

// =============================================================================
// FILE STATISTICS
// =============================================================================

/**
 * File statistics summary
 */
export interface FileStatsSummary {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  filesByType: Record<string, number>;
  recentUploads: number;
  organizationRate: number; // Percentage of organized files
}