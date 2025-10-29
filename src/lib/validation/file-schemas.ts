// =============================================================================
// FILE VALIDATION SCHEMAS - Core File Validation
// =============================================================================
// Used by: Global file actions (cross-module), workspace module, uploads module
// Extends base schemas with file-specific logic and validation limits

import { z } from 'zod';

// Import base schemas from global
import { uuidSchema, emailSchema } from './base-schemas';

// Import constants from global
import { VALIDATION_LIMITS, ALLOWED_FILE_TYPES } from '@/lib/constants/validation';

// =============================================================================
// FIELD SCHEMAS
// =============================================================================

/**
 * Filename schema with length validation
 * Used in: File upload, file rename operations
 */
export const filenameSchema = z
  .string()
  .min(1, { message: 'Filename is required.' })
  .max(VALIDATION_LIMITS.FILE.NAME_MAX_LENGTH, {
    message: `Filename must be less than ${VALIDATION_LIMITS.FILE.NAME_MAX_LENGTH} characters.`,
  })
  .trim();

/**
 * File size schema with byte limit
 * Used in: File upload validation
 */
export const fileSizeSchema = z
  .number()
  .positive({ message: 'File size must be greater than 0.' })
  .max(VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES, {
    message: `File size must be less than ${VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES / (1024 * 1024)}MB.`,
  });

/**
 * MIME type schema
 * Used in: File upload validation
 */
export const mimeTypeSchema = z.string().min(1, { message: 'MIME type is required.' });

/**
 * Storage path schema
 * Used in: File record creation after upload
 */
export const storagePathSchema = z.string().min(1, { message: 'Storage path is required.' });

/**
 * Parent folder ID schema (nullable for root files)
 * Used in: File upload, file organization
 */
export const fileFolderIdSchema = uuidSchema.nullable();

/**
 * Link ID schema (nullable for personal files)
 * Used in: File upload through shareable links
 */
export const fileLinkIdSchema = uuidSchema.nullable();

/**
 * Uploader email schema (nullable for owner-uploaded files)
 * Used in: External uploader file uploads
 */
export const fileUploaderEmailSchema = emailSchema.nullable();

/**
 * Uploader name schema (optional metadata)
 * Used in: External uploader file uploads
 */
export const fileUploaderNameSchema = z
  .string()
  .max(VALIDATION_LIMITS.FILE.NAME_MAX_LENGTH, {
    message: `Uploader name must be less than ${VALIDATION_LIMITS.FILE.NAME_MAX_LENGTH} characters.`,
  })
  .nullable()
  .optional();

/**
 * Uploader message schema (optional metadata)
 * Used in: External uploader file uploads
 */
export const uploaderMessageSchema = z
  .string()
  .max(VALIDATION_LIMITS.FILE.DESCRIPTION_MAX_LENGTH, {
    message: `Message must be less than ${VALIDATION_LIMITS.FILE.DESCRIPTION_MAX_LENGTH} characters.`,
  })
  .nullable()
  .optional();

// =============================================================================
// ACTION INPUT SCHEMAS
// =============================================================================

/**
 * Schema for creating a file record
 * Validates: All required file metadata after upload
 * Used by: createFileRecordAction (global)
 */
export const createFileSchema = z.object({
  filename: filenameSchema,
  fileSize: fileSizeSchema,
  mimeType: mimeTypeSchema,
  storagePath: storagePathSchema,
  parentFolderId: fileFolderIdSchema.optional(),
  linkId: fileLinkIdSchema.optional(),
  uploaderEmail: fileUploaderEmailSchema.optional(),
  uploaderName: fileUploaderNameSchema.optional(),
  uploaderMessage: uploaderMessageSchema.optional(),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;

/**
 * Schema for updating file metadata
 * Validates: fileId, optional filename, uploader info
 * Used by: updateFileMetadataAction (global)
 */
export const updateFileMetadataSchema = z.object({
  fileId: uuidSchema,
  filename: filenameSchema.optional(),
  uploaderName: fileUploaderNameSchema.optional(),
  uploaderMessage: uploaderMessageSchema.optional(),
});

export type UpdateFileMetadataInput = z.infer<typeof updateFileMetadataSchema>;

/**
 * Schema for deleting a file
 * Validates: fileId
 * Used by: deleteFileAction (global)
 */
export const deleteFileSchema = z.object({
  fileId: uuidSchema,
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;

/**
 * Schema for bulk deleting files
 * Validates: array of fileIds
 * Used by: bulkDeleteFilesAction (global)
 */
export const bulkDeleteFilesSchema = z.object({
  fileIds: z.array(uuidSchema).min(1, { message: 'At least one file ID is required.' }),
});

export type BulkDeleteFilesInput = z.infer<typeof bulkDeleteFilesSchema>;

/**
 * Schema for searching files
 * Validates: search query string
 * Used by: searchFilesAction (global)
 */
export const searchFilesSchema = z.object({
  query: z.string().min(1, { message: 'Search query is required.' }).trim(),
});

export type SearchFilesInput = z.infer<typeof searchFilesSchema>;

/**
 * Schema for filtering files by email
 * Validates: uploader email address
 * Used by: getFilesByEmailAction (global)
 */
export const getFilesByEmailSchema = z.object({
  uploaderEmail: emailSchema,
});

export type GetFilesByEmailInput = z.infer<typeof getFilesByEmailSchema>;
