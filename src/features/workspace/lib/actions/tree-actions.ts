'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { WorkspaceService } from '@/lib/services/workspace';
import { FileService } from '@/lib/services/files/file-service';
import { FolderService } from '@/lib/services/files/folder-service';

const workspaceService = new WorkspaceService();
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
 * Get workspace tree data - simplified version
 */
export async function fetchWorkspaceTreeAction(): Promise<ActionResult> {
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
    console.error('Failed to get workspace tree:', error);
    return { success: false, error: 'Failed to get workspace tree' };
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
    console.error('Failed to move item:', error);
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

    // Get current files and folders to distinguish between them
    const [foldersResult, filesResult] = await Promise.all([
      folderService.getFoldersByWorkspace(workspace.id),
      fileService.getFilesByWorkspace(workspace.id),
    ]);

    if (!foldersResult.success || !filesResult.success) {
      return { success: false, error: 'Failed to fetch workspace data' };
    }

    const folderIds = new Set(foldersResult.data?.map(f => f.id) || []);
    const fileIds = new Set(filesResult.data?.map(f => f.id) || []);

    // Separate files and folders, then update their sortOrder
    const updates = orderedChildIds.map(async (id, index) => {
      if (folderIds.has(id)) {
        return folderService.updateFolder(id, { sortOrder: index });
      } else if (fileIds.has(id)) {
        return fileService.updateFile(id, { sortOrder: index });
      } else {
        console.warn(`Item ${id} not found in workspace`);
        return { success: false, error: `Item ${id} not found` };
      }
    });

    const results = await Promise.all(updates);

    // Check if any updates failed
    const failedUpdates = results.filter(result => !result.success);
    if (failedUpdates.length > 0) {
      console.error('Some updates failed:', failedUpdates);
      return { success: false, error: 'Some items failed to update' };
    }

    revalidatePath('/dashboard/workspace');

    return { success: true };
  } catch (error) {
    console.error('Failed to update order:', error);
    return { success: false, error: 'Failed to update order' };
  }
}
