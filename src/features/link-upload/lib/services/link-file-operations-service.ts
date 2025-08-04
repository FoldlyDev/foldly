/**
 * Link File Operations Service - Handles file storage operations
 */

import { db } from '@/lib/database/connection';
import { files, batches } from '@/lib/database/schemas';
import { eq, and, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueFileName } from '@/lib/upload/utils/file-processing';

interface UploadFileParams {
  batchId: string;
  fileId: string;
  file: File;
  folderId?: string;
  sortOrder?: number;
}

interface FileUploadResult {
  id: string;
  path: string;
}

export class LinkFileOperationsService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Upload a file to storage and update database records
   */
  async uploadFile(
    params: UploadFileParams
  ): Promise<DatabaseResult<FileUploadResult>> {
    try {
      // Get the file record that was created during batch creation
      const [fileRecord] = await db
        .select()
        .from(files)
        .where(and(
          eq(files.id, params.fileId),
          eq(files.batchId, params.batchId)
        ))
        .limit(1);

      if (!fileRecord) {
        return {
          success: false,
          error: 'File record not found',
        };
      }

      // Get the batch to get the user ID (link owner)
      const [batch] = await db
        .select()
        .from(batches)
        .where(eq(batches.id, params.batchId))
        .limit(1);

      if (!batch) {
        return {
          success: false,
          error: 'Batch not found',
        };
      }

      const userId = batch.userId;

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${userId}/${fileRecord.linkId}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('user-uploads')
        .upload(storagePath, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return {
          success: false,
          error: `Failed to upload file: ${uploadError.message}`,
        };
      }

      // Update the file record with the storage path and status
      const [updatedFile] = await db
        .update(files)
        .set({
          storagePath,
          size: params.file.size,
          mimeType: params.file.type || 'application/octet-stream',
          folderId: params.folderId || fileRecord.folderId,
          sortOrder: params.sortOrder ?? fileRecord.sortOrder,
          status: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(files.id, params.fileId))
        .returning();

      if (!updatedFile) {
        // Try to clean up the uploaded file
        await this.supabase.storage
          .from('user-uploads')
          .remove([storagePath]);

        return {
          success: false,
          error: 'Failed to update file record',
        };
      }

      return {
        success: true,
        data: {
          id: updatedFile.id,
          path: storagePath,
        },
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.supabase.storage
        .from('user-uploads')
        .remove([storagePath]);

      if (error) {
        console.error('Storage deletion error:', error);
        return {
          success: false,
          error: `Failed to delete file: ${error.message}`,
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  /**
   * Generate a signed URL for file download
   */
  async generateSignedUrl(
    storagePath: string,
    expiresIn: number = 3600
  ): Promise<DatabaseResult<string>> {
    try {
      const { data, error } = await this.supabase.storage
        .from('user-uploads')
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.error('Signed URL generation error:', error);
        return {
          success: false,
          error: `Failed to generate download URL: ${error.message}`,
        };
      }

      if (!data?.signedUrl) {
        return {
          success: false,
          error: 'Failed to generate download URL',
        };
      }

      return {
        success: true,
        data: data.signedUrl,
      };
    } catch (error) {
      console.error('Signed URL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download URL',
      };
    }
  }

  /**
   * Copy files between folders
   */
  async copyFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<DatabaseResult<void>> {
    try {
      // Download the file
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from('user-uploads')
        .download(sourcePath);

      if (downloadError || !fileData) {
        return {
          success: false,
          error: `Failed to download source file: ${downloadError?.message}`,
        };
      }

      // Upload to new location
      const { error: uploadError } = await this.supabase.storage
        .from('user-uploads')
        .upload(destinationPath, fileData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          error: `Failed to copy file: ${uploadError.message}`,
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('File copy error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to copy file',
      };
    }
  }

  /**
   * Move files between folders
   */
  async moveFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<DatabaseResult<void>> {
    // First copy the file
    const copyResult = await this.copyFile(sourcePath, destinationPath);
    
    if (!copyResult.success) {
      return copyResult;
    }

    // Then delete the original
    return this.deleteFile(sourcePath);
  }

  /**
   * Track file download
   */
  async trackFileDownload(fileId: string): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(files)
        .set({
          downloadCount: sql`${files.downloadCount} + 1`,
          lastDownloadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Error tracking download:', error);
      return {
        success: false,
        error: 'Failed to track download',
      };
    }
  }

  /**
   * Get file storage info
   */
  async getFileInfo(fileId: string): Promise<DatabaseResult<any>> {
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      return {
        success: true,
        data: file,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return {
        success: false,
        error: 'Failed to get file info',
      };
    }
  }
}

export const linkFileOperationsService = new LinkFileOperationsService();