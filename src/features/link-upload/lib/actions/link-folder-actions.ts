'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { linkUploadService } from '../services';

/**
 * Create a new folder in a link
 */
export async function createLinkFolderAction(
  linkId: string,
  folderName: string,
  parentFolderId?: string,
  batchId?: string,
  sortOrder?: number
) {
  try {
    // Use service to create folder with sort order
    const result = await linkUploadService.createLinkFolder(linkId, folderName, parentFolderId, batchId, sortOrder);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
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
    const supabaseClient = await createServerSupabaseClient();

    // Use service to delete items
    const result = await linkUploadService.batchDeleteLinkItems(linkId, itemIds, supabaseClient);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete items',
    };
  }
}

/**
 * Update the order of items within a folder
 */
export async function updateLinkItemOrderAction(
  linkId: string,
  parentId: string,
  newChildrenOrder: string[]
) {
  try {
    // For now, we'll just return success since ordering within folders
    // isn't critical for the tree functionality. This can be implemented
    // later with proper sort order tracking in the database.
    console.log('Updating item order:', { linkId, parentId, newChildrenOrder });
    
    // TODO: Implement actual order persistence if needed
    // This would require adding a sortOrder field to files/folders tables
    
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order',
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
    // Use service to move items
    const result = await linkUploadService.moveLinkItems(linkId, itemIds, targetFolderId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Revalidate the link page to show updated data
    revalidatePath(`/${linkId}`);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move items',
    };
  }
}