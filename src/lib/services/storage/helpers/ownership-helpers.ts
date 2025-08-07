// =============================================================================
// OWNERSHIP HELPERS - Derive File and Folder Ownership Through Relationships
// =============================================================================
// 🎯 Helper functions to determine ownership of files and folders since userId
// has been removed from these tables in favor of relationship-based ownership

import { db } from '@/lib/database/connection';
import { files, folders, workspaces, links, batches } from '@/lib/database/schemas';
import { eq, and, or, sql, sum } from 'drizzle-orm';

export interface FileOwnership {
  ownerId: string;
  ownershipType: 'workspace' | 'link';
  workspaceId?: string;
  linkId?: string;
}

export interface FolderOwnership {
  ownerId: string;
  ownershipType: 'workspace' | 'link';
  workspaceId?: string;
  linkId?: string;
}

/**
 * Get the owner of a file by checking workspace or link relationships
 */
export async function getFileOwnership(fileId: string): Promise<FileOwnership | null> {
  try {
    const fileRecord = await db
      .select({
        workspaceId: files.workspaceId,
        linkId: files.linkId,
      })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord[0]) {
      return null;
    }

    // Check workspace ownership
    if (fileRecord[0].workspaceId) {
      const workspace = await db
        .select({ userId: workspaces.userId })
        .from(workspaces)
        .where(eq(workspaces.id, fileRecord[0].workspaceId))
        .limit(1);

      if (workspace[0]) {
        return {
          ownerId: workspace[0].userId,
          ownershipType: 'workspace',
          workspaceId: fileRecord[0].workspaceId,
        };
      }
    }

    // Check link ownership
    if (fileRecord[0].linkId) {
      const link = await db
        .select({ userId: links.userId })
        .from(links)
        .where(eq(links.id, fileRecord[0].linkId))
        .limit(1);

      if (link[0]) {
        return {
          ownerId: link[0].userId,
          ownershipType: 'link',
          linkId: fileRecord[0].linkId,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting file ownership:', error);
    return null;
  }
}

/**
 * Get the owner of a folder by checking workspace or link relationships
 */
export async function getFolderOwnership(folderId: string): Promise<FolderOwnership | null> {
  try {
    const folderRecord = await db
      .select({
        workspaceId: folders.workspaceId,
        linkId: folders.linkId,
      })
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folderRecord[0]) {
      return null;
    }

    // Check workspace ownership
    if (folderRecord[0].workspaceId) {
      const workspace = await db
        .select({ userId: workspaces.userId })
        .from(workspaces)
        .where(eq(workspaces.id, folderRecord[0].workspaceId))
        .limit(1);

      if (workspace[0]) {
        return {
          ownerId: workspace[0].userId,
          ownershipType: 'workspace',
          workspaceId: folderRecord[0].workspaceId,
        };
      }
    }

    // Check link ownership
    if (folderRecord[0].linkId) {
      const link = await db
        .select({ userId: links.userId })
        .from(links)
        .where(eq(links.id, folderRecord[0].linkId))
        .limit(1);

      if (link[0]) {
        return {
          ownerId: link[0].userId,
          ownershipType: 'link',
          linkId: folderRecord[0].linkId,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting folder ownership:', error);
    return null;
  }
}

/**
 * Get the owner of a batch through its link relationship
 */
export async function getBatchOwnership(batchId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ userId: links.userId })
      .from(batches)
      .innerJoin(links, eq(batches.linkId, links.id))
      .where(eq(batches.id, batchId))
      .limit(1);

    return result[0]?.userId || null;
  } catch (error) {
    console.error('Error getting batch ownership:', error);
    return null;
  }
}

/**
 * Check if a user owns a file (through workspace or link)
 */
export async function userOwnsFile(userId: string, fileId: string): Promise<boolean> {
  const ownership = await getFileOwnership(fileId);
  return ownership?.ownerId === userId;
}

/**
 * Check if a user owns a folder (through workspace or link)
 */
export async function userOwnsFolder(userId: string, folderId: string): Promise<boolean> {
  const ownership = await getFolderOwnership(folderId);
  return ownership?.ownerId === userId;
}

/**
 * Get all files owned by a user (both workspace and link files)
 */
export async function getUserFiles(userId: string) {
  const workspaceFiles = await db
    .select({
      id: files.id,
      fileName: files.fileName,
      fileSize: files.fileSize,
      mimeType: files.mimeType,
      workspaceId: files.workspaceId,
      linkId: files.linkId,
      folderId: files.folderId,
      createdAt: files.createdAt,
    })
    .from(files)
    .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
    .where(eq(workspaces.userId, userId));

  const linkFiles = await db
    .select({
      id: files.id,
      fileName: files.fileName,
      fileSize: files.fileSize,
      mimeType: files.mimeType,
      workspaceId: files.workspaceId,
      linkId: files.linkId,
      folderId: files.folderId,
      createdAt: files.createdAt,
    })
    .from(files)
    .innerJoin(links, eq(files.linkId, links.id))
    .where(eq(links.userId, userId));

  return [...workspaceFiles, ...linkFiles];
}

/**
 * Get all folders owned by a user (both workspace and link folders)
 */
export async function getUserFolders(userId: string) {
  const workspaceFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      path: folders.path,
      workspaceId: folders.workspaceId,
      linkId: folders.linkId,
      parentFolderId: folders.parentFolderId,
      fileCount: folders.fileCount,
      totalSize: folders.totalSize,
      createdAt: folders.createdAt,
    })
    .from(folders)
    .innerJoin(workspaces, eq(folders.workspaceId, workspaces.id))
    .where(eq(workspaces.userId, userId));

  const linkFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      path: folders.path,
      workspaceId: folders.workspaceId,
      linkId: folders.linkId,
      parentFolderId: folders.parentFolderId,
      fileCount: folders.fileCount,
      totalSize: folders.totalSize,
      createdAt: folders.createdAt,
    })
    .from(folders)
    .innerJoin(links, eq(folders.linkId, links.id))
    .where(eq(links.userId, userId));

  return [...workspaceFolders, ...linkFolders];
}

/**
 * Calculate storage used by a specific workspace
 */
export async function calculateWorkspaceStorage(workspaceId: string): Promise<number> {
  const result = await db
    .select({
      totalSize: sum(files.fileSize),
    })
    .from(files)
    .where(eq(files.workspaceId, workspaceId));

  return result[0]?.totalSize ? Number(result[0].totalSize) : 0;
}

/**
 * Calculate storage used by a specific link
 */
export async function calculateLinkStorage(linkId: string): Promise<number> {
  const result = await db
    .select({
      totalSize: sum(files.fileSize),
    })
    .from(files)
    .where(eq(files.linkId, linkId));

  return result[0]?.totalSize ? Number(result[0].totalSize) : 0;
}