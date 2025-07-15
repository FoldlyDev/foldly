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
 * Create a new folder with uniqueness validation
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

    // Basic validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Folder name cannot be empty' };
    }
    if (trimmedName.length > 255) {
      return {
        success: false,
        error: 'Folder name is too long (max 255 characters)',
      };
    }
    if (/[<>:"/\\|?*]/.test(trimmedName)) {
      return {
        success: false,
        error: 'Folder name contains invalid characters',
      };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    const folderService = new FolderService();

    // Check for duplicate folder names in the same parent
    const existingFoldersResult = await folderService.getFoldersByParent(
      parentId || null,
      workspace.id
    );

    if (!existingFoldersResult.success) {
      return { success: false, error: 'Failed to check existing folders' };
    }

    // Check if folder name already exists
    const duplicateFolder = existingFoldersResult.data.find(
      folder => folder.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateFolder) {
      return {
        success: false,
        error: `A folder named "${trimmedName}" already exists in this location`,
      };
    }

    // Calculate proper path and depth
    let folderPath = trimmedName;
    let depth = 0;

    if (parentId) {
      const parentFolderResult = await folderService.getFolderById(parentId);
      if (!parentFolderResult.success) {
        return { success: false, error: 'Parent folder not found' };
      }

      const parentFolder = parentFolderResult.data;
      folderPath = `${parentFolder.path}/${trimmedName}`;
      depth = parentFolder.depth + 1;
    }

    const result = await folderService.createFolder({
      name: trimmedName,
      parentFolderId: parentId,
      workspaceId: workspace.id,
      userId,
      path: folderPath,
      depth,
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
