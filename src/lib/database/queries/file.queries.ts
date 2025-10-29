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
 */
export async function getFileById(fileId: string) {
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
 */
export async function getFolderFiles(folderId: string) {
  return await db.query.files.findMany({
    where: eq(files.parentFolderId, folderId),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
  });
}

/**
 * Get all files in a workspace (cross-folder)
 * Used for dashboard "Files" view
 */
export async function getWorkspaceFiles(workspaceId: string) {
  return await db.query.files.findMany({
    where: eq(files.workspaceId, workspaceId),
    orderBy: (files, { desc }) => [desc(files.uploadedAt)],
  });
}

/**
 * Get files uploaded by specific email (cross-folder)
 * Used for dashboard "By Email" view
 */
export async function getFilesByEmail(workspaceId: string, uploaderEmail: string) {
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
 */
export async function getFilesByDateRange(
  workspaceId: string,
  startDate: Date,
  endDate?: Date
) {
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
 */
export async function searchFiles(workspaceId: string, query: string) {
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
 * Delete a single file
 * Storage deletion must be handled separately by server action
 */
export async function deleteFile(fileId: string): Promise<void> {
  await db.delete(files).where(eq(files.id, fileId));
}

/**
 * Bulk delete multiple files
 * Used for multi-select deletion in UI
 * Storage deletion must be handled separately by server action
 */
export async function bulkDeleteFiles(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;

  await db.delete(files).where(inArray(files.id, fileIds));
}
