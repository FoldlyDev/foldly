// =============================================================================
// FILES FEATURE TYPES - Central Export Hub
// =============================================================================
// 🎯 Database-first approach with separation of concerns
// 📦 Organized into distinct type modules for maintainability

// =============================================================================
// LINKS TYPES - Link-related operations and display
// =============================================================================
export * from './links';

// =============================================================================
// WORKSPACE TYPES - Workspace view and file organization
// =============================================================================
export * from './workspace';

// =============================================================================
// FILE OPERATIONS TYPES - File operations, transfers, and actions
// =============================================================================
export * from './file-operations';

// =============================================================================
// RE-EXPORT DATABASE TYPES - For convenience and single import point
// =============================================================================

// Links database types
export type { 
  Link, 
  LinkListItem, 
  LinkWithFiles,
  LinkWithStats,
} from '@/lib/database/types/links';

// Files database types
export type { 
  File, 
  FileListItem,
  FileWithLink,
  FileWithBatch,
} from '@/lib/database/types/files';

// Workspace and folder database types
export type { Workspace } from '@/lib/database/types/workspaces';
export type { Folder } from '@/lib/database/types/folders';

// Common database types
export type { DatabaseId } from '@/lib/database/types/common';

// Enum types
export type { 
  LinkType, 
  FileProcessingStatus,
} from '@/lib/database/types/enums';