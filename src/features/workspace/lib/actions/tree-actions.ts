'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { workspaceService } from '@/features/workspace/lib/services/workspace-service';
import { FileService } from '@/lib/services/file-system/file-service';
import { FolderService } from '@/lib/services/file-system/folder-service';
import { logger } from '@/lib/services/logging/logger';

const fileService = new FileService();
const folderService = new FolderService();

/**
 * Simple action result type
 */
export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get workspace data including folders, files, and workspace info
 */
export async function fetchWorkspaceDataAction(): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const [folders, files] = await Promise.all([
      folderService.getFoldersByWorkspace(workspace.id),
      fileService.getFilesByWorkspace(workspace.id),
    ]);

    if (!folders.success || !files.success) {
      return { success: false, error: 'Failed to fetch workspace data' };
    }

    return {
      success: true,
      data: {
        workspace: { id: workspace.id, name: workspace.name },
        folders: folders.data,
        files: files.data,
      },
    };
  } catch (error) {
    logger.error('Failed to get workspace data', error);
    return { success: false, error: 'Failed to get workspace data' };
  }
}


/**
 * Move a single item to a new parent
 */
export async function moveItemAction(
  itemId: string,
  targetId: string
): Promise<ActionResult> {
  try {

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get workspace to check if targetId is the workspace root
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // If target is workspace ID, set parent to null (workspace root)
    const newParentId = targetId === workspace.id ? null : targetId;


    // Try to move as file first, then as folder
    const fileMove = await fileService.moveFile(itemId, newParentId);
    if (fileMove.success) {
      revalidatePath('/dashboard/workspace');
      return fileMove;
    }

    const folderMove = await folderService.moveFolder(itemId, newParentId);
    if (folderMove.success) {
      revalidatePath('/dashboard/workspace');
      return folderMove;
    }

    return { success: false, error: 'Item not found' };
  } catch (error) {
    logger.error('Failed to move item', error);
    return { success: false, error: 'Failed to move item' };
  }
}

/**
 * Update item order within a parent (handles both files and folders with sortOrder)
 */
export async function updateItemOrderAction(
  parentId: string,
  orderedChildIds: string[]
): Promise<ActionResult> {
  try {

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get workspace to access tree data
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Determine the actual parent folder ID (null for workspace root)
    const actualParentId = parentId === workspace.id ? null : parentId;


    // Get current files and folders for this specific parent
    const [foldersResult, filesResult] = await Promise.all([
      folderService.getFoldersByParent(actualParentId, workspace.id),
      actualParentId
        ? fileService.getFilesByFolder(actualParentId)
        : fileService.getRootFilesByWorkspace(workspace.id),
    ]);

    if (!foldersResult.success || !filesResult.success) {
      return { success: false, error: 'Failed to fetch parent items' };
    }

    const folders = foldersResult.data || [];
    const files = filesResult.data || [];
    const folderIds = new Set(folders.map(f => f.id));
    const fileIds = new Set(files.map(f => f.id));


    // Update sortOrder for ALL items provided in their new order
    // The tree sends us the complete new order for all children
    const updates = orderedChildIds.map(async (id, index) => {
      if (folderIds.has(id)) {
        return folderService.updateFolder(id, { sortOrder: index });
      } else if (fileIds.has(id)) {
        return fileService.updateFile(id, { sortOrder: index });
      } else {
        // Skip items that don't belong to this parent (they might be from other folders during multi-select)
        console.warn(
          `  ⚠️ Item ${id.slice(0, 8)} not found in parent - skipping`
        );
        return { success: true }; // Not an error, just skip it
      }
    });

    const results = await Promise.all(updates);

    // Check if any updates failed
    const failedUpdates = results.filter(result => !result.success);
    if (failedUpdates.length > 0) {
      logger.error('Some sort order updates failed', undefined, {
        failedUpdates,
      });
      return { success: false, error: 'Some items failed to update' };
    }

    revalidatePath('/dashboard/workspace');

    return { success: true };
  } catch (error) {
    logger.error('Failed to update sort order', error);
    return { success: false, error: 'Failed to update order' };
  }
}
