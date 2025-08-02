'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { linkUploadService } from '../services/link-upload-service';

/**
 * Create a new folder in a link
 */
export async function createLinkFolderAction(
  linkId: string,
  folderName: string,
  parentFolderId?: string
) {
  try {
    console.log('📁 createLinkFolderAction: Starting folder creation:', {
      linkId,
      folderName,
      parentFolderId,
    });

    // Use service to create folder
    const result = await linkUploadService.createLinkFolder(linkId, folderName, parentFolderId);

    if (!result.success) {
      console.error('❌ createLinkFolderAction: Service error:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }
    
    console.log('✅ createLinkFolderAction: Folder created successfully:', {
      linkId,
      folderId: result.data.id,
      folderName,
    });

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
    console.error('❌ createLinkFolderAction: Error creating folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder',
    };
  }
}

/**
 * Delete multiple items (files/folders) from a link
 */
export async function batchDeleteLinkItemsAction(
  linkId: string,
  itemIds: string[]
) {
  try {
    console.log('🗑️ batchDeleteLinkItemsAction: Starting batch delete:', {
      linkId,
      itemIds,
    });

    const supabaseClient = await createServerSupabaseClient();

    // Use service to delete items
    const result = await linkUploadService.batchDeleteLinkItems(linkId, itemIds, supabaseClient);

    if (!result.success) {
      console.error('❌ batchDeleteLinkItemsAction: Service error:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }
    
    console.log('✅ batchDeleteLinkItemsAction: Items deleted successfully:', {
      linkId,
      deletedFolders: result.data.deletedFolders,
      deletedFiles: result.data.deletedFiles,
      totalDeleted: result.data.deletedCount,
    });

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
    console.error('❌ batchDeleteLinkItemsAction: Error deleting items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete items',
    };
  }
}

/**
 * Move items to a different folder within a link
 */
export async function moveLinkItemsAction(
  linkId: string,
  itemIds: string[],
  targetFolderId: string | null
) {
  try {
    console.log('📦 moveLinkItemsAction: Starting item move:', {
      linkId,
      itemIds,
      targetFolderId,
    });

    // Use service to move items
    const result = await linkUploadService.moveLinkItems(linkId, itemIds, targetFolderId);

    if (!result.success) {
      console.error('❌ moveLinkItemsAction: Service error:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }
    
    console.log('✅ moveLinkItemsAction: Items moved successfully:', {
      linkId,
      movedFolders: result.data.movedFolders,
      movedFiles: result.data.movedFiles,
      totalMoved: result.data.movedCount,
      targetFolderId: result.data.targetFolderId,
    });

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
    console.error('❌ moveLinkItemsAction: Error moving items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move items',
    };
  }
}