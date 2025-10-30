// =============================================================================
// FILE DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for file operations (called by server actions)

import { db } from '@/lib/database/connection';
import { files } from '@/lib/database/schemas';
import { eq, and, or, gte, lte, ilike, inArray } from 'drizzle-orm';
import type { File, NewFile } from '@/lib/database/schemas';

/**
 * Get file by ID
 * Returns file with all relations (workspace, folder, link)
 *
 * @param fileId - The UUID of the file to retrieve
 * @returns File with relations or undefined if not found
 *
 * @example
 * ```typescript
 * const file = await getFileById('file_123');
 * if (file) {
 *   console.log(file.filename, file.fileSize, file.parentFolder);
 * }
 * ```
 */
export async function getFileById(fileId: string): Promise<File | undefined> {
  return await db.query.files.findFirst({
    where: eq(files.id, fileId),
    with: {
      workspace: true,
      parentFolder: true,
      link: true,
    },
  });
}

/**
 * Get all files in a specific folder
 *
 * @param folderId - The UUID of the parent folder
 * @returns Array of files ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * const folderFiles = await getFolderFiles('folder_123');
 * // Returns: [{ id: 'file_1', filename: 'invoice.pdf', uploadedAt: ..., ... }, ...]
 * ```
 */
export async function getFolderFiles(folderId: string): Promise<File[]> {
  return await db.query.files.findMany({
    where: eq(files.parentFolderId, folderId),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
  });
}

/**
 * Get all files in a workspace (cross-folder)
 * Used for dashboard "Files" view
 *
 * @param workspaceId - The UUID of the workspace
 * @returns Array of all workspace files ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * const allFiles = await getWorkspaceFiles('workspace_123');
 * // Returns files across all folders and orphaned files
 * ```
 */
export async function getWorkspaceFiles(workspaceId: string): Promise<File[]> {
  return await db.query.files.findMany({
    where: eq(files.workspaceId, workspaceId),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
  });
}

/**
 * Get files uploaded by specific email (cross-folder)
 * Used for dashboard "By Email" view - core feature for email-centric file collection
 *
 * @param workspaceId - The UUID of the workspace
 * @param uploaderEmail - Email address of the uploader
 * @returns Array of files with folder info ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * const clientFiles = await getFilesByEmail('workspace_123', 'john@example.com');
 * // Returns all files uploaded by john@example.com across all folders
 * clientFiles.forEach(file => {
 *   console.log(file.filename, file.parentFolder?.name);
 * });
 * ```
 */
export async function getFilesByEmail(workspaceId: string, uploaderEmail: string): Promise<File[]> {
  return await db.query.files.findMany({
    where: and(
      eq(files.workspaceId, workspaceId),
      eq(files.uploaderEmail, uploaderEmail)
    ),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
    with: {
      parentFolder: true, // Include folder info for display
    },
  });
}

/**
 * Get files within a date range
 * Used for dashboard "By Date" view and analytics
 *
 * @param workspaceId - The UUID of the workspace
 * @param startDate - Start of date range (inclusive)
 * @param endDate - Optional end of date range (inclusive). If omitted, returns all files from startDate onwards
 * @returns Array of files ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * // Get files from last week
 * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const recentFiles = await getFilesByDateRange('workspace_123', lastWeek);
 *
 * // Get files from specific month
 * const monthStart = new Date('2024-01-01');
 * const monthEnd = new Date('2024-01-31');
 * const januaryFiles = await getFilesByDateRange('workspace_123', monthStart, monthEnd);
 * ```
 */
export async function getFilesByDateRange(
  workspaceId: string,
  startDate: Date,
  endDate?: Date
): Promise<File[]> {
  const conditions = [eq(files.workspaceId, workspaceId), gte(files.uploadedAt, startDate)];

  if (endDate) {
    conditions.push(lte(files.uploadedAt, endDate));
  }

  return await db.query.files.findMany({
    where: and(...conditions),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
  });
}

/**
 * Search files by filename or uploader email
 * Case-insensitive search across workspace
 *
 * @param workspaceId - The UUID of the workspace
 * @param query - Search query string (searches filename and uploader email)
 * @returns Array of matching files with folder info ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * // Search for invoice files
 * const invoices = await searchFiles('workspace_123', 'invoice');
 * // Matches: 'invoice.pdf', 'Invoice_2024.docx', 'john@invoicing.com', etc.
 *
 * // Search by uploader domain
 * const clientFiles = await searchFiles('workspace_123', '@example.com');
 * // Returns all files from users with @example.com email addresses
 * ```
 */
export async function searchFiles(workspaceId: string, query: string): Promise<File[]> {
  const searchPattern = `%${query}%`;

  return await db.query.files.findMany({
    where: and(
      eq(files.workspaceId, workspaceId),
      or(
        ilike(files.filename, searchPattern),
        ilike(files.uploaderEmail, searchPattern)
      )
    ),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
    with: {
      parentFolder: true, // Include folder context for results
    },
  });
}

