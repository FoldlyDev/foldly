// =============================================================================
// FOLDER DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for folder operations (called by server actions)

import { db } from '@/lib/database/connection';
import { folders } from '@/lib/database/schemas';
import { eq, and, isNull } from 'drizzle-orm';
import type { Folder, NewFolder } from '@/lib/database/schemas';

/**
 * Get folder by ID
 * Returns folder with all relations (workspace, link, parent, subfolders)
 */
export async function getFolderById(folderId: string) {
  return await db.query.folders.findFirst({
    where: eq(folders.id, folderId),
    with: {
      workspace: true,
      link: true,
      parentFolder: true,
      subfolders: true,
    },
  });
}

/**
 * Get all root folders for a workspace
 * Root folders have parentFolderId = NULL
 */
export async function getRootFolders(workspaceId: string) {
  return await db.query.folders.findMany({
    where: and(
      eq(folders.workspaceId, workspaceId),
      isNull(folders.parentFolderId)
    ),
    orderBy: (folders, { desc }) => [desc(folders.createdAt)],
  });
}

/**
 * Get all child folders of a parent folder
 */
export async function getSubfolders(parentFolderId: string) {
  return await db.query.folders.findMany({
    where: eq(folders.parentFolderId, parentFolderId),
    orderBy: (folders, { asc }) => [asc(folders.name)],
  });
}

/**
 * Get folder hierarchy (breadcrumb path)
 * Returns array of folders from root to current folder
 */
export async function getFolderHierarchy(folderId: string): Promise<Folder[]> {
  const hierarchy: Folder[] = [];
  let currentFolderId: string | null = folderId;

  // Traverse up the tree to build breadcrumb
  while (currentFolderId) {
    const folder: Folder | undefined = await db.query.folders.findFirst({
      where: eq(folders.id, currentFolderId),
    });

    if (!folder) break;

    hierarchy.unshift(folder); // Add to beginning of array
    currentFolderId = folder.parentFolderId;
  }

  return hierarchy;
}

/**
 * Create a new folder
 */
export async function createFolder(data: {
  workspaceId: string;
  name: string;
  parentFolderId?: string | null;
  linkId?: string | null;
  uploaderEmail?: string | null;
  uploaderName?: string | null;
}): Promise<Folder> {
  const [folder] = await db
    .insert(folders)
    .values({
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      name: data.name,
      parentFolderId: data.parentFolderId ?? null,
      linkId: data.linkId ?? null,
      uploaderEmail: data.uploaderEmail ?? null,
      uploaderName: data.uploaderName ?? null,
    })
    .returning();

  if (!folder) {
    throw new Error('Failed to create folder: Database insert returned no rows');
  }

  return folder;
}

/**
 * Update folder details
 * Can update name, parentFolderId (move), or both
 */
export async function updateFolder(
  folderId: string,
  data: {
    name?: string;
    parentFolderId?: string | null;
  }
): Promise<Folder> {
  const [folder] = await db
    .update(folders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(folders.id, folderId))
    .returning();

  if (!folder) {
    throw new Error(`Failed to update folder: Folder with ID ${folderId} not found or update failed`);
  }

  return folder;
}

/**
 * Delete a folder
 * Cascade delete of subfolders and files is handled by database constraints
 */
export async function deleteFolder(folderId: string): Promise<void> {
  await db.delete(folders).where(eq(folders.id, folderId));
}

/**
 * Check if folder name is available within the same parent context
 * Used for validation during folder creation/update
 */
export async function isFolderNameAvailable(
  workspaceId: string,
  name: string,
  parentFolderId?: string | null,
  excludeFolderId?: string
): Promise<boolean> {
  // Build where conditions
  const conditions = [
    eq(folders.workspaceId, workspaceId),
    eq(folders.name, name),
  ];

  // Add parent condition (either NULL or specific parent ID)
  if (parentFolderId === null || parentFolderId === undefined) {
    conditions.push(isNull(folders.parentFolderId));
  } else {
    conditions.push(eq(folders.parentFolderId, parentFolderId));
  }

  const existingFolder = await db.query.folders.findFirst({
    where: and(...conditions),
    columns: {
      id: true,
    },
  });

  if (!existingFolder) return true;
  if (excludeFolderId && existingFolder.id === excludeFolderId) return true;
  return false;
}

/**
 * Calculate folder nesting depth
 * Returns depth number (0 = root folder, 1 = first level, etc.)
 * Used to enforce MAX_NESTING_DEPTH limit (20 levels)
 */
export async function getFolderDepth(folderId: string): Promise<number> {
  let depth = 0;
  let currentFolderId: string | null = folderId;

  // Traverse up the tree to count ancestors
  while (currentFolderId) {
    const folder: Pick<Folder, 'parentFolderId'> | undefined = await db.query.folders.findFirst({
      where: eq(folders.id, currentFolderId),
      columns: {
        parentFolderId: true,
      },
    });

    if (!folder) break;

    if (folder.parentFolderId) {
      depth++;
      currentFolderId = folder.parentFolderId;
    } else {
      // Reached root folder
      break;
    }
  }

  return depth;
}
