// =============================================================================
// LINKS TYPES - Files Feature Link-Related Types
// =============================================================================
// 🎯 Database-first: All types derive from database schema types
// 📦 Handles link data organization and display for the files feature

import type {
  LinkListItem,
  LinkWithFiles,
  LinkWithStats,
} from '@/lib/database/types/links';
import type { DatabaseId } from '@/lib/database/types/common';
import type { LinkType } from '@/lib/database/types/enums';

// Re-export for convenience
export type { LinkListItem } from '@/lib/database/types/links';

// =============================================================================
// LINKS DATA ORGANIZATION
// =============================================================================

/**
 * Links organized by type for the files feature UI
 * Used in the LinksPanel component to display user's links
 */
export interface FilesLinksData {
  baseLink: LinkListItem | null;
  topicLinks: LinkListItem[];
  generatedLinks: LinkListItem[];
  stats: LinksStatsSummary;
}

/**
 * Summary statistics for all user links
 */
export interface LinksStatsSummary {
  totalFiles: number;
  totalSize: number;
  totalLinks: number;
  unreadUploads: number;
}

// =============================================================================
// LINK DISPLAY TYPES
// =============================================================================

/**
 * Link item for panel display
 * Directly uses database LinkListItem type
 */
export type LinkPanelItem = LinkListItem;

/**
 * Link section configuration for accordion display
 */
export interface LinkSection {
  type: LinkType;
  title: string;
  icon: React.ReactNode;
  count?: number;
  items?: LinkSectionItem[];
}

/**
 * Individual link item in a section
 */
export interface LinkSectionItem {
  id: DatabaseId;
  name: string;
  filesCount: number;
  slug?: string;
  topic?: string | null;
}

// =============================================================================
// LINK COMPONENT PROPS
// =============================================================================

/**
 * Props for LinksPanel component
 */
export interface LinksPanelProps {
  onFileDrop?: (files: File[], targetFolderId?: DatabaseId) => void;
  onFileTransfer?: (request: FileTransferRequest) => void;
  isMobile: boolean;
}

/**
 * File transfer request from link to workspace
 */
export interface FileTransferRequest {
  fileIds: DatabaseId[];
  sourceLinkId: DatabaseId;
  targetFolderId: DatabaseId;
  targetWorkspaceId: DatabaseId;
}

// =============================================================================
// LINK FILTER & SORT
// =============================================================================

/**
 * Filter options for links display
 */
export interface LinksFilterOptions {
  linkType?: LinkType;
  isActive?: boolean;
  hasUnreadUploads?: boolean;
  searchQuery?: string;
}

/**
 * Sort options for links display
 */
export interface LinksSortOptions {
  field: 'title' | 'totalFiles' | 'lastUploadAt' | 'createdAt';
  order: 'asc' | 'desc';
}