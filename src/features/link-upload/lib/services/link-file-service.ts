/**
 * Link File Service - Main facade for file upload and management operations
 * Delegates to specialized services for specific concerns
 */

import { db } from '@/lib/database/connection';
import { files, batches, links, users, folders } from '@/lib/database/schemas';
import { eq, and, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { createClient } from '@supabase/supabase-js';
import { FileService } from '@/features/files/lib/services/file-service';
import { StorageService } from '@/features/files/lib/services/storage-service';
import { generateUniqueFileName } from '@/lib/upload/utils/file-processing';
import type { FileTreeNode } from '../../types';

// Import specialized services
import { linkFileValidationService } from './link-file-validation-service';
import { linkFileOperationsService } from './link-file-operations-service';
import { linkFileMetadataService } from './link-file-metadata-service';

interface PreviousUpload {
  id: string;
  fileName: string;
  originalName: string | null;
  fileSize: number;
  mimeType: string;
  folderId: string | null;
  createdAt: string;
  uploaderName: string;
}

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

export class LinkFileService {
  private supabase: ReturnType<typeof createClient>;
  private validationService = linkFileValidationService;
  private operationsService = linkFileOperationsService;
  private metadataService = linkFileMetadataService;

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
    return this.operationsService.uploadFile(params);
  }

  /**
   * Get previous uploads for a link
   */
  async getPreviousUploads(
    linkId: string,
    limit?: number
  ): Promise<DatabaseResult<PreviousUpload[]>> {
    return this.metadataService.getPreviousUploads(linkId, limit);
  }

  /**
   * Track file download
   */
  async trackFileDownload(fileId: string): Promise<DatabaseResult<void>> {
    return this.operationsService.trackFileDownload(fileId);
  }

  /**
   * Upload a file to a public shared link with comprehensive validation
   */
  async uploadFileToLink(
    file: File,
    linkId: string,
    uploaderInfo: { name: string; email?: string; message?: string },
    folderId?: string,
    password?: string
  ): Promise<DatabaseResult<{
    fileId: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    quotaInfo?: any;
  }>> {
    try {
      // Validate the upload
      const validation = await this.validationService.validateUpload(
        file,
        linkId,
        uploaderInfo,
        password
      );

      if (!validation.isValid || !validation.link) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
        };
      }

      const link = validation.link;

      // Get link owner info for quota tracking
      const [linkOwner] = await db
        .select({
          id: users.id,
          storageUsed: users.storageUsed,
          storageLimit: users.storageLimit,
        })
        .from(users)
        .where(eq(users.id, link.userId))
        .limit(1);

      if (!linkOwner) {
        return {
          success: false,
          error: 'Link owner not found. Please contact support.',
        };
      }

      // Check storage quota
      const wouldExceedQuota = linkOwner.storageUsed + file.size > linkOwner.storageLimit;
      if (wouldExceedQuota) {
        const remainingMB = Math.round((linkOwner.storageLimit - linkOwner.storageUsed) / (1024 * 1024));
        return {
          success: false,
          error: `The link owner has insufficient storage space. Only ${remainingMB}MB remaining. Please contact the link owner.`,
        };
      }

      // Create batch and file records
      const batchId = crypto.randomUUID();
      const fileId = crypto.randomUUID();
      
      // Create batch record
      const [batch] = await db
        .insert(batches)
        .values({
          id: batchId,
          linkId,
          userId: link.userId,
          uploaderName: uploaderInfo.name,
          uploaderEmail: uploaderInfo.email,
          uploaderMessage: uploaderInfo.message,
          totalFiles: 1,
          processedFiles: 0,
          failedFiles: 0,
          totalSize: file.size,
          status: 'processing',
        })
        .returning();

      if (!batch) {
        return {
          success: false,
          error: 'Failed to create upload batch',
        };
      }

      // Generate unique file name
      const uniqueFileName = generateUniqueFileName(file.name);

      // Create file record
      const [fileRecord] = await db
        .insert(files)
        .values({
          id: fileId,
          batchId,
          linkId,
          userId: link.userId,
          workspaceId: link.workspaceId,
          fileName: uniqueFileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          folderId,
          status: 'pending',
        })
        .returning();

      if (!fileRecord) {
        return {
          success: false,
          error: 'Failed to create file record',
        };
      }

      // Upload the file
      const uploadResult = await this.operationsService.uploadFile({
        batchId,
        fileId,
        file,
        folderId,
      });

      if (!uploadResult.success) {
        // Clean up on failure
        await db.delete(files).where(eq(files.id, fileId));
        await db.delete(batches).where(eq(batches.id, batchId));
        return uploadResult as any;
      }

      // Update batch status
      await db
        .update(batches)
        .set({
          processedFiles: 1,
          status: 'completed',
          uploadCompletedAt: new Date(),
        })
        .where(eq(batches.id, batchId));

      // Update link statistics
      await db
        .update(links)
        .set({
          totalUploads: sql`${links.totalUploads} + 1`,
          totalFiles: sql`${links.totalFiles} + 1`,
          totalSize: sql`${links.totalSize} + ${file.size}`,
          storageUsed: sql`${links.storageUsed} + ${file.size}`,
          lastUploadAt: new Date(),
        })
        .where(eq(links.id, linkId));

      // Update user storage
      await db
        .update(users)
        .set({
          storageUsed: sql`${users.storageUsed} + ${file.size}`,
        })
        .where(eq(users.id, link.userId));

      return {
        success: true,
        data: {
          fileId,
          fileName: uniqueFileName,
          fileSize: file.size,
          uploadedAt: new Date(),
          quotaInfo: {
            storageUsed: linkOwner.storageUsed + file.size,
            storageLimit: linkOwner.storageLimit,
            percentageUsed: ((linkOwner.storageUsed + file.size) / linkOwner.storageLimit) * 100,
          },
        },
      };
    } catch (error) {
      console.error('Upload to link error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Fetch public files for display
   */
  async fetchPublicFiles(linkId: string): Promise<DatabaseResult<FileTreeNode[]>> {
    return this.metadataService.fetchPublicFiles(linkId);
  }

  /**
   * Generate signed URL for file download
   */
  async generateSignedUrl(
    storagePath: string,
    expiresIn?: number
  ): Promise<DatabaseResult<string>> {
    return this.operationsService.generateSignedUrl(storagePath, expiresIn);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(storagePath: string): Promise<DatabaseResult<void>> {
    return this.operationsService.deleteFile(storagePath);
  }

  /**
   * Get file statistics
   */
  async getFileStatistics(linkId: string) {
    return this.metadataService.getFileStatistics(linkId);
  }
}

export const linkFileService = new LinkFileService();