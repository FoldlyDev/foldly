// Files Feature Database Types - Drizzle Type Inference
// Using proper Drizzle ORM type inference with correct field names from actual schema

import { files, folders, batches } from '@/lib/database/schemas';

// =============================================================================
// DRIZZLE TYPE INFERENCE - Type-safe database operations
// =============================================================================

/**
 * File record type inferred from files table schema
 */
export type FileUpload = typeof files.$inferSelect;

/**
 * File input type for insertions inferred from files table schema
 */
export type FileUploadInput = typeof files.$inferInsert;

/**
 * Folder record type inferred from folders table schema
 */
export type Folder = typeof folders.$inferSelect;

/**
 * Folder input type for insertions inferred from folders table schema
 */
export type CreateFolderInput = typeof folders.$inferInsert;

/**
 * Batch record type inferred from batches table schema
 */
export type UploadBatch = typeof batches.$inferSelect;

/**
 * Batch input type for insertions inferred from batches table schema
 */
export type CreateUploadBatchInput = typeof batches.$inferInsert;

// =============================================================================
// UTILITY TYPES - For application layer convenience
// =============================================================================

/**
 * Partial update input for folders
 */
export type UpdateFolderInput = Partial<CreateFolderInput> & {
  readonly id: string;
};

/**
 * Folder tree structure for navigation (extends base folder type)
 */
export interface FolderTree extends Folder {
  readonly children: readonly FolderTree[];
  readonly hasChildren: boolean;
}

// =============================================================================
// LEGACY ALIASES - For backward compatibility during migration
// =============================================================================

/**
 * @deprecated Use FileUpload instead
 */
export type FileData = FileUpload;

/**
 * @deprecated Use Folder instead
 */
export type FolderData = Folder;