/**
 * Create a new file record
 * Called after successful file upload to storage
 *
 * @param data - File record creation data
 * @param data.workspaceId - The UUID of the workspace
 * @param data.filename - Original filename
 * @param data.fileSize - File size in bytes
 * @param data.mimeType - File MIME type (e.g., 'application/pdf', 'image/jpeg')
 * @param data.storagePath - Storage path/key (e.g., 'workspace123/folder456/file.pdf')
 * @param data.parentFolderId - Optional parent folder UUID (null for orphaned files)
 * @param data.linkId - Optional link UUID (if uploaded via shareable link)
 * @param data.uploaderEmail - Optional uploader email address
 * @param data.uploaderName - Optional uploader name
 * @param data.uploaderMessage - Optional message from uploader
 * @returns Created file object with generated ID and timestamps
 * @throws Error if database insert fails
 *
 * @example
 * ```typescript
 * const file = await createFile({
 *   workspaceId: 'workspace_123',
 *   filename: 'invoice-2024.pdf',
 *   fileSize: 1048576, // 1MB
 *   mimeType: 'application/pdf',
 *   storagePath: 'workspace123/folder456/invoice-2024.pdf',
 *   parentFolderId: 'folder_456',
 *   uploaderEmail: 'john@example.com',
 * });
 * // Returns: { id: 'file_789', filename: 'invoice-2024.pdf', uploadedAt: ..., ... }
 * ```
 */
export async function createFile(data: {
  workspaceId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  parentFolderId?: string | null;
  linkId?: string | null;
  uploaderEmail?: string | null;
  uploaderName?: string | null;
  uploaderMessage?: string | null;
}): Promise<File> {
  const [file] = await db
    .insert(files)
    .values({
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      filename: data.filename,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      storagePath: data.storagePath,
      parentFolderId: data.parentFolderId ?? null,
      linkId: data.linkId ?? null,
      uploaderEmail: data.uploaderEmail ?? null,
      uploaderName: data.uploaderName ?? null,
      uploaderMessage: data.uploaderMessage ?? null,
    })
    .returning();

  if (!file) {
    throw new Error('Failed to create file: Database insert returned no rows');
  }

  return file;
}

/**
 * Update file metadata
 * Can update filename or other metadata fields
 *
 * @param fileId - The UUID of the file to update
 * @param data - Partial file metadata to update
 * @param data.filename - Optional new filename
 * @param data.uploaderName - Optional new uploader name
 * @param data.uploaderMessage - Optional new uploader message
 * @returns Updated file object
 * @throws Error if file not found or update fails
 *
 * @example
 * ```typescript
 * // Rename file
 * const renamed = await updateFileMetadata('file_123', {
 *   filename: 'invoice-final.pdf'
 * });
 *
 * // Update uploader information
 * const updated = await updateFileMetadata('file_123', {
 *   uploaderName: 'John Smith',
 *   uploaderMessage: 'Updated tax documents'
 * });
 * ```
 */
export async function updateFileMetadata(
  fileId: string,
  data: {
    filename?: string;
    uploaderName?: string | null;
    uploaderMessage?: string | null;
  }
): Promise<File> {
  const [file] = await db
    .update(files)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(files.id, fileId))
    .returning();

  if (!file) {
    throw new Error(`Failed to update file: File with ID ${fileId} not found or update failed`);
  }

  return file;
}

/**
 * Delete a single file record from database
 * WARNING: Storage deletion must be handled separately by server action
 * IMPORTANT: Delete storage FIRST, then DB record (users pay for storage)
 *
 * @param fileId - The UUID of the file to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * // In server action: Storage-first deletion (prevent charging for orphaned files)
 * await deleteFileFromStorage({ gcsPath: file.storagePath, bucket: 'uploads' });
 * await deleteFile('file_123'); // Then delete DB record
 *
 * // This pattern ensures users never pay for storage they can't access
 * ```
 */
export async function deleteFile(fileId: string): Promise<void> {
  await db.delete(files).where(eq(files.id, fileId));
}

/**
 * Bulk delete multiple file records from database
 * Used for multi-select deletion in UI
 * WARNING: Storage deletion must be handled separately by server action
 * IMPORTANT: Delete storage FIRST, then DB records (users pay for storage)
 *
 * @param fileIds - Array of file UUIDs to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * // In server action: Storage-first deletion (prevent charging for orphaned files)
 * const storageResults = await Promise.all(
 *   files.map(async (file) => {
 *     try {
 *       await deleteFileFromStorage({ gcsPath: file.storagePath, bucket: 'uploads' });
 *       return { success: true, fileId: file.id };
 *     } catch {
 *       return { success: false, fileId: file.id };
 *     }
 *   })
 * );
 *
 * // Only delete DB records for successfully deleted storage files
 * const successfulIds = storageResults.filter(r => r.success).map(r => r.fileId);
 * await bulkDeleteFiles(successfulIds);
 *
 * // This ensures users never pay for orphaned storage files
 * ```
 */
export async function bulkDeleteFiles(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;

  await db.delete(files).where(inArray(files.id, fileIds));
}
