/**
 * Link Upload Services - Modularized Services Index
 */

// =============================================================================
// INDIVIDUAL SERVICES - Focused responsibility services
// =============================================================================

export { LinkAccessService, linkAccessService } from './link-access-service';
export { LinkStorageService, linkStorageService } from './link-storage-service';
export { LinkBatchService, linkBatchService } from './link-batch-service';
export { LinkFileService, linkFileService } from './link-file-service';
export { LinkFolderService, linkFolderService } from './link-folder-service';
export { LinkTreeService, linkTreeService } from './link-tree-service';

// =============================================================================
// UNIFIED SERVICE - Main entry point for backward compatibility
// =============================================================================

import { linkAccessService } from './link-access-service';
import { linkStorageService } from './link-storage-service';
import { linkBatchService } from './link-batch-service';
import { linkFileService } from './link-file-service';
import { linkFolderService } from './link-folder-service';
import { linkTreeService } from './link-tree-service';
import { LinksDbService } from '@/features/links/lib/db-service';
import { canAcceptUploads, isLinkExpired } from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';

/**
 * Unified Link Upload Service - Combines all modular services
 * This provides backward compatibility while using the modular services internally
 */
export class LinkUploadService {
  // Access to individual services
  public readonly access = linkAccessService;
  public readonly storage = linkStorageService;
  public readonly batch = linkBatchService;
  public readonly file = linkFileService;
  public readonly folder = linkFolderService;
  public readonly tree = linkTreeService;

  // =============================================================================
  // UNIFIED METHODS - Delegate to appropriate services
  // =============================================================================

  /**
   * Validate link access based on slug parts
   */
  async validateLinkAccess(slugParts: string[]) {
    return this.access.validateLinkAccess(slugParts);
  }

  /**
   * Validate link password
   */
  async validateLinkPassword(linkId: string, password: string) {
    return this.access.validateLinkPassword(linkId, password);
  }

  /**
   * Check if user has enough storage space available
   */
  async checkStorageAvailable(userId: string, requiredSpace: number) {
    return this.storage.checkStorageAvailable(userId, requiredSpace);
  }

  /**
   * Create a new upload batch with file records
   */
  async createBatch(params: any) {
    return this.batch.createBatch(params);
  }

  /**
   * Complete a batch upload
   */
  async completeBatch(batchId: string) {
    return this.batch.completeBatch(batchId);
  }

  /**
   * Upload a file to storage and update database records
   */
  async uploadFile(params: any) {
    return this.file.uploadFile(params);
  }

  /**
   * Fetch previous uploads for a public link
   */
  async getPreviousUploads(linkId: string, currentUserId?: string | null) {
    const filesResult = await this.file.getPreviousUploads(linkId, currentUserId);
    const foldersResult = await this.folder.getPreviousFolders(linkId);

    if (!filesResult.success) return filesResult;
    if (!foldersResult.success) return foldersResult;

    return {
      success: true,
      data: {
        files: filesResult.data.files,
        folders: foldersResult.data.folders,
      },
    };
  }

  /**
   * Get link statistics
   */
  async getLinkStats(linkId: string) {
    return this.tree.getLinkStats(linkId);
  }

  /**
   * Track file download by incrementing download count
   */
  async trackFileDownload(fileId: string) {
    return this.file.trackFileDownload(fileId);
  }

  /**
   * Fetch link tree data for the tree component
   */
  async fetchLinkTree(linkId: string) {
    return this.tree.fetchLinkTree(linkId);
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
  ) {
    return this.folder.createLinkFolder(linkId, folderName, parentFolderId, batchId, sortOrder);
  }

  /**
   * Delete multiple items (files/folders) from a link
   */
  async batchDeleteLinkItems(linkId: string, itemIds: string[], supabaseClient: any) {
    return this.folder.batchDeleteLinkItems(linkId, itemIds, supabaseClient);
  }

  /**
   * Move items to a different folder within a link
   */
  async moveLinkItems(linkId: string, itemIds: string[], targetFolderId: string | null) {
    return this.folder.moveLinkItems(linkId, itemIds, targetFolderId);
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
  ) {
    return this.file.uploadFileToLink(file, linkId, uploaderInfo, folderId, password);
  }

  /**
   * Validate if a link can accept uploads (without actually uploading)
   */
  async validateLinkForUpload(
    linkId: string,
    password?: string
  ): Promise<DatabaseResult<{
    canUpload: boolean;
    requiresPassword: boolean;
    requiresEmail: boolean;
    maxFiles: number;
    maxFileSize: number;
    allowedFileTypes: string[] | null;
    remainingUploads: number;
    linkTitle: string;
    linkType: string;
  }>> {
    try {
      const linksService = new LinksDbService();
      const linkResult = await linksService.getById(linkId);

      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Upload link not found',
        };
      }

      const link = linkResult.data;
      const canUpload = canAcceptUploads(link);

      return {
        success: true,
        data: {
          canUpload,
          requiresPassword: link.requirePassword,
          requiresEmail: link.requireEmail,
          maxFiles: link.maxFiles,
          maxFileSize: link.maxFileSize,
          allowedFileTypes: link.allowedFileTypes,
          remainingUploads: Math.max(0, link.maxFiles - link.totalFiles),
          linkTitle: link.title,
          linkType: link.linkType,
        },
      };
    } catch (error) {
      console.error('Failed to validate link for upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Fetch public files for a link and organize them in a tree structure
   */
  async fetchPublicFiles(linkId: string) {
    return this.file.fetchPublicFiles(linkId);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export singleton instance for backward compatibility
export const linkUploadService = new LinkUploadService();

// Export the class for manual instantiation if needed
export default LinkUploadService;