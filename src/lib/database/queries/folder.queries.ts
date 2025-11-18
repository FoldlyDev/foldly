// =============================================================================
// FOLDER DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for folder operations (called by server actions)

import { db, postgresClient } from '@/lib/database/connection';
import { folders, links } from '@/lib/database/schemas';
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
 * Get folders by parent (root or child folders)
 * Universal query for folder navigation - handles both root and nested folders
 *
 * @param workspaceId - The UUID of the workspace
 * @param parentFolderId - The UUID of the parent folder, or null for root folders
 * @returns Array of folders in the specified location ordered by creation date (newest first)
 *
 * @example
 * ```typescript
 * // Get root-level folders (not in any folder)
 * const rootFolders = await getFoldersByParent('workspace_123', null);
 * // Returns: Folders where parentFolderId IS NULL
 *
 * // Get child folders of a parent
 * const subfolders = await getFoldersByParent('workspace_123', 'folder_456');
 * // Returns: Folders where parentFolderId = 'folder_456'
 * ```
 */
export async function getFoldersByParent(
  workspaceId: string,
  parentFolderId: string | null
): Promise<Folder[]> {
  return await db.query.folders.findMany({
    where: and(
      eq(folders.workspaceId, workspaceId),
      parentFolderId === null
        ? isNull(folders.parentFolderId)
        : eq(folders.parentFolderId, parentFolderId)
    ),
    orderBy: (folders, { desc }) => [desc(folders.createdAt)],
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
 * CASCADE deletes all subfolders and files within (database constraints)
 * Deactivates associated link if folder is linked (sets link.isActive = false)
 *
 * @param folderId - The UUID of the folder to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * await deleteFolder('folder_123');
 * // 1. If folder has linkId, deactivates the link (isActive = false)
 * // 2. All subfolders and files inside are CASCADE deleted permanently
 * ```
 */
export async function deleteFolder(folderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Get folder's linkId before deletion
    const existingFolder = await tx.query.folders.findFirst({
      where: eq(folders.id, folderId),
      columns: { linkId: true },
    });

    // If folder has a link, deactivate it first
    // This prevents orphaned active links (link with no folder)
    if (existingFolder?.linkId) {
      await tx
        .update(links)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(links.id, existingFolder.linkId));
    }

    // Delete the folder (CASCADE deletes subfolders, sets file parent_folder_id to NULL)
    await tx.delete(folders).where(eq(folders.id, folderId));
  });
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

// =============================================================================
// FOLDER-LINK RELATIONSHIP QUERIES
// =============================================================================

/**
 * Link folder to existing link
 * Updates folder.linkId and link.isActive in single transaction
 * Used when converting personal folder to shared folder
 *
 * @param folderId - The UUID of the folder to link
 * @param linkId - The UUID of the link to associate with folder
 * @returns Updated folder object
 * @throws Error if folder or link not found, or update fails
 *
 * @example
 * ```typescript
 * const folder = await linkFolderToLink('folder_123', 'link_456');
 * // folder.linkId = 'link_456', link.isActive = true
 * ```
 */
export async function linkFolderToLink(
  folderId: string,
  linkId: string
): Promise<Folder> {
  return await db.transaction(async (tx) => {
    // Update link to active
    await tx
      .update(links)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(links.id, linkId));

    // Update folder with linkId
    const [folder] = await tx
      .update(folders)
      .set({ linkId, updatedAt: new Date() })
      .where(eq(folders.id, folderId))
      .returning();

    if (!folder) {
      throw new Error(`Failed to link folder: Folder with ID ${folderId} not found`);
    }

    return folder;
  });
}

/**
 * Unlink folder from link
 * Sets folder.linkId = NULL and link.isActive = false (preserves link for re-use)
 * Used when converting shared folder to personal folder (non-destructive)
 *
 * @param folderId - The UUID of the folder to unlink
 * @returns Updated folder object
 * @throws Error if folder not found or update fails
 *
 * @example
 * ```typescript
 * const folder = await unlinkFolder('folder_123');
 * // folder.linkId = null, associated link.isActive = false
 * ```
 */
export async function unlinkFolder(folderId: string): Promise<Folder> {
  return await db.transaction(async (tx) => {
    // Get folder to find associated linkId
    const existingFolder = await tx.query.folders.findFirst({
      where: eq(folders.id, folderId),
      columns: { linkId: true },
    });

    // Update folder linkId to NULL
    const [folder] = await tx
      .update(folders)
      .set({ linkId: null, updatedAt: new Date() })
      .where(eq(folders.id, folderId))
      .returning();

    if (!folder) {
      throw new Error(`Failed to unlink folder: Folder with ID ${folderId} not found`);
    }

    // If folder had a link, set link to inactive
    if (existingFolder?.linkId) {
      await tx
        .update(links)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(links.id, existingFolder.linkId));
    }

    return folder;
  });
}

/**
 * Get all descendant folders recursively (for folder download)
 * Uses PostgreSQL WITH RECURSIVE CTE for efficient traversal
 *
 * Returns ALL subfolders (children, grandchildren, great-grandchildren, etc.)
 * Useful for folder download operations where entire folder tree is needed
 *
 * @param folderId - The UUID of the parent folder
 * @returns Array of all descendant folders (ordered by depth, then name)
 *
 * @example
 * ```typescript
 * const descendants = await getFolderDescendants('folder_123');
 * // Returns: [
 * //   { id: 'folder_2', name: 'Invoices', depth: 1, ... },
 * //   { id: 'folder_3', name: '2024', depth: 2, ... },
 * //   { id: 'folder_4', name: 'Q1', depth: 3, ... }
 * // ]
 * ```
 */
export async function getFolderDescendants(folderId: string): Promise<Folder[]> {
  const result = await postgresClient<Folder[]>`
    WITH RECURSIVE folder_tree AS (
      -- Base case: Direct children of the folder
      SELECT *
      FROM folders
      WHERE parent_folder_id = ${folderId}

      UNION ALL

      -- Recursive case: Children of children
      SELECT f.*
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
    )
    SELECT * FROM folder_tree
    ORDER BY created_at DESC
  `;

  return result;
}

/**
 * Get all files in folder tree recursively (folder + all descendants)
 * Combines folder descendant traversal with file fetching
 *
 * Returns ALL files in the folder and all its subfolders
 * Includes file path information (folder hierarchy) for ZIP creation
 *
 * @param folderId - The UUID of the parent folder
 * @param workspaceId - The UUID of the workspace (for security verification)
 * @returns Array of all files in folder tree with path information
 *
 * @example
 * ```typescript
 * const files = await getFolderTreeFiles('folder_123', 'workspace_456');
 * // Returns: [
 * //   { id: 'file_1', filename: 'doc.pdf', folderPath: ['Documents'], ... },
 * //   { id: 'file_2', filename: 'invoice.pdf', folderPath: ['Documents', 'Invoices'], ... }
 * // ]
 * ```
 */
export async function getFolderTreeFiles(
  folderId: string,
  workspaceId: string
): Promise<Array<{
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: Date;
  parentFolderId: string | null;
  folderPath: string[];
}>> {
  const result = await postgresClient<Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    uploadedAt: Date;
    parentFolderId: string | null;
    folderPath: string[];
  }>>`
    WITH RECURSIVE folder_tree AS (
      -- Base case: Start with the target folder
      -- Cast to text[] to match recursive case type inference
      SELECT id, name, parent_folder_id, ARRAY[name]::text[] as path
      FROM folders
      WHERE id = ${folderId} AND workspace_id = ${workspaceId}

      UNION ALL

      -- Recursive case: Get all descendant folders
      SELECT f.id, f.name, f.parent_folder_id, ft.path || f.name
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
    )
    -- Get all files in the folder tree
    SELECT
      fi.id,
      fi.filename,
      fi.file_size as "fileSize",
      fi.mime_type as "mimeType",
      fi.storage_path as "storagePath",
      fi.uploaded_at as "uploadedAt",
      fi.parent_folder_id as "parentFolderId",
      COALESCE(ft.path, ARRAY[]::text[]) as "folderPath"
    FROM files fi
    LEFT JOIN folder_tree ft ON fi.parent_folder_id = ft.id
    WHERE fi.workspace_id = ${workspaceId}
      AND (fi.parent_folder_id = ${folderId} OR fi.parent_folder_id IN (SELECT id FROM folder_tree))
    ORDER BY ft.path, fi.filename
  `;

  return result;
}
