'use server';

// =============================================================================
// LINK FILE ACTIONS - Server actions for managing files shared via links
// =============================================================================
// 🎯 Purpose: Provide server-side delete operations for link file management
// 📦 Used by: LinkTree component and related UI components
// 🔧 Pattern: Server actions with ownership validation
// 
// NOTE: Link owners can only DELETE files/folders shared with them.
// They cannot rename or create new folders in their links.

import { db } from '@/lib/database/connection';
import { files, folders, links } from '@/lib/database/schemas';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { 
  ownershipValidator, 
  ResourceType,
  validateLinkOwnership 
} from '@/lib/services/auth/ownership-validation-service';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { logger } from '@/lib/services/logging/logger';
import type { ActionResult } from '@/features/files/types/file-operations';

// =============================================================================
// DELETE OPERATIONS - The only operations available for link owners
// =============================================================================

/**
 * Delete single file from a link
 * Validates ownership and removes from storage
 */
export async function deleteLinkFileAction(
  fileId: string,
  linkId: string
): Promise<ActionResult> {
  try {
    // Validate link ownership
    const linkValidation = await validateLinkOwnership(linkId);
    if (!linkValidation.authorized) {
      logger.warn('Unauthorized link file deletion attempt', { fileId, linkId });
      return { 
        success: false, 
        error: 'You do not have permission to delete files from this link' 
      };
    }

    // Verify file belongs to this link
    const file = await db.query.files.findFirst({
      where: and(
        eq(files.id, fileId),
        eq(files.linkId, linkId)
      ),
    });

    if (!file) {
      return { 
        success: false, 
        error: 'File not found or does not belong to this link' 
      };
    }

    // Delete from storage first
    if (file.storagePath) {
      try {
        const supabase = await createServerSupabaseClient();
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([file.storagePath]);

        if (storageError) {
          logger.error('Failed to delete file from storage', storageError, { fileId });
        }
      } catch (storageError) {
        logger.error('Storage deletion error', storageError, { fileId });
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));

    logger.info('Link file deleted successfully', { fileId, linkId });
    return { 
      success: true, 
      data: { deletedFileId: fileId } 
    };
  } catch (error) {
    logger.error('Failed to delete link file', error, { fileId, linkId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Delete multiple files from a link
 * Batch operation with storage cleanup
 */
export async function deleteLinkFilesAction(
  fileIds: string[],
  linkId: string
): Promise<ActionResult<{ deletedCount: number; failedIds: string[] }>> {
  try {
    if (fileIds.length === 0) {
      return { 
        success: true, 
        data: { deletedCount: 0, failedIds: [] } 
      };
    }

    // Validate link ownership
    const linkValidation = await validateLinkOwnership(linkId);
    if (!linkValidation.authorized) {
      logger.warn('Unauthorized batch link file deletion attempt', { fileIds, linkId });
      return { 
        success: false, 
        error: 'You do not have permission to delete files from this link' 
      };
    }

    // Fetch all files to verify they belong to this link
    const filesToDelete = await db.query.files.findMany({
      where: and(
        inArray(files.id, fileIds),
        eq(files.linkId, linkId)
      ),
    });

    if (filesToDelete.length === 0) {
      return { 
        success: false, 
        error: 'No valid files found to delete' 
      };
    }

    const deletedIds: string[] = [];
    const failedIds: string[] = [];
    const storagePaths: string[] = [];

    // Collect storage paths for batch deletion
    for (const file of filesToDelete) {
      if (file.storagePath) {
        storagePaths.push(file.storagePath);
      }
    }

    // Delete from storage in batch
    if (storagePaths.length > 0) {
      try {
        const supabase = await createServerSupabaseClient();
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(storagePaths);

        if (storageError) {
          logger.error('Failed to delete files from storage', storageError, { storagePaths });
        }
      } catch (storageError) {
        logger.error('Batch storage deletion error', storageError);
      }
    }

    // Delete from database
    const fileIdsToDelete = filesToDelete.map(f => f.id);
    await db.delete(files).where(inArray(files.id, fileIdsToDelete));
    
    deletedIds.push(...fileIdsToDelete);

    // Track any files that weren't found
    const notFoundIds = fileIds.filter(id => !fileIdsToDelete.includes(id));
    failedIds.push(...notFoundIds);

    logger.info('Batch link files deleted', { 
      deletedCount: deletedIds.length, 
      failedCount: failedIds.length,
      linkId 
    });

    return {
      success: true,
      data: {
        deletedCount: deletedIds.length,
        failedIds,
      },
    };
  } catch (error) {
    logger.error('Failed to delete link files', error, { fileIds, linkId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete files',
    };
  }
}

/**
 * Delete a folder and all its contents from a link
 * Recursively deletes subfolders and files
 */
export async function deleteLinkFolderAction(
  folderId: string,
  linkId: string
): Promise<ActionResult<{ deletedFiles: number; deletedFolders: number }>> {
  try {
    // Validate link ownership
    const linkValidation = await validateLinkOwnership(linkId);
    if (!linkValidation.authorized) {
      logger.warn('Unauthorized link folder deletion attempt', { folderId, linkId });
      return { 
        success: false, 
        error: 'You do not have permission to delete folders from this link' 
      };
    }

    // Verify folder belongs to this link
    const folder = await db.query.folders.findFirst({
      where: and(
        eq(folders.id, folderId),
        eq(folders.linkId, linkId)
      ),
    });

    if (!folder) {
      return { 
        success: false, 
        error: 'Folder not found or does not belong to this link' 
      };
    }

    // Get all descendant folders (recursive)
    const getAllDescendantFolders = async (parentId: string): Promise<string[]> => {
      const childFolders = await db.query.folders.findMany({
        where: and(
          eq(folders.parentFolderId, parentId),
          eq(folders.linkId, linkId)
        ),
      });

      const allFolderIds = childFolders.map(f => f.id);
      
      for (const child of childFolders) {
        const descendants = await getAllDescendantFolders(child.id);
        allFolderIds.push(...descendants);
      }

      return allFolderIds;
    };

    const descendantFolderIds = await getAllDescendantFolders(folderId);
    const allFolderIds = [folderId, ...descendantFolderIds];

    // Get all files in these folders
    const filesToDelete = await db.query.files.findMany({
      where: and(
        inArray(files.folderId, allFolderIds),
        eq(files.linkId, linkId)
      ),
    });

    // Delete files from storage
    const storagePaths = filesToDelete
      .map(f => f.storagePath)
      .filter((path): path is string => path !== null);

    if (storagePaths.length > 0) {
      try {
        const supabase = await createServerSupabaseClient();
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(storagePaths);

        if (storageError) {
          logger.error('Failed to delete folder files from storage', storageError);
        }
      } catch (storageError) {
        logger.error('Folder storage deletion error', storageError);
      }
    }

    // Delete files from database
    if (filesToDelete.length > 0) {
      await db.delete(files)
        .where(inArray(files.id, filesToDelete.map(f => f.id)));
    }

    // Delete all folders
    await db.delete(folders)
      .where(inArray(folders.id, allFolderIds));

    logger.info('Link folder deleted successfully', {
      folderId,
      linkId,
      deletedFiles: filesToDelete.length,
      deletedFolders: allFolderIds.length,
    });

    return {
      success: true,
      data: {
        deletedFiles: filesToDelete.length,
        deletedFolders: allFolderIds.length,
      },
    };
  } catch (error) {
    logger.error('Failed to delete link folder', error, { folderId, linkId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete folder',
    };
  }
}

/**
 * Batch delete mixed items (files and folders) from a link
 * Handles both file and folder deletions in a single operation
 */
export async function batchDeleteLinkItemsAction(
  itemIds: string[],
  linkId: string
): Promise<ActionResult<{ 
  deletedFiles: number; 
  deletedFolders: number; 
  failedItems: string[] 
}>> {
  try {
    if (itemIds.length === 0) {
      return {
        success: true,
        data: { deletedFiles: 0, deletedFolders: 0, failedItems: [] },
      };
    }

    // Validate link ownership
    const linkValidation = await validateLinkOwnership(linkId);
    if (!linkValidation.authorized) {
      logger.warn('Unauthorized batch link item deletion attempt', { itemIds, linkId });
      return { 
        success: false, 
        error: 'You do not have permission to delete items from this link' 
      };
    }

    // Separate files and folders
    const [linkFiles, linkFolders] = await Promise.all([
      db.query.files.findMany({
        where: and(
          inArray(files.id, itemIds),
          eq(files.linkId, linkId)
        ),
      }),
      db.query.folders.findMany({
        where: and(
          inArray(folders.id, itemIds),
          eq(folders.linkId, linkId)
        ),
      }),
    ]);

    let totalDeletedFiles = 0;
    let totalDeletedFolders = 0;
    const failedItems: string[] = [];

    // Delete folders (which will cascade delete their contents)
    for (const folder of linkFolders) {
      const result = await deleteLinkFolderAction(folder.id, linkId);
      if (result.success && result.data) {
        totalDeletedFiles += result.data.deletedFiles;
        totalDeletedFolders += result.data.deletedFolders;
      } else {
        failedItems.push(folder.id);
      }
    }

    // Delete individual files
    if (linkFiles.length > 0) {
      const fileIds = linkFiles.map(f => f.id);
      const result = await deleteLinkFilesAction(fileIds, linkId);
      if (result.success && result.data) {
        totalDeletedFiles += result.data.deletedCount;
        failedItems.push(...result.data.failedIds);
      } else {
        failedItems.push(...fileIds);
      }
    }

    // Track items that weren't found
    const foundIds = [
      ...linkFiles.map(f => f.id),
      ...linkFolders.map(f => f.id),
    ];
    const notFoundIds = itemIds.filter(id => !foundIds.includes(id));
    failedItems.push(...notFoundIds);

    logger.info('Batch link items deleted', {
      linkId,
      totalDeletedFiles,
      totalDeletedFolders,
      failedCount: failedItems.length,
    });

    return {
      success: true,
      data: {
        deletedFiles: totalDeletedFiles,
        deletedFolders: totalDeletedFolders,
        failedItems,
      },
    };
  } catch (error) {
    logger.error('Failed to batch delete link items', error, { itemIds, linkId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete items',
    };
  }
}