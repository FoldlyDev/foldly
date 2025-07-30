'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { moveItemAction } from './tree-actions';
import type { ActionResult } from './tree-actions';

/**
 * Batch move items with hierarchical handling
 * Only moves top-level items - children are moved automatically by the database layer
 */
export async function batchMoveItemsAction(
  itemIds: string[],
  targetId: string | 'root'
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (itemIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get workspace to determine root handling
    const { WorkspaceService } = await import('@/lib/services/workspace');
    const { FileService } = await import('@/lib/services/files/file-service');
    const { FolderService } = await import(
      '@/lib/services/files/folder-service'
    );

    const workspaceService = new WorkspaceService();
    const fileService = new FileService();
    const folderService = new FolderService();

    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Determine actual target ID (handle 'root' case)
    const actualTargetId =
      targetId === 'root' || targetId === workspace.id ? null : targetId;

    // Get all folders and files to analyze hierarchy
    const [foldersResult, filesResult] = await Promise.all([
      folderService.getFoldersByWorkspace(workspace.id),
      fileService.getFilesByWorkspace(workspace.id),
    ]);

    if (!foldersResult.success || !filesResult.success) {
      return { success: false, error: 'Failed to fetch workspace data' };
    }

    const allFolders = foldersResult.data;
    const allFiles = filesResult.data;

    // Create hierarchy map for efficient lookup
    const hierarchyMap = new Map<string, string[]>(); // parentId -> childIds

    // Build folder hierarchy
    allFolders.forEach(folder => {
      const parentId = folder.parentFolderId || workspace.id;
      if (!hierarchyMap.has(parentId)) {
        hierarchyMap.set(parentId, []);
      }
      hierarchyMap.get(parentId)!.push(folder.id);
    });

    // Add files to hierarchy
    allFiles.forEach(file => {
      const parentId = file.folderId || workspace.id;
      if (!hierarchyMap.has(parentId)) {
        hierarchyMap.set(parentId, []);
      }
      hierarchyMap.get(parentId)!.push(file.id);
    });

    // Function to get all descendants of an item
    const getAllDescendants = (itemId: string): Set<string> => {
      const descendants = new Set<string>();
      const children = hierarchyMap.get(itemId) || [];

      for (const childId of children) {
        descendants.add(childId);
        const childDescendants = getAllDescendants(childId);
        childDescendants.forEach(desc => descendants.add(desc));
      }

      return descendants;
    };

    // Filter out items that are children of other items being moved
    const topLevelItems = itemIds.filter(itemId => {
      return !itemIds.some(otherItemId => {
        if (itemId === otherItemId) return false;
        const descendants = getAllDescendants(otherItemId);
        return descendants.has(itemId);
      });
    });

    console.log(
      `🚚 Batch move: ${itemIds.length} items selected, ${topLevelItems.length} top-level items to move`
    );
    console.log('📋 Items to move:', {
      itemIds,
      topLevelItems,
      targetId,
      actualTargetId,
    });

    // Move only the top-level items - their children will be moved automatically
    const results = await Promise.all(
      topLevelItems.map(id => {
        console.log(`🔄 Moving item ${id} to target ${targetId}`);
        return moveItemAction(id, targetId);
      })
    );

    console.log('📊 Move results:', results);

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('❌ Some moves failed:', failed);
      return {
        success: false,
        error: `Failed to move ${failed.length} of ${topLevelItems.length} top-level items`,
      };
    }

    console.log('✅ All moves completed successfully, revalidating path');
    revalidatePath('/dashboard/workspace');

    const result = {
      success: true,
      data: {
        movedItems: topLevelItems.length,
        totalItems: itemIds.length,
        results,
      },
    };

    console.log('🎯 Batch move action completed:', result);
    return result;
  } catch (error) {
    console.error('Batch move failed:', error);
    return { success: false, error: 'Failed to move items' };
  }
}

/**
 * Batch delete items - optimized with storage cleanup
 */
export async function batchDeleteItemsAction(
  itemIds: string[]
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (itemIds.length === 0) {
      return { success: true, data: [] };
    }

    // Import services
    const { WorkspaceService } = await import('@/lib/services/workspace');
    const { FileService } = await import('@/lib/services/files/file-service');
    const { FolderService } = await import(
      '@/lib/services/files/folder-service'
    );
    const { StorageService } = await import(
      '@/lib/services/files/storage-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );

    const workspaceService = new WorkspaceService();
    const fileService = new FileService();
    const folderService = new FolderService();
    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);

    // Verify workspace ownership
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Get all workspace files and folders to verify ownership
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFoldersByWorkspace(workspace.id),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      return { success: false, error: 'Failed to verify workspace data' };
    }

    const workspaceFileIds = new Set(filesResult.data.map(f => f.id));
    const workspaceFolderIds = new Set(foldersResult.data.map(f => f.id));

    // Separate files and folders for optimized deletion
    const fileIdsToDelete = itemIds.filter(id => workspaceFileIds.has(id));
    const folderIdsToDelete = itemIds.filter(id => workspaceFolderIds.has(id));

    if (fileIdsToDelete.length === 0 && folderIdsToDelete.length === 0) {
      return {
        success: false,
        error: 'No valid items to delete - items may not have workspaceId set',
      };
    }

    const deletionResults = [];

    // Delete files with storage cleanup using batch method
    if (fileIdsToDelete.length > 0) {
      const filesDeleteResult = await fileService.batchDeleteFilesWithStorage(
        fileIdsToDelete,
        storageService
      );
      
      if (!filesDeleteResult.success) {
        return {
          success: false,
          error: `Failed to delete files: ${filesDeleteResult.error}`,
        };
      }
      
      deletionResults.push({
        type: 'files',
        total: fileIdsToDelete.length,
        storageDeleted: filesDeleteResult.data?.storageDeleted || 0,
      });
    }

    // Delete folders with storage cleanup
    if (folderIdsToDelete.length > 0) {
      let totalStorageDeleted = 0;
      let totalFilesDeleted = 0;
      
      // Delete each folder with storage cleanup
      const folderResults = await Promise.all(
        folderIdsToDelete.map(async id => {
          const result = await folderService.deleteFolderWithStorage(id, storageService);
          if (result.success && result.data) {
            totalStorageDeleted += result.data.storageDeleted;
            totalFilesDeleted += result.data.filesDeleted;
          }
          return result;
        })
      );
      
      const failedFolders = folderResults.filter(r => !r.success);
      if (failedFolders.length > 0) {
        return {
          success: false,
          error: `Failed to delete ${failedFolders.length} folders`,
        };
      }
      
      deletionResults.push({
        type: 'folders',
        total: folderIdsToDelete.length,
        filesDeleted: totalFilesDeleted,
        storageDeleted: totalStorageDeleted,
      });
    }

    // Get updated storage info after deletion
    const { getUserStorageDashboard } = await import('@/lib/services/storage/storage-tracking-service');
    const updatedStorageInfo = await getUserStorageDashboard(userId, 'free'); // TODO: Get actual user plan

    revalidatePath('/dashboard/workspace');
    return {
      success: true,
      data: {
        deletionResults,
        storageInfo: {
          usagePercentage: updatedStorageInfo.usagePercentage,
          remainingBytes: updatedStorageInfo.remainingBytes,
          shouldShowWarning: false, // Deletion always reduces usage
        },
      },
    };
  } catch (error) {
    console.error('Batch delete failed:', error);
    return { success: false, error: 'Failed to delete items' };
  }
}
