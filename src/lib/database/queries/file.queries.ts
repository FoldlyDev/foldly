// =============================================================================
// FILE DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for file operations (called by server actions)

import { db, postgresClient } from '@/lib/database/connection';
import { files } from '@/lib/database/schemas';
import { eq, and, or, gte, lte, ilike, inArray, isNull } from 'drizzle-orm';
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
 * Get multiple files by IDs for a specific workspace
 * Optimized batch query to avoid N+1 queries in bulk operations
 *
 * @param fileIds - Array of file UUIDs to retrieve
 * @param workspaceId - The UUID of the workspace (for security verification)
 * @returns Array of files that exist and belong to the workspace
 *
 * @example
 * ```typescript
 * const files = await getFilesByIds(
 *   ['file_1', 'file_2', 'file_3'],
 *   'workspace_123'
 * );
 * // Returns only files that exist and belong to workspace_123
 * // If requesting 3 files but only 2 exist, returns 2 files
 * ```
 */
export async function getFilesByIds(
  fileIds: string[],
  workspaceId: string
): Promise<Array<Pick<File, 'id' | 'storagePath' | 'filename' | 'workspaceId'>>> {
  if (fileIds.length === 0) {
    return [];
  }

  return await db.query.files.findMany({
    where: and(
      inArray(files.id, fileIds),
      eq(files.workspaceId, workspaceId)
    ),
    columns: {
      id: true,
      storagePath: true,
      filename: true,
      workspaceId: true,
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
 * Get files by folder (root or specific folder)
 * Universal query for folder navigation - handles both root and nested folders
 *
 * @param workspaceId - The UUID of the workspace
 * @param parentFolderId - The UUID of the parent folder, or null for root files
 * @returns Array of files in the specified folder ordered by upload date (newest first)
 *
 * @example
 * ```typescript
 * // Get root-level files (not in any folder)
 * const rootFiles = await getFilesByFolder('workspace_123', null);
 * // Returns: Files where parentFolderId IS NULL
 *
 * // Get files in a specific folder
 * const folderFiles = await getFilesByFolder('workspace_123', 'folder_456');
 * // Returns: Files where parentFolderId = 'folder_456'
 * ```
 */
export async function getFilesByFolder(
  workspaceId: string,
  parentFolderId: string | null
): Promise<File[]> {
  return await db.query.files.findMany({
    where: and(
      eq(files.workspaceId, workspaceId),
      parentFolderId === null
        ? isNull(files.parentFolderId)
        : eq(files.parentFolderId, parentFolderId)
    ),
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
 * Uses case-insensitive substring matching (ILIKE) for intuitive user experience
 *
 * Search behavior:
 * - Searches filename, uploader_email, and uploader_name fields
 * - Case-insensitive partial matching (e.g., "screen" matches "Screenshot")
 * - Orders results by upload date (newest first)
 *
 * @param workspaceId - The UUID of the workspace
 * @param query - Search query string (searches filename, uploader_email, uploader_name)
 * @returns Array of matching files with folder info ordered by upload date
 *
 * @example
 * ```typescript
 * // Search for files with "invoice" in filename
 * const invoices = await searchFiles('workspace_123', 'invoice');
 * // Matches: 'invoice.pdf', 'Invoice_2024.docx', 'tax-invoice.xlsx', etc.
 *
 * // Search by uploader email/domain
 * const clientFiles = await searchFiles('workspace_123', '@example.com');
 * // Returns all files from users with @example.com email addresses
 *
 * // Partial filename search
 * const results = await searchFiles('workspace_123', 'screen');
 * // Matches: 'Screenshot.png', 'screencast.mp4', 'fullscreen-mode.jpg', etc.
 * ```
 */
export async function searchFiles(workspaceId: string, query: string): Promise<File[]> {
  // Use ILIKE for case-insensitive substring matching
  const searchPattern = `%${query}%`;

  const result = await postgresClient<{
    id: string;
    filename: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    workspace_id: string;
    parent_folder_id: string | null;
    link_id: string | null;
    uploader_email: string | null;
    uploader_name: string | null;
    uploader_message: string | null;
    uploaded_at: Date;
    updated_at: Date;
    folder_id: string | null;
    folder_name: string | null;
  }[]>`
    SELECT
      f.id, f.filename, f.file_size, f.mime_type, f.storage_path,
      f.workspace_id, f.parent_folder_id, f.link_id,
      f.uploader_email, f.uploader_name, f.uploader_message,
      f.uploaded_at, f.updated_at,
      folder.id as folder_id,
      folder.name as folder_name
    FROM files f
    LEFT JOIN folders folder ON f.parent_folder_id = folder.id
    WHERE
      f.workspace_id = ${workspaceId}
      AND (
        f.filename ILIKE ${searchPattern}
        OR f.uploader_email ILIKE ${searchPattern}
        OR f.uploader_name ILIKE ${searchPattern}
      )
    ORDER BY
      f.uploaded_at DESC
  `;

  // Transform snake_case database columns to camelCase TypeScript properties
  return result.map(row => ({
    id: row.id,
    filename: row.filename,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    workspaceId: row.workspace_id,
    parentFolderId: row.parent_folder_id,
    linkId: row.link_id,
    uploaderEmail: row.uploader_email,
    uploaderName: row.uploader_name,
    uploaderMessage: row.uploader_message,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    searchVector: null, // Not returned in queries (only used for searching)
    parentFolder: row.folder_id ? {
      id: row.folder_id,
      name: row.folder_name,
    } : null,
  })) as File[];
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
 * Can update filename, parentFolderId (move), or other metadata fields
 *
 * @param fileId - The UUID of the file to update
 * @param data - Partial file metadata to update
 * @param data.filename - Optional new filename
 * @param data.parentFolderId - Optional new parent folder UUID (use null to move to root)
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
 * // Move file to new folder
 * const moved = await updateFileMetadata('file_123', {
 *   parentFolderId: 'folder_456'
 * });
 *
 * // Move to root
 * const toRoot = await updateFileMetadata('file_123', {
 *   parentFolderId: null
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
    parentFolderId?: string | null;
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

/**
 * Check if a filename already exists in a specific folder
 * Used for Windows-style duplicate detection before file upload
 * Database enforces uniqueness via fileNameParentUnique index
 *
 * @param parentFolderId - The UUID of the parent folder (null for root)
 * @param filename - The filename to check (case-sensitive, with extension)
 * @returns True if filename exists in folder, false otherwise
 *
 * @example
 * ```typescript
 * // Check before upload
 * const exists = await checkFilenameExists('folder_123', 'document.pdf');
 * if (exists) {
 *   // Generate unique filename: "document (1).pdf"
 * }
 *
 * // Check in root folder
 * const existsInRoot = await checkFilenameExists(null, 'photo.jpg');
 * ```
 */
export async function checkFilenameExists(
  parentFolderId: string | null,
  filename: string
): Promise<boolean> {
  const result = await db.query.files.findFirst({
    where: parentFolderId
      ? and(eq(files.parentFolderId, parentFolderId), eq(files.filename, filename))
      : and(isNull(files.parentFolderId), eq(files.filename, filename)),
    columns: {
      id: true,
    },
  });

  return !!result;
}
