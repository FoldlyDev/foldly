'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { workspaceService } from '@/lib/services/workspace';
import { FolderService } from '@/lib/services/shared/folder-service';
import type { DatabaseId } from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// FOLDER ACTIONS
// =============================================================================

/**
 * Create a new folder
 */
export async function createFolderAction(
  name: string,
  parentId?: DatabaseId
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

    const folderService = new FolderService();
    const result = await folderService.createFolder({
      name,
      parentFolderId: parentId,
      workspaceId: workspace.id,
      userId,
      path: parentId ? `${parentId}/${name}` : name,
      depth: 0, // TODO: Calculate proper depth
    });

    if (result.success) {
      // Don't revalidate path - React Query handles cache updates
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to create folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder',
    };
  }
}

/**
 * Rename a folder
 */
export async function renameFolderAction(
  folderId: DatabaseId,
  newName: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const folderService = new FolderService();
    const result = await folderService.updateFolder(folderId, {
      name: newName,
    });

    if (result.success) {
      // Don't revalidate path - React Query handles cache updates
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to rename folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename folder',
    };
  }
}

/**
 * Delete a folder
 */
export async function deleteFolderAction(
  folderId: DatabaseId
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const folderService = new FolderService();
    const result = await folderService.deleteFolder(folderId);

    if (result.success) {
      // Don't revalidate path - React Query handles cache updates
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete folder',
    };
  }
}
