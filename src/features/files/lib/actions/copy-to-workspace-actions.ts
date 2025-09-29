'use server';

// =============================================================================
// COPY TO WORKSPACE ACTIONS - Server actions for copying link items to workspace
// =============================================================================
// 🎯 Purpose: Enable users to copy files/folders from their links to personal workspace
// 📦 Used by: WorkspacePanel and cross-tree drag handlers
// 🔧 Pattern: Server actions with ownership validation and storage operations
//
// NOTE: Users can copy files/folders FROM their links TO their workspace.
// This is a one-way operation - files cannot be copied from workspace to links.

import { db } from '@/lib/database/connection';
import { files, folders, workspaces } from '@/lib/database/schemas';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { validateLinkOwnership } from '@/lib/services/auth/ownership-validation-service';
import { FileService } from '@/lib/services/file-system/file-service';
import { StorageService } from '@/lib/services/storage/storage-operations-service';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { logger } from '@/lib/services/logging/logger';
import type { ActionResult } from '@/features/files/types/file-operations';

// =============================================================================
// TYPES
// =============================================================================

export interface CopyItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export interface CopyToWorkspaceResult {
  copiedFiles: number;
  copiedFolders: number;
  failedItems: string[];
}

// =============================================================================
// MAIN COPY ACTION
// =============================================================================

/**
 * Copy items (files and/or folders) from a link to the user's workspace
 * Validates ownership of both link and workspace before copying
 */
export async function copyLinkItemsToWorkspaceAction(
  items: CopyItem[],
  linkId: string,
  targetFolderId: string | null = null
): Promise<ActionResult<CopyToWorkspaceResult>> {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { 
        success: false, 
        error: 'You must be logged in to copy items to workspace' 
      };
    }

    // Validate link ownership
    const linkValidation = await validateLinkOwnership(linkId);
    if (!linkValidation.authorized) {
      logger.warn('Unauthorized copy attempt from link', { userId, linkId });
      return { 
        success: false, 
        error: 'You do not have permission to copy from this link' 
      };
    }

    // Get user's workspace
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.userId, userId),
    });

    if (!workspace) {
      logger.error('No workspace found for user', { userId });
      return { 
        success: false, 
        error: 'Workspace not found. Please contact support.' 
      };
    }

    // Validate target folder if specified
    if (targetFolderId) {
      const targetFolder = await db.query.folders.findFirst({
        where: and(
          eq(folders.id, targetFolderId),
          eq(folders.workspaceId, workspace.id)
        ),
      });

      if (!targetFolder) {
        return { 
          success: false, 
          error: 'Target folder not found or does not belong to your workspace' 
        };
      }
    }

    // Initialize services
    const supabase = await createServerSupabaseClient();
    const storageService = new StorageService(supabase);
    const fileService = new FileService();

    // Separate files and folders
    const fileItems = items.filter(item => item.type === 'file');
    const folderItems = items.filter(item => item.type === 'folder');

    let totalCopiedFiles = 0;
    let totalCopiedFolders = 0;
    const failedItems: string[] = [];

    // Copy folders (which will recursively copy their contents)
    for (const folderItem of folderItems) {
      // Verify folder belongs to this link
      const sourceFolder = await db.query.folders.findFirst({
        where: and(
          eq(folders.id, folderItem.id),
          eq(folders.linkId, linkId)
        ),
      });

      if (!sourceFolder) {
        failedItems.push(folderItem.id);
        logger.warn('Folder not found or does not belong to link', { 
          folderId: folderItem.id, 
          linkId 
        });
        continue;
      }

      const result = await fileService.copyFolderToWorkspace(
        folderItem.id,
        workspace.id,
        targetFolderId,
        storageService,
        userId
      );

      if (result.success && result.data) {
        totalCopiedFiles += result.data.copiedFiles;
        totalCopiedFolders += result.data.copiedFolders;
      } else {
        failedItems.push(folderItem.id);
        logger.error('Failed to copy folder', { 
          folderId: folderItem.id, 
          error: 'error' in result ? result.error : 'Unknown error'
        });
      }
    }

    // Copy individual files
    for (const fileItem of fileItems) {
      // Verify file belongs to this link
      const sourceFile = await db.query.files.findFirst({
        where: and(
          eq(files.id, fileItem.id),
          eq(files.linkId, linkId)
        ),
      });

      if (!sourceFile) {
        failedItems.push(fileItem.id);
        logger.warn('File not found or does not belong to link', { 
          fileId: fileItem.id, 
          linkId 
        });
        continue;
      }

      const result = await fileService.copyFileToWorkspace(
        fileItem.id,
        workspace.id,
        targetFolderId,
        storageService,
        userId
      );

      if (result.success) {
        totalCopiedFiles++;
      } else {
        failedItems.push(fileItem.id);
        logger.error('Failed to copy file', { 
          fileId: fileItem.id, 
          error: 'error' in result ? result.error : 'Unknown error'
        });
      }
    }

    // Check if anything was copied
    if (totalCopiedFiles === 0 && totalCopiedFolders === 0) {
      return {
        success: false,
        error: 'No items could be copied. Please check the items and try again.',
      };
    }

    logger.info('Items copied to workspace', {
      userId,
      linkId,
      workspaceId: workspace.id,
      targetFolderId,
      copiedFiles: totalCopiedFiles,
      copiedFolders: totalCopiedFolders,
      failedCount: failedItems.length,
    });

    return {
      success: true,
      data: {
        copiedFiles: totalCopiedFiles,
        copiedFolders: totalCopiedFolders,
        failedItems,
      },
    };
  } catch (error) {
    logger.error('Failed to copy items to workspace', error, { items, linkId, targetFolderId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy items to workspace',
    };
  }
}

// =============================================================================
// SINGLE ITEM COPY ACTIONS (Convenience Methods)
// =============================================================================

/**
 * Copy a single file from link to workspace
 * Convenience method that wraps the batch operation
 */
export async function copyLinkFileToWorkspaceAction(
  fileId: string,
  linkId: string,
  targetFolderId: string | null = null
): Promise<ActionResult<CopyToWorkspaceResult>> {
  const item: CopyItem = {
    id: fileId,
    name: '', // Name is not used in the action
    type: 'file',
  };

  return copyLinkItemsToWorkspaceAction([item], linkId, targetFolderId);
}

/**
 * Copy a single folder from link to workspace
 * Convenience method that wraps the batch operation
 */
export async function copyLinkFolderToWorkspaceAction(
  folderId: string,
  linkId: string,
  targetFolderId: string | null = null
): Promise<ActionResult<CopyToWorkspaceResult>> {
  const item: CopyItem = {
    id: folderId,
    name: '', // Name is not used in the action
    type: 'folder',
  };

  return copyLinkItemsToWorkspaceAction([item], linkId, targetFolderId);
}