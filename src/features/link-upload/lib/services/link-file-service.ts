/**
 * Link File Service - Main facade for file upload and management operations
 * Delegates to specialized services for specific concerns
 */

import { db } from '@/lib/database/connection';
import { files, batches, users, links } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { generateUniqueFileName } from '@/lib/upload/utils/file-processing';
import type { FileTreeNode } from '../../types';

// Import specialized services
import { linkFileValidationService } from './link-file-validation-service';
import { linkFileOperationsService } from './link-file-operations-service';
import { linkFileMetadataService } from './link-file-metadata-service';
import { BillingService } from '@/features/billing/lib/services';

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
  private validationService = linkFileValidationService;
  private operationsService = linkFileOperationsService;
  private metadataService = linkFileMetadataService;

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

      if (!validation.link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }
      
      const link = validation.link;

      // For generated links, ensure sourceFolderId exists
      if (link.linkType === 'generated' && !link.sourceFolderId) {
        return {
          success: false,
          error: 'Generated link is missing source folder information',
        };
      }

      // Get link owner info for quota tracking
      const [linkOwner] = await db
        .select({
          id: users.id,
          storageUsed: users.storageUsed,
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

      // Get user's storage limit from subscription
      const billingResult = await BillingService.getUserBillingData(link.userId);
      
      let storageLimit: number;
      if (!billingResult.success) {
        console.warn('Failed to get billing data, using free plan defaults:', billingResult.error);
        // Fallback to free plan defaults if billing service fails
        storageLimit = 50 * 1024 * 1024 * 1024; // 50GB in bytes
      } else {
        storageLimit = billingResult.data.storageLimit;
      }

      // Check storage quota
      const wouldExceedQuota = linkOwner.storageUsed + file.size > storageLimit;
      if (wouldExceedQuota) {
        const remainingMB = Math.round((storageLimit - linkOwner.storageUsed) / (1024 * 1024));
        return {
          success: false,
          error: `The link owner has insufficient storage space. Only ${remainingMB}MB remaining. Please contact the link owner.`,
        };
      }

      // Create batch and file records
      const batchId = crypto.randomUUID();
      const fileId = crypto.randomUUID();
      
      // For generated links, set targetFolderId to the source folder
      let targetFolderId: string | null = null;
      if (link.linkType === 'generated' && link.sourceFolderId) {
        targetFolderId = link.sourceFolderId;
      }

      // Create batch record
      const [batch] = await db
        .insert(batches)
        .values({
          id: batchId,
          linkId,
          targetFolderId,
          uploaderName: uploaderInfo.name,
          uploaderEmail: uploaderInfo.email,
          uploaderMessage: uploaderInfo.message,
          totalFiles: 1,
          processedFiles: 0,
          totalSize: file.size,
          status: 'uploading',
        })
        .returning();

      if (!batch) {
        return {
          success: false,
          error: 'Failed to create upload batch',
        };
      }

      // Generate unique file name
      const uniqueFileName = generateUniqueFileName(file.name, []);

      // Generate storage path
      const extension = file.name.split('.').pop() || '';
      const storagePath = `uploads/${linkId}/${fileId}${extension ? `.${extension}` : ''}`;

      // Create file record
      const [fileRecord] = await db
        .insert(files)
        .values({
          batchId,
          // For generated links, linkId should be null (files belong to workspace)
          linkId: link.linkType === 'generated' ? null : linkId,
          // For generated links, workspaceId should be set
          workspaceId: link.linkType === 'generated' ? link.workspaceId : null,
          fileName: uniqueFileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          extension: extension || null,
          folderId: link.linkType === 'generated' ? link.sourceFolderId : (folderId || null),
          storagePath,
        })
        .returning();

      if (!fileRecord) {
        return {
          success: false,
          error: 'Failed to create file record',
        };
      }

      // Upload the file
      const uploadParams: UploadFileParams = {
        batchId,
        fileId,
        file,
      };
      
      // Only add folderId if it's provided
      if (folderId) {
        uploadParams.folderId = folderId;
      }
      
      const uploadResult = await this.operationsService.uploadFile(uploadParams);

      if (!uploadResult.success) {
        // Clean up on failure
        await db.delete(files).where(eq(files.id, fileId));
        await db.delete(batches).where(eq(batches.id, batchId));
        return {
          success: false,
          error: uploadResult.error || 'Upload failed',
        };
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
            storageLimit: storageLimit,
            percentageUsed: ((linkOwner.storageUsed + file.size) / storageLimit) * 100,
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