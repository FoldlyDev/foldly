/**
 * Link Folder Service - Handles folder operations for link uploads
 */

import { db } from '@/lib/database/connection';
import { folders, links, files } from '@/lib/database/schemas';
import { eq, and, sql, inArray } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { FolderService } from '@/features/files/lib/services/folder-service';
import { StorageService } from '@/features/files/lib/services/storage-service';
import { createClient } from '@supabase/supabase-js';

interface PreviousFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export class LinkFolderService {
  private folderService: FolderService;

  constructor() {
    this.folderService = new FolderService();
  }

  /**
   * Fetch previous folders for a public link
   */
  async getPreviousFolders(linkId: string): Promise<DatabaseResult<{ folders: PreviousFolder[] }>> {
    try {
      // Fetch all folders for this link
      const foldersResult = await db
        .select()
        .from(folders)
        .where(eq(folders.linkId, linkId))
        .orderBy(folders.path);

      // Transform to a simpler format for the UI
      const transformedFolders: PreviousFolder[] = (foldersResult || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentFolderId,
        createdAt: folder.createdAt ? folder.createdAt.toISOString() : new Date().toISOString(),
      }));

      return {
        success: true,
        data: {
          folders: transformedFolders,
        },
      };
    } catch (error) {
      console.error('Error fetching previous folders from service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch previous folders',
      };
    }
  }

  /**
   * Create a new folder in a link with sort order support
   */
  async createLinkFolder(
    linkId: string,
    folderName: string,
    parentFolderId?: string,
    batchId?: string,
    sortOrder?: number
  ): Promise<DatabaseResult<{
    id: string;
    name: string;
    parentId?: string;
    linkId: string;
    createdAt: Date;
    folderId?: string;
  }>> {
    try {
      // Get the link to verify it exists and get the owner's userId
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      // Use the link owner's userId
      const userId = link.userId;

      // Calculate proper path and depth
      let folderPath = folderName;
      let depth = 0;

      if (parentFolderId) {
        const parentFolderResult = await this.folderService.getFolderById(parentFolderId);
        if (!parentFolderResult.success || !parentFolderResult.data) {
          return { 
            success: false, 
            error: 'Parent folder not found' 
          };
        }

        const parentFolder = parentFolderResult.data;
        folderPath = `${parentFolder.path}/${folderName}`;
        depth = parentFolder.depth + 1;
      }

      // Create the actual folder in the database with sort order
      // For link uploads, folders belong to the link, NOT a workspace
      const result = await this.folderService.createFolder({
        name: folderName,
        parentFolderId: parentFolderId || null,
        workspaceId: null,  // No workspace for link-upload folders
        linkId: linkId,     // Associate with the link ONLY
        userId: userId,
        path: folderPath,
        depth: depth,
        batchId: batchId || null, // Track which batch created this folder
        sortOrder: sortOrder ?? 0, // Use provided sort order or default to 0
      });

      if (!result.success || !result.data) {
        console.error('Failed to create folder:', result.error);
        return {
          success: false,
          error: 'Failed to create folder',
        };
      }

      const folderData: {
        id: string;
        name: string;
        parentId?: string;
        linkId: string;
        createdAt: Date;
        folderId?: string;
      } = {
        id: result.data.id,
        name: result.data.name,
        linkId: result.data.linkId || linkId,
        createdAt: result.data.createdAt,
      };
      
      if (result.data.parentFolderId) {
        folderData.parentId = result.data.parentFolderId;
      }
      
      if (result.data.id) {
        folderData.folderId = result.data.id;
      }

      return {
        success: true,
        data: folderData,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      };
    }
  }

  /**
   * Delete multiple items (files/folders) from a link
   */
  async batchDeleteLinkItems(
    linkId: string,
    itemIds: string[],
    supabaseClient: ReturnType<typeof createClient>
  ): Promise<DatabaseResult<{
    deletedItems: string[];
    deletedCount: number;
    deletedFolders: number;
    deletedFiles: number;
  }>> {
    try {
      // Get the link to verify it exists
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const storageService = new StorageService(supabaseClient);
      let deletedFolders = 0;
      let deletedFiles = 0;

      // Separate folder and file IDs
      const folderIds = itemIds.filter(id => id.startsWith('folder-') || !id.includes('.'));
      const fileIds = itemIds.filter(id => !folderIds.includes(id));

      // Delete folders (which will cascade delete their contents)
      for (const folderId of folderIds) {
        const result = await this.folderService.deleteFolderWithStorage(folderId, storageService);
        if (result.success) {
          deletedFolders++;
        }
      }

      // Delete individual files
      if (fileIds.length > 0) {
        // Get file details for storage deletion
        const filesToDelete = await db
          .select()
          .from(files)
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        // Delete from storage
        for (const file of filesToDelete) {
          if (file.storagePath) {
            await storageService.deleteFile(file.storagePath);
          }
        }

        // Delete from database
        await db
          .delete(files)
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        deletedFiles = fileIds.length;
      }

      return {
        success: true,
        data: {
          deletedItems: itemIds,
          deletedCount: deletedFolders + deletedFiles,
          deletedFolders,
          deletedFiles,
        },
      };
    } catch (error) {
      console.error('Error deleting items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete items',
      };
    }
  }

  /**
   * Move items to a different folder within a link
   */
  async moveLinkItems(
    linkId: string,
    itemIds: string[],
    targetFolderId: string | null
  ): Promise<DatabaseResult<{
    movedItems: string[];
    movedCount: number;
    movedFolders: number;
    movedFiles: number;
    targetFolderId: string | null;
  }>> {
    try {
      // Get the link to verify it exists
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      let movedFolders = 0;
      let movedFiles = 0;

      // Validate target folder if provided
      if (targetFolderId) {
        const targetFolderResult = await this.folderService.getFolderById(targetFolderId);
        if (!targetFolderResult.success || targetFolderResult.data?.linkId !== linkId) {
          return {
            success: false,
            error: 'Invalid target folder',
          };
        }
      }

      // Separate folder and file IDs
      const folderIds = itemIds.filter(id => id.startsWith('folder-') || !id.includes('.'));
      const fileIds = itemIds.filter(id => !folderIds.includes(id));

      // Move folders
      for (const folderId of folderIds) {
        // Update folder's parent
        const result = await this.folderService.updateFolder(folderId, {
          parentFolderId: targetFolderId,
        });
        
        if (result.success) {
          movedFolders++;
          
          // Update the path for the folder and all its descendants
          const folderResult = await this.folderService.getFolderById(folderId);
          if (folderResult.success && folderResult.data) {
            let newPath = folderResult.data.name;
            let newDepth = 0;
            
            if (targetFolderId) {
              const parentResult = await this.folderService.getFolderById(targetFolderId);
              if (parentResult.success && parentResult.data) {
                newPath = `${parentResult.data.path}/${folderResult.data.name}`;
                newDepth = parentResult.data.depth + 1;
              }
            }
            
            // Update the folder's path and depth
            await this.folderService.updateFolder(folderId, {
              path: newPath,
              depth: newDepth,
            });
          }
        }
      }

      // Move files
      if (fileIds.length > 0) {
        await db
          .update(files)
          .set({ folderId: targetFolderId })
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        movedFiles = fileIds.length;
      }

      return {
        success: true,
        data: {
          movedItems: itemIds,
          movedCount: movedFolders + movedFiles,
          movedFolders,
          movedFiles,
          targetFolderId,
        },
      };
    } catch (error) {
      console.error('Error moving items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move items',
      };
    }
  }
}

// Export singleton instance
export const linkFolderService = new LinkFolderService();