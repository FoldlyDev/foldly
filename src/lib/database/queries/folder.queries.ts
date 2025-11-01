// =============================================================================
// FOLDER DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for folder operations (called by server actions)

import { db, postgresClient } from '@/lib/database/connection';
import { folders } from '@/lib/database/schemas';
import { eq, and, isNull } from 'drizzle-orm';
import type { Folder, NewFolder } from '@/lib/database/schemas';

/**
 * Get folder by ID
 * Returns folder with all relations (workspace, link, parent, subfolders)
 *
 * @param folderId - The UUID of the folder to retrieve
 * @returns Folder with relations or undefined if not found
 *
 * @example
 * ```typescript
 * const folder = await getFolderById('folder_123');
 * if (folder) {
 *   console.log(folder.name, folder.workspace, folder.subfolders);
 * }
 * ```
 */
export async function getFolderById(folderId: string): Promise<Folder | undefined> {
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
 *
 * @param workspaceId - The UUID of the workspace
 * @returns Array of root folders ordered by creation date (newest first)
 *
 * @example
 * ```typescript
 * const rootFolders = await getRootFolders('workspace_123');
 * // Returns: [{ id: 'folder_1', name: 'Documents', parentFolderId: null, ... }, ...]
 * ```
 */
export async function getRootFolders(workspaceId: string): Promise<Folder[]> {
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
 *
 * @param parentFolderId - The UUID of the parent folder
 * @returns Array of child folders ordered alphabetically by name
 *
 * @example
 * ```typescript
 * const subfolders = await getSubfolders('folder_123');
 * // Returns: [{ id: 'folder_2', name: 'Invoices', parentFolderId: 'folder_123', ... }, ...]
 * ```
 */
export async function getSubfolders(parentFolderId: string): Promise<Folder[]> {
  return await db.query.folders.findMany({
    where: eq(folders.parentFolderId, parentFolderId),
    orderBy: (folders, { asc }) => [asc(folders.name)],
  });
}

/**
 * Get folder hierarchy (breadcrumb path)
 * Returns array of folders from root to current folder
 *
 * OPTIMIZED: Uses PostgreSQL recursive CTE for single-query traversal
 * Performance: O(1) database query (vs O(depth) queries in iterative approach)
 *
 * @param folderId - The UUID of the folder to get hierarchy for
 * @returns Array of folders from root to current (ordered by depth)
 *
 * @example
 * ```typescript
 * const hierarchy = await getFolderHierarchy('folder_123');
 * // Returns: [rootFolder, parentFolder, currentFolder]
 * // Used for breadcrumb: Home > Documents > 2024 > Tax Returns
 * ```
 */
export async function getFolderHierarchy(folderId: string): Promise<Folder[]> {
  const result = await postgresClient<{
    id: string;
    name: string;
    parent_folder_id: string | null;
    workspace_id: string;
    link_id: string | null;
    uploader_email: string | null;
    uploader_name: string | null;
    created_at: Date;
    updated_at: Date;
  }[]>`
    WITH RECURSIVE folder_path AS (
      -- Base case: Start with the target folder
      SELECT
        id, name, parent_folder_id, workspace_id, link_id,
        uploader_email, uploader_name, created_at, updated_at,
        0 as depth
      FROM folders
      WHERE id = ${folderId}

      UNION ALL

      -- Recursive case: Get parent folders
      SELECT
        f.id, f.name, f.parent_folder_id, f.workspace_id, f.link_id,
        f.uploader_email, f.uploader_name, f.created_at, f.updated_at,
        fp.depth + 1 as depth
      FROM folders f
      INNER JOIN folder_path fp ON f.id = fp.parent_folder_id
    )
    SELECT
      id, name, parent_folder_id, workspace_id, link_id,
      uploader_email, uploader_name, created_at, updated_at
    FROM folder_path
    ORDER BY depth DESC
  `;

  // Map snake_case database columns to camelCase TypeScript properties
  return result.map(row => ({
    id: row.id,
    name: row.name,
    parentFolderId: row.parent_folder_id,
    workspaceId: row.workspace_id,
    linkId: row.link_id,
    uploaderEmail: row.uploader_email,
    uploaderName: row.uploader_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as Folder[];
}

/**
 * Create a new folder
 *
 * @param data - Folder creation data
 * @param data.workspaceId - The UUID of the workspace
 * @param data.name - Folder name (1-255 characters)
 * @param data.parentFolderId - Optional parent folder UUID (null for root folder)
 * @param data.linkId - Optional link UUID (if folder created via shareable link)
 * @param data.uploaderEmail - Optional uploader email (if folder created by external user)
 * @param data.uploaderName - Optional uploader name (if folder created by external user)
 * @returns Created folder object with generated ID and timestamps
 * @throws Error if database insert fails
 *
 * @example
 * ```typescript
 * const folder = await createFolder({
 *   workspaceId: 'workspace_123',
 *   name: 'Tax Documents 2024',
 *   parentFolderId: 'folder_456',
 * });
 * // Returns: { id: 'folder_789', name: 'Tax Documents 2024', createdAt: ..., ... }
 * ```
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
 *
 * @param folderId - The UUID of the folder to update
 * @param data - Partial folder data to update
 * @param data.name - Optional new folder name
 * @param data.parentFolderId - Optional new parent folder UUID (use null to move to root)
 * @returns Updated folder object
 * @throws Error if folder not found or update fails
 *
 * @example
 * ```typescript
 * // Rename folder
 * const renamed = await updateFolder('folder_123', { name: 'New Name' });
 *
 * // Move folder to new parent
 * const moved = await updateFolder('folder_123', { parentFolderId: 'folder_456' });
 *
 * // Move to root
 * const toRoot = await updateFolder('folder_123', { parentFolderId: null });
 * ```
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
 * Cascade delete of subfolders handled by database constraints
 * Files in deleted folders have their parentFolderId set to NULL
 *
 * @param folderId - The UUID of the folder to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * await deleteFolder('folder_123');
 * // All subfolders cascade deleted, files become orphaned (parentFolderId = null)
 * ```
 */
export async function deleteFolder(folderId: string): Promise<void> {
  await db.delete(folders).where(eq(folders.id, folderId));
}

/**
 * Check if folder name is available within the same parent context
 * Used for validation during folder creation/update
 * Folders must have unique names within the same parent (or at root level)
 *
 * @param workspaceId - The UUID of the workspace
 * @param name - The folder name to check
 * @param parentFolderId - The parent folder UUID (null/undefined for root level)
 * @param excludeFolderId - Optional folder UUID to exclude from check (for renames)
 * @returns True if name is available, false if already exists
 *
 * @example
 * ```typescript
 * // Check if "Documents" is available at root level
 * const available = await isFolderNameAvailable('workspace_123', 'Documents', null);
 *
 * // Check if "Invoices" is available in specific parent (excluding current folder during rename)
 * const canRename = await isFolderNameAvailable('workspace_123', 'Invoices', 'folder_456', 'folder_123');
 * ```
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
 *
 * OPTIMIZED: Uses PostgreSQL recursive CTE for single-query depth calculation
 * Performance: O(1) database query (vs O(depth) queries in iterative approach)
 *
 * @param folderId - The UUID of the folder to calculate depth for
 * @returns Depth number (0 = root, 1 = first level, 2 = second level, etc.)
 *
 * @example
 * ```typescript
 * const depth = await getFolderDepth('folder_123');
 * // Returns: 3 (means folder is at 3rd nesting level)
 *
 * // Used for validation:
 * if (depth >= 20) {
 *   throw new Error('Maximum nesting depth reached');
 * }
 * ```
 */
export async function getFolderDepth(folderId: string): Promise<number> {
  const result = await postgresClient<{ max_depth: number }[]>`
    WITH RECURSIVE folder_ancestors AS (
      -- Base case: Start with the target folder
      SELECT id, parent_folder_id, 0 as depth
      FROM folders
      WHERE id = ${folderId}

      UNION ALL

      -- Recursive case: Traverse up to parent folders
      SELECT f.id, f.parent_folder_id, fa.depth + 1 as depth
      FROM folders f
      INNER JOIN folder_ancestors fa ON f.id = fa.parent_folder_id
    )
    SELECT COALESCE(MAX(depth), 0) as max_depth
    FROM folder_ancestors
  `;

  return result[0]?.max_depth ?? 0;
}
