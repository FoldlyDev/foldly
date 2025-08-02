/**
 * Link Batch Service - Handles batch upload operations
 */

import { db } from '@/lib/database/connection';
import { batches, links } from '@/lib/database/schemas';
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
  files: { id: string; fileName: string }[];
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

      // Use the link owner's userId for the batch
      const userId = link.userId;

      // We'll handle folder creation after batch is created, so we can pass the batchId
      let actualFolderId = params.folderId;
      let needToCreateFolder = false;
      
      if (params.folderId) {
        // Check if this is a virtual folder that needs to be created
        const folderResult = await this.folderService.getFolderById(params.folderId);
        
        if (!folderResult.success) {
          // Mark that we need to create the folder after batch creation
          needToCreateFolder = true;
          actualFolderId = null; // We'll update this after creating the folder with batchId
        }
      }

      // Calculate total size and file count
      const totalSize = params.files.reduce((sum, file) => sum + file.fileSize, 0);
      const totalFiles = params.files.length;

      // Create the batch record
      // For folder-only uploads (no files), set totalSize to 0 to avoid trigger issues
      const [batch] = await db
        .insert(batches)
        .values({
          linkId: params.linkId,
          userId: userId,
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

      // Now create the folder if needed, with the batchId
      if (needToCreateFolder && params.folderId) {
        const createResult = await this.folderService.createFolder({
          name: `Upload_${new Date().toISOString().split('T')[0]}`,
          parentFolderId: null,
          workspaceId: null,  // No workspace for link uploads
          linkId: params.linkId,
          userId: userId,
          path: `Upload_${new Date().toISOString().split('T')[0]}`,
          depth: 0,
          batchId: batch.id, // Now we have the batchId to associate with the folder
        });
        
        if (createResult.success && createResult.data) {
          actualFolderId = createResult.data.id;
        } else {
          // If folder creation fails, continue without folder
          console.warn('Failed to create folder for upload, continuing without folder');
          actualFolderId = null;
        }
      }

      // For this service, we'll only return the batch info
      // File creation will be handled by the file service
      return {
        success: true,
        data: {
          batchId: batch.id,
          files: [], // Files will be created separately
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