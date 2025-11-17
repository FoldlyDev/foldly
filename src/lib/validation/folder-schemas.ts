// =============================================================================
// FOLDER VALIDATION SCHEMAS - Core Folder Validation
// =============================================================================
// Used by: Global folder actions (cross-module), workspace module
// Extends base schemas with folder-specific logic and validation limits

import { z } from 'zod';

// Import base schemas from global
import { uuidSchema, emailSchema, createNameSchema } from './base-schemas';

// Import constants from global
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// =============================================================================
// FIELD SCHEMAS
// =============================================================================

/**
 * Folder name schema using global builder
 * Used in: Create folder, update folder, forms
 */
export const folderNameSchema = createNameSchema({
  minLength: VALIDATION_LIMITS.FOLDER.NAME_MIN_LENGTH,
  maxLength: VALIDATION_LIMITS.FOLDER.NAME_MAX_LENGTH,
  resourceType: 'Folder name',
});

/**
 * Parent folder ID schema (nullable for root folders)
 * Used in: Create folder, move folder operations
 */
export const parentFolderIdSchema = uuidSchema.nullable();

/**
 * Link ID schema (nullable for personal folders)
 * Used in: Create folder, folder configuration
 */
export const linkIdSchema = uuidSchema.nullable();

/**
 * Uploader email schema (nullable for owner-created folders)
 * Used in: External uploader folder creation
 */
export const uploaderEmailSchema = emailSchema.nullable();

/**
 * Uploader name schema (optional metadata)
 * Used in: External uploader folder creation
 */
export const uploaderNameSchema = z
  .string()
  .max(VALIDATION_LIMITS.FOLDER.NAME_MAX_LENGTH, {
    message: `Uploader name must be less than ${VALIDATION_LIMITS.FOLDER.NAME_MAX_LENGTH} characters.`,
  })
  .nullable()
  .optional();

// =============================================================================
// ACTION INPUT SCHEMAS
// =============================================================================

/**
 * Schema for creating a new folder
 * Validates: name, optional parentFolderId, linkId, uploader info
 * Used by: createFolderAction (global)
 */
export const createFolderSchema = z.object({
  name: folderNameSchema,
  parentFolderId: parentFolderIdSchema.optional(),
  linkId: linkIdSchema.optional(),
  uploaderEmail: uploaderEmailSchema.optional(),
  uploaderName: uploaderNameSchema.optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

/**
 * Schema for updating an existing folder
 * Validates: folderId, optional name, parentFolderId (for move operations)
 * Used by: updateFolderAction (global)
 */
export const updateFolderSchema = z.object({
  folderId: uuidSchema,
  name: folderNameSchema.optional(),
  parentFolderId: parentFolderIdSchema.optional(),
});

export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

/**
 * Schema for moving a folder to a new parent
 * Validates: folderId, newParentId (nullable for moving to root)
 * Used by: moveFolderAction (global)
 */
export const moveFolderSchema = z.object({
  folderId: uuidSchema,
  newParentId: parentFolderIdSchema,
});

export type MoveFolderInput = z.infer<typeof moveFolderSchema>;

/**
 * Schema for deleting a folder
 * Validates: folderId
 * Used by: deleteFolderAction (global)
 */
export const deleteFolderSchema = z.object({
  folderId: uuidSchema,
});

export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;

/**
 * Schema for getting folders by parent
 * Validates: parent folder ID (null for root folders)
 * Used by: getFoldersByParentAction (global)
 */
export const getFoldersByParentSchema = z.object({
  parentFolderId: parentFolderIdSchema,
});

export type GetFoldersByParentInput = z.infer<typeof getFoldersByParentSchema>;

/**
 * Schema for getting folder hierarchy (breadcrumb)
 * Validates: folderId
 * Used by: getFolderHierarchyAction (global)
 */
export const getFolderHierarchySchema = z.object({
  folderId: uuidSchema,
});

export type GetFolderHierarchyInput = z.infer<typeof getFolderHierarchySchema>;

/**
 * Schema for downloading a folder as ZIP
 * Validates: folderId
 * Used by: downloadFolderAction (global)
 */
export const downloadFolderSchema = z.object({
  folderId: uuidSchema,
});

export type DownloadFolderInput = z.infer<typeof downloadFolderSchema>;
