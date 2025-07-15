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

    // For batch operations, we need to determine if items are files or folders
    // For now, we'll treat them as files and move them to the target folder
    const fileService = new FileService();
    const actualTargetId = targetId === 'root' ? null : targetId;

    const result = await fileService.batchMoveFiles(nodeIds, actualTargetId);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    return { success: true, data: { nodeIds, targetId } };
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

    // For batch operations, we need to determine if items are files or folders
    // For now, we'll treat them as files and delete them
    const fileService = new FileService();
    const folderService = new FolderService();

    // Try to delete as files first, then as folders
    const fileResult = await fileService.batchDeleteFiles(nodeIds);
    if (!fileResult.success) {
      // If file deletion fails, try as folders
      const folderResult = await folderService.batchDeleteFolders(nodeIds);
      if (!folderResult.success) {
        throw new Error(folderResult.error);
      }
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    return { success: true, data: { nodeIds } };
  } catch (error) {
    console.error('❌ BATCH_DELETE_ACTION_FAILED:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to batch delete items',
    };
  }
}
