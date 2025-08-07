/**
 * Link Batch Service - Handles batch upload operations
 */

import { db } from '@/lib/database/connection';
import { batches, links, files } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { success } from '@/lib/database/types/common';
import { FolderService } from '@/features/files/lib/services/folder-service';

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderName: string;
}

interface CreateBatchParams {
  linkId: string;
  files: FileData[];
  folderId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
}

interface BatchResponse {
  batchId: string;
  files: { fileName: string; fileSize: number; mimeType: string; sortOrder: number }[];
}

export class LinkBatchService {
  private folderService: FolderService;

  constructor() {
    this.folderService = new FolderService();
  }

  /**
   * Create a new upload batch with file records
   */
  async createBatch(
    params: CreateBatchParams
  ): Promise<DatabaseResult<BatchResponse>> {
    try {
      // Get the link to verify it exists and get the owner's userId
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, params.linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      // userId no longer needed - derive from link

      // Check if folder exists for link uploads
      let needToCreateFolder = false;
      
      if (params.folderId) {
        // Check if this is a virtual folder that needs to be created
        const folderResult = await this.folderService.getFolderById(params.folderId);
        
        if (!folderResult.success) {
          // Mark that we need to create the folder
          needToCreateFolder = true;
        }
      }

      // Calculate total size and file count
      const totalSize = params.files.reduce((sum, file) => sum + file.fileSize, 0);
      const totalFiles = params.files.length;

      // For generated links, we need to set targetFolderId
      // For base/custom links, targetFolderId should be null
      let targetFolderId: string | null = null;
      
      // Check if this is a generated link by checking if it has a sourceFolderId
      if (link.sourceFolderId && params.folderId) {
        targetFolderId = params.folderId;
      }

      // Create the batch record
      // For folder-only uploads (no files), set totalSize to 0 to avoid trigger issues
      const [batch] = await db
        .insert(batches)
        .values({
          linkId: params.linkId,
          targetFolderId: targetFolderId, // For generated links: the workspace folder to upload to
          uploaderName: params.uploaderName || params.files[0]?.uploaderName || 'Anonymous',
          uploaderEmail: params.uploaderEmail,
          uploaderMessage: params.uploaderMessage,
          totalFiles: totalFiles,
          totalSize: totalSize || 0, // Ensure it's 0 for empty batches, not null
          status: totalFiles === 0 ? 'completed' : 'uploading', // Mark as completed if no files
          processedFiles: 0,
        })
        .returning({ id: batches.id });

      if (!batch) {
        return {
          success: false,
          error: 'Failed to create batch',
        };
      }

      // Create folder if needed for link uploads (not for generated links)
      if (needToCreateFolder && params.folderId && !link.sourceFolderId) {
        const createResult = await this.folderService.createFolder({
          name: `Upload_${new Date().toISOString().split('T')[0]}`,
          parentFolderId: null,
          workspaceId: null,  // No workspace for link uploads
          linkId: params.linkId,
          path: `Upload_${new Date().toISOString().split('T')[0]}`,
          depth: 0
        });
        
        if (createResult.success && createResult.data) {
          // Update the batch with the created folder ID if it's a generated link
          if (link.sourceFolderId) {
            await db
              .update(batches)
              .set({ targetFolderId: createResult.data.id })
              .where(eq(batches.id, batch.id));
          }
        } else {
          // If folder creation fails, continue without folder
          console.warn('Failed to create folder for upload, continuing without folder');
        }
      }

      // Return batch info with file metadata for later processing
      // Files will be created when they're actually uploaded with storage paths
      const fileMetadata = params.files.map((file, index) => ({
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        sortOrder: index,
      }));

      return {
        success: true,
        data: {
          batchId: batch.id,
          files: fileMetadata,
        },
      };
    } catch (error) {
      console.error('Error creating batch:', error);
      return {
        success: false,
        error: 'Failed to create upload batch',
      };
    }
  }

  /**
   * Complete a batch upload
   */
  async completeBatch(batchId: string): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(batches)
        .set({
          status: 'completed',
          uploadCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(batches.id, batchId));

      return success(undefined);
    } catch (error) {
      console.error('Error completing batch:', error);
      return {
        success: false,
        error: 'Failed to complete batch',
      };
    }
  }
}

// Export singleton instance
export const linkBatchService = new LinkBatchService();