'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { WorkspaceService } from '@/lib/services/workspace';
import { FileService } from '@/lib/services/shared/file-service';
import { FolderService } from '@/lib/services/shared/folder-service';
import type { DatabaseId, DatabaseResult } from '@/lib/supabase/types';

// =============================================================================
// INITIALIZATION
// =============================================================================

const workspaceService = new WorkspaceService();

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkspaceTreeData {
  folders: any[];
  files: any[];
  workspace: {
    id: string;
    name: string;
  };
  stats: {
    folderCount: number;
    fileCount: number;
    totalSize: number;
  };
}

// =============================================================================
// REORDER ACTIONS
// =============================================================================

/**
 * Update the sort order of items within a parent folder
 */
export async function updateItemOrderAction(
  parentId: string,
  newChildrenIds: string[]
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // First, get all items to determine their types
    const [foldersResult, filesResult] = await Promise.all([
      folderService.getFoldersByWorkspace(workspace.id),
      fileService.getFilesByWorkspace(workspace.id),
    ]);

    if (!foldersResult.success || !filesResult.success) {
      return { success: false, error: 'Failed to fetch workspace items' };
    }

    const folderIds = new Set(foldersResult.data.map((f: any) => f.id));

    // Update sort order for each item
    const updatePromises = newChildrenIds.map(async (itemId, index) => {
      const sortOrder = index;

      if (folderIds.has(itemId)) {
        // It's a folder - update its sortOrder
        return folderService.updateFolder(itemId, { sortOrder });
      } else {
        // It's a file - files don't have sortOrder in current schema
        // For now, we'll just return success since files will be sorted by name or uploadedAt
        return { success: true, data: null };
      }
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);

    // Check if any updates failed
    const failedUpdates = results.filter(result => result && !result.success);
    if (failedUpdates.length > 0) {
      return {
        success: false,
        error: `Failed to update ${failedUpdates.length} items`,
      };
    }

    // Revalidate the workspace page to update the UI
    revalidatePath('/dashboard/workspace');

    return { success: true, data: { parentId, newChildrenIds } };
  } catch (error) {
    console.error('Failed to update item order:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update item order',
    };
  }
}

// =============================================================================
// WORKSPACE TREE DATA ACTIONS
// =============================================================================

/**
 * Move an item (file or folder) to a new parent folder or root level
 */
export async function moveItemAction(
  nodeId: DatabaseId,
  targetId: DatabaseId | 'root'
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // Handle root-level moves - convert 'root' to null
    const actualTargetId = targetId === 'root' ? null : targetId;

    // First, try to move as a file
    const fileResult = await fileService.moveFile(nodeId, actualTargetId);
    if (fileResult.success) {
      return { success: true, data: fileResult.data };
    }

    // If that fails, try to move as a folder
    const folderResult = await folderService.moveFolder(nodeId, actualTargetId);
    if (folderResult.success) {
      return { success: true, data: folderResult.data };
    }

    // If both fail, return error
    return {
      success: false,
      error: `Failed to move item: ${fileResult.error || folderResult.error}`,
    };
  } catch (error) {
    console.error('Failed to move item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move item',
    };
  }
}

/**
 * Fetch workspace tree data (folders, files, stats) - ORDERED BY sortOrder
 */
export async function fetchWorkspaceTreeAction(): Promise<
  ActionResult<WorkspaceTreeData>
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Initialize services
    const fileService = new FileService();
    const folderService = new FolderService();

    // Fetch data from database (ordered by sortOrder)
    const [foldersResult, filesResult, statsResult] = await Promise.all([
      folderService.getFoldersByWorkspaceOrdered(workspace.id),
      fileService.getFilesByWorkspaceOrdered(workspace.id),
      folderService.getFolderStats(workspace.id),
    ]);

    // Handle errors
    if (!foldersResult.success) {
      return { success: false, error: foldersResult.error };
    }

    if (!filesResult.success) {
      return { success: false, error: filesResult.error };
    }

    if (!statsResult.success) {
      return { success: false, error: statsResult.error };
    }

    // Calculate total file size
    const totalSize = filesResult.data.reduce(
      (sum: number, file: any) => sum + (file.fileSize || 0),
      0
    );

    const treeData: WorkspaceTreeData = {
      folders: foldersResult.data,
      files: filesResult.data,
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      stats: {
        folderCount: statsResult.data.folderCount,
        fileCount: statsResult.data.fileCount,
        totalSize,
      },
    };

    return {
      success: true,
      data: treeData,
    };
  } catch (error) {
    console.error('Failed to fetch workspace tree:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch workspace tree',
    };
  }
}

/**
 * Fetch workspace statistics
 */
export async function fetchWorkspaceStatsAction(): Promise<
  ActionResult<any> // Changed from DatabaseResult to ActionResult
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Initialize services
    const fileService = new FileService();
    const folderService = new FolderService();

    // Fetch stats from database
    const [folderStatsResult, totalFilesResult, totalFoldersResult] =
      await Promise.all([
        folderService.getFolderStats(workspace.id),
        fileService.getFilesByWorkspace(workspace.id),
        folderService.getFoldersByWorkspace(workspace.id),
      ]);

    // Handle errors
    if (!folderStatsResult.success) {
      return { success: false, error: folderStatsResult.error };
    }

    if (!totalFilesResult.success) {
      return { success: false, error: totalFilesResult.error };
    }

    if (!totalFoldersResult.success) {
      return { success: false, error: totalFoldersResult.error };
    }

    // Calculate storage used
    const storageUsed = totalFilesResult.data.reduce(
      (sum: number, file: any) => sum + (file.fileSize || 0),
      0
    );

    // Get most recent activity
    const recentFiles = totalFilesResult.data
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5);

    const recentActivity =
      recentFiles.length > 0
        ? `${recentFiles.length} files recently modified`
        : 'No recent activity';

    const stats: any = {
      // Changed from WorkspaceStatsData to any
      totalLinks: 0,
      totalFolders: totalFoldersResult.data.length,
      totalFiles: totalFilesResult.data.length,
      storageUsed,
      storageLimit: 2147483648, // 2GB default
      lastActivity:
        recentFiles.length > 0 && recentFiles[0]
          ? new Date(recentFiles[0].updatedAt)
          : null,
      recentActivity,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Failed to fetch workspace stats:', error);
    return { success: false, error: (error as Error).message };
  }
}
