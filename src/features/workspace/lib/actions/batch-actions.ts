'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { FileService } from '@/lib/services/shared/file-service';
import { FolderService } from '@/lib/services/shared/folder-service';
import type { DatabaseId } from '@/lib/supabase/types';

// =============================================================================
// BATCH OPERATIONS - Server actions for batch file/folder operations
// =============================================================================

/**
 * Server action to batch move multiple items
 */
export async function batchMoveItemsAction(
  nodeIds: DatabaseId[],
  targetId: DatabaseId | 'root'
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (nodeIds.length === 0) {
      return { success: true, data: { nodeIds, targetId } };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // Get user's workspace first
    const { workspaceService } = await import('@/lib/services/workspace');
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get all files and folders to categorize the nodeIds
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFoldersByWorkspace(workspace.id),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      throw new Error('Failed to fetch workspace items for moving');
    }

    const fileIds = new Set(filesResult.data.map((f: any) => f.id));
    const folderIds = new Set(foldersResult.data.map((f: any) => f.id));

    // Separate node IDs into files and folders
    const filesToMove = nodeIds.filter(id => fileIds.has(id));
    const foldersToMove = nodeIds.filter(id => folderIds.has(id));

    const actualTargetId = targetId === 'root' ? null : targetId;
    const results = [];

    // Move files if any
    if (filesToMove.length > 0) {
      console.log('📦 Moving files:', filesToMove, 'to:', actualTargetId);
      const fileResult = await fileService.batchMoveFiles(
        filesToMove,
        actualTargetId
      );
      if (!fileResult.success) {
        throw new Error(`Failed to move files: ${fileResult.error}`);
      }
      results.push({ type: 'files', count: filesToMove.length });
    }

    // Move folders if any
    if (foldersToMove.length > 0) {
      console.log('📁 Moving folders:', foldersToMove, 'to:', actualTargetId);
      const folderResult = await folderService.batchMoveFolders(
        foldersToMove,
        actualTargetId
      );
      if (!folderResult.success) {
        throw new Error(`Failed to move folders: ${folderResult.error}`);
      }
      results.push({ type: 'folders', count: foldersToMove.length });
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    console.log('✅ Batch move completed:', results);
    return { success: true, data: { nodeIds, targetId, results } };
  } catch (error) {
    console.error('❌ BATCH_MOVE_ACTION_FAILED:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to batch move items',
    };
  }
}

/**
 * Server action to batch delete multiple items
 */
export async function batchDeleteItemsAction(nodeIds: DatabaseId[]) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (nodeIds.length === 0) {
      return { success: true, data: { nodeIds } };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // Get user's workspace first
    const { workspaceService } = await import('@/lib/services/workspace');
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get all files and folders to categorize the nodeIds
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFoldersByWorkspace(workspace.id),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      throw new Error('Failed to fetch workspace items for deletion');
    }

    const fileIds = new Set(filesResult.data.map((f: any) => f.id));
    const folderIds = new Set(foldersResult.data.map((f: any) => f.id));

    // Separate node IDs into files and folders
    const filesToDelete = nodeIds.filter(id => fileIds.has(id));
    const foldersToDelete = nodeIds.filter(id => folderIds.has(id));

    const results = [];

    // Delete files if any
    if (filesToDelete.length > 0) {
      console.log('🗑️ Deleting files:', filesToDelete);
      const fileResult = await fileService.batchDeleteFiles(filesToDelete);
      if (!fileResult.success) {
        throw new Error(`Failed to delete files: ${fileResult.error}`);
      }
      results.push({ type: 'files', count: filesToDelete.length });
    }

    // Delete folders if any
    if (foldersToDelete.length > 0) {
      console.log('🗑️ Deleting folders:', foldersToDelete);
      const folderResult =
        await folderService.batchDeleteFolders(foldersToDelete);
      if (!folderResult.success) {
        throw new Error(`Failed to delete folders: ${folderResult.error}`);
      }
      results.push({ type: 'folders', count: foldersToDelete.length });
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    console.log('✅ Batch deletion completed:', results);
    return { success: true, data: { nodeIds, results } };
  } catch (error) {
    console.error('❌ BATCH_DELETE_ACTION_FAILED:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to batch delete items',
    };
  }
}
