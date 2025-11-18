// =============================================================================
// FILE-FOLDER VALIDATION SCHEMAS - Mixed Operations Validation
// =============================================================================
// Used by: Global file-folder actions (mixed file/folder operations)
// Validates operations that work with both files and folders together

import { z } from 'zod';

// Import base schemas from global
import { uuidSchema } from './base-schemas';

// Import file folder ID schema for target folder validation
import { fileFolderIdSchema } from './file-schemas';

// =============================================================================
// BULK DOWNLOAD MIXED VALIDATION
// =============================================================================

/**
 * Schema for bulk downloading files and folders (mixed selection)
 * Validates: arrays of fileIds and folderIds (max 100 items total)
 * Used by: bulkDownloadMixedAction (global)
 *
 * ZIP Structure:
 * - Selected files appear at root level
 * - Selected folders appear with full hierarchy preserved
 */
export const bulkDownloadMixedSchema = z.object({
  fileIds: z.array(uuidSchema).default([]),
  folderIds: z.array(uuidSchema).default([]),
}).refine(
  (data) => data.fileIds.length + data.folderIds.length > 0,
  { message: 'At least one file or folder ID is required for download.' }
).refine(
  (data) => data.fileIds.length + data.folderIds.length <= 100,
  { message: 'Cannot download more than 100 items at once.' }
);

export type BulkDownloadMixedInput = z.infer<typeof bulkDownloadMixedSchema>;

// =============================================================================
// BULK MOVE MIXED VALIDATION
// =============================================================================

/**
 * Schema for bulk moving files and folders (mixed selection)
 * Validates: arrays of fileIds and folderIds, target folder ID
 * Used by: moveMixedAction (global)
 *
 * Edge Cases Handled:
 * - Circular references (folder cannot be moved into itself or descendant)
 * - Name conflicts in destination
 * - Permission verification for all items
 */
export const moveMixedSchema = z.object({
  fileIds: z.array(uuidSchema).default([]),
  folderIds: z.array(uuidSchema).default([]),
  targetFolderId: fileFolderIdSchema, // null to move to root
}).refine(
  (data) => data.fileIds.length + data.folderIds.length > 0,
  { message: 'At least one file or folder ID is required for move operation.' }
).refine(
  (data) => data.fileIds.length + data.folderIds.length <= 100,
  { message: 'Cannot move more than 100 items at once.' }
);

export type MoveMixedInput = z.infer<typeof moveMixedSchema>;

// =============================================================================
// BULK DELETE MIXED VALIDATION
// =============================================================================

/**
 * Schema for bulk deleting files and folders (mixed selection)
 * Validates: arrays of fileIds and folderIds (max 100 items total)
 * Used by: deleteMixedAction (global)
 *
 * Deletion Patterns:
 * - Files: Storage-first deletion (billing integrity)
 * - Folders: DB deletion with CASCADE (no storage representation)
 * - Partial success: Delete what succeeds, report what fails
 */
export const deleteMixedSchema = z.object({
  fileIds: z.array(uuidSchema).default([]),
  folderIds: z.array(uuidSchema).default([]),
}).refine(
  (data) => data.fileIds.length + data.folderIds.length > 0,
  { message: 'At least one file or folder ID is required for deletion.' }
).refine(
  (data) => data.fileIds.length + data.folderIds.length <= 100,
  { message: 'Cannot delete more than 100 items at once.' }
);

export type DeleteMixedInput = z.infer<typeof deleteMixedSchema>;
