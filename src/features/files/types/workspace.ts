// =============================================================================
// WORKSPACE TYPES - Files Feature Workspace-Related Types
// =============================================================================
// 🎯 Database-first: All types derive from database schema types
// 📦 Handles read-only workspace view and file organization display

import type { Workspace } from '@/lib/database/types/workspaces';
import type { Folder } from '@/lib/database/types/folders';
import type { File } from '@/lib/database/types/files';
import type { DatabaseId } from '@/lib/database/types/common';

// =============================================================================
// WORKSPACE VIEW DATA
// =============================================================================

/**
 * Workspace data for read-only view in files feature
 * Minimal subset needed for display purposes
 */
export interface WorkspaceViewData {
  workspace: Pick<Workspace, 'id' | 'name' | 'userId'>;
  folders: WorkspaceFolderItem[];
  files: WorkspaceFileItem[];
}

/**
 * Folder item for workspace tree display
 */
export interface WorkspaceFolderItem {
  id: DatabaseId;
  name: string;
  parentFolderId: DatabaseId | null;
  path: string;
  fileCount?: number;
  totalSize?: number;
}

/**
 * File item for workspace tree display
 */
export interface WorkspaceFileItem {
  id: DatabaseId;
  fileName: string;
  fileSize: number;
  folderId: DatabaseId | null;
  mimeType: string;
  extension?: string | null;
  thumbnailPath?: string | null;
}

// =============================================================================
// WORKSPACE COMPONENT PROPS
// =============================================================================

/**
 * Props for WorkspacePanel component
 */
export interface WorkspacePanelProps {
  isReadOnly: boolean;
  onFileDrop?: (files: globalThis.File[], targetFolderId?: DatabaseId) => void;
}

/**
 * Props for workspace tree component
 */
export interface WorkspaceTreeProps {
  data: WorkspaceViewData;
  isReadOnly: boolean;
  onItemSelect?: (itemId: DatabaseId, itemType: 'file' | 'folder') => void;
  onDrop?: (files: File[], targetFolderId: DatabaseId) => void;
}

// =============================================================================
// WORKSPACE DRAG & DROP
// =============================================================================

/**
 * Drop zone configuration for workspace
 */
export interface WorkspaceDropZone {
  folderId: DatabaseId;
  isActive: boolean;
  isHovering: boolean;
  canAcceptDrop: boolean;
}

/**
 * Drag item from workspace
 */
export interface WorkspaceDragItem {
  id: DatabaseId;
  type: 'file' | 'folder';
  name: string;
  parentId: DatabaseId | null;
}

// =============================================================================
// WORKSPACE STATE
// =============================================================================

/**
 * Workspace panel state
 */
export interface WorkspacePanelState {
  expandedFolders: Set<DatabaseId>;
  selectedItems: Set<DatabaseId>;
  searchQuery: string;
  viewMode: 'tree' | 'grid' | 'list';
}

/**
 * Workspace filter options
 */
export interface WorkspaceFilterOptions {
  fileType?: string;
  folderId?: DatabaseId;
  searchQuery?: string;
  showOnlyOrganized?: boolean;
}