import { LinksDbService } from '@/features/links/lib/db-service';
import {
  canAcceptUploads,
  isLinkExpired,
  isLinkNearExpiry,
} from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import type { Link } from '@/lib/database/types/links';

// =============================================================================
// TYPES
// =============================================================================

export interface LinkUploadValidation {
  canUpload: boolean;
  errors: string[];
  warnings: string[];
  link: {
    id: string;
    title: string;
    linkType: string;
    requiresPassword: boolean;
    requiresEmail: boolean;
    maxFiles: number;
    maxFileSize: number;
    allowedFileTypes: string[] | null;
    remainingUploads: number;
    isExpired: boolean;
    isNearExpiry: boolean;
    expiresAt: Date | null;
  };
}

export interface FileUploadValidation {
  canUpload: boolean;
  errors: string[];
  warnings: string[];
  file: {
    name: string;
    size: number;
    type: string;
    isAllowedType: boolean;
    exceedsMaxSize: boolean;
  };
}

// =============================================================================
// LINK VALIDATION SERVICE - Real-Time Upload Validation
// =============================================================================

/**
 * Service for validating links and files for upload operations
 * Provides comprehensive real-time validation including expiration checking
 */
export class LinkUploadValidationService {
  private linksService: LinksDbService;

  constructor() {
    this.linksService = new LinksDbService();
  }

  /**
   * Validate if a link can accept uploads with detailed error reporting
   */
  async validateLinkForUpload(
    linkId: string,
    password?: string
  ): Promise<DatabaseResult<LinkUploadValidation>> {
    try {
      // Get link data
      const linkResult = await this.linksService.getById(linkId);

      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Upload link not found',
        };
      }

      const link = linkResult.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if link can accept uploads (includes expiration)
      const canUpload = canAcceptUploads(link);

      // Determine specific validation errors
      if (!canUpload) {
        if (isLinkExpired(link)) {
          errors.push(
            'This upload link has expired and can no longer accept files.'
          );
        } else if (!link.isActive) {
          errors.push('This upload link is currently disabled.');
        } else if (link.totalFiles >= link.maxFiles) {
          errors.push(
            `This upload link has reached its maximum file limit (${link.maxFiles} files).`
          );
        } else {
          errors.push('This upload link cannot accept files at this time.');
        }
      }

      // Check for warnings
      if (isLinkNearExpiry(link)) {
        const expiryDate = link.expiresAt?.toLocaleDateString();
        warnings.push(`This upload link will expire on ${expiryDate}.`);
      }

      if (link.totalFiles > link.maxFiles * 0.8) {
        const remaining = link.maxFiles - link.totalFiles;
        warnings.push(
          `This upload link is near its file limit. Only ${remaining} more files can be uploaded.`
        );
      }

      // Password validation
      if (link.requirePassword && !password) {
        errors.push('This upload link requires a password.');
      }

      // TODO: Add actual password hash verification when implemented
      // if (link.requirePassword && password && !this.verifyPassword(password, link.passwordHash)) {
      //   errors.push('Invalid password provided.');
      // }

      return {
        success: true,
        data: {
          canUpload: errors.length === 0,
          errors,
          warnings,
          link: {
            id: link.id,
            title: link.title,
            linkType: link.linkType,
            requiresPassword: link.requirePassword,
            requiresEmail: link.requireEmail,
            maxFiles: link.maxFiles,
            maxFileSize: link.maxFileSize,
            allowedFileTypes: link.allowedFileTypes,
            remainingUploads: Math.max(0, link.maxFiles - link.totalFiles),
            isExpired: isLinkExpired(link),
            isNearExpiry: isLinkNearExpiry(link),
            expiresAt: link.expiresAt,
          },
        },
      };
    } catch (error) {
      console.error('Failed to validate link for upload:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Link validation failed',
      };
    }
  }

  /**
   * Validate a specific file against link constraints
   */
  async validateFileForUpload(
    file: File,
    linkId: string
  ): Promise<DatabaseResult<FileUploadValidation>> {
    try {
      // First validate the link
      const linkValidation = await this.validateLinkForUpload(linkId);

      if (!linkValidation.success) {
        return linkValidation as any;
      }

      const { link } = linkValidation.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // File size validation
      const exceedsMaxSize = file.size > link.maxFileSize;
      if (exceedsMaxSize) {
        const maxSizeMB = Math.round(link.maxFileSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        errors.push(
          `File too large. This file (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit.`
        );
      }

      // File type validation
      let isAllowedType = true;
      if (link.allowedFileTypes && link.allowedFileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type.toLowerCase();

        isAllowedType = link.allowedFileTypes.some(allowedType => {
          return (
            mimeType.includes(allowedType.toLowerCase()) ||
            (fileExtension && allowedType.toLowerCase().includes(fileExtension))
          );
        });

        if (!isAllowedType) {
          errors.push(
            `File type not allowed. This upload link only accepts: ${link.allowedFileTypes.join(', ')}`
          );
        }
      }

      // File name validation
      if (file.name.length > 255) {
        errors.push(
          'File name is too long. Please rename the file to be under 255 characters.'
        );
      }

      if (!/^[^<>:"/\\|?*]+$/.test(file.name)) {
        warnings.push(
          'File name contains special characters that may cause issues.'
        );
      }

      // Size warnings
      if (file.size > 100 * 1024 * 1024) {
        // 100MB
        warnings.push('This is a large file and may take some time to upload.');
      }

      return {
        success: true,
        data: {
          canUpload: errors.length === 0,
          errors,
          warnings,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            isAllowedType,
            exceedsMaxSize,
          },
        },
      };
    } catch (error) {
      console.error('Failed to validate file for upload:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'File validation failed',
      };
    }
  }

  /**
   * Validate multiple files for batch upload
   */
  async validateFilesForUpload(
    files: File[],
    linkId: string
  ): Promise<
    DatabaseResult<{
      canUploadAny: boolean;
      canUploadAll: boolean;
      totalFiles: number;
      totalSize: number;
      validFiles: File[];
      invalidFiles: Array<{ file: File; errors: string[] }>;
      globalErrors: string[];
      globalWarnings: string[];
    }>
  > {
    try {
      // First validate the link
      const linkValidation = await this.validateLinkForUpload(linkId);

      if (!linkValidation.success) {
        return linkValidation as any;
      }

      const { link } = linkValidation.data;
      const globalErrors: string[] = [];
      const globalWarnings: string[] = [];
      const validFiles: File[] = [];
      const invalidFiles: Array<{ file: File; errors: string[] }> = [];

      // Check if total files would exceed limit
      const totalFilesAfterUpload =
        link.maxFiles - link.remainingUploads + files.length;
      if (totalFilesAfterUpload > link.maxFiles) {
        const allowedCount = link.remainingUploads;
        globalErrors.push(
          `Too many files. This upload link can only accept ${allowedCount} more files.`
        );
      }

      // Check total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > link.maxFileSize * files.length) {
        const maxTotalMB = Math.round(
          (link.maxFileSize * files.length) / (1024 * 1024)
        );
        const totalSizeMB = Math.round(totalSize / (1024 * 1024));
        globalWarnings.push(
          `Large batch upload (${totalSizeMB}MB). Individual file limit is enforced per file.`
        );
      }

      // Validate each file individually
      for (const file of files) {
        const fileValidation = await this.validateFileForUpload(file, linkId);

        if (fileValidation.success && fileValidation.data.canUpload) {
          validFiles.push(file);
        } else if (fileValidation.success) {
          invalidFiles.push({
            file,
            errors: fileValidation.data.errors,
          });
        } else {
          invalidFiles.push({
            file,
            errors: [fileValidation.error || 'Validation failed'],
          });
        }
      }

      return {
        success: true,
        data: {
          canUploadAny: validFiles.length > 0 && globalErrors.length === 0,
          canUploadAll: invalidFiles.length === 0 && globalErrors.length === 0,
          totalFiles: files.length,
          totalSize,
          validFiles,
          invalidFiles,
          globalErrors,
          globalWarnings,
        },
      };
    } catch (error) {
      console.error('Failed to validate files for upload:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Batch validation failed',
      };
    }
  }

  /**
   * Get upload link status for real-time monitoring
   */
  async getLinkStatus(linkId: string): Promise<
    DatabaseResult<{
      isActive: boolean;
      isExpired: boolean;
      isNearExpiry: boolean;
      canAcceptUploads: boolean;
      remainingUploads: number;
      storageUsedPercentage: number;
      lastUploadAt: Date | null;
      expiresAt: Date | null;
    }>
  > {
    try {
      const linkResult = await this.linksService.getById(linkId);

      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const link = linkResult.data;
      const storageUsedPercentage =
        link.storageLimit > 0
          ? (link.storageUsed / link.storageLimit) * 100
          : 0;

      return {
        success: true,
        data: {
          isActive: link.isActive,
          isExpired: isLinkExpired(link),
          isNearExpiry: isLinkNearExpiry(link),
          canAcceptUploads: canAcceptUploads(link),
          remainingUploads: Math.max(0, link.maxFiles - link.totalFiles),
          storageUsedPercentage,
          lastUploadAt: link.lastUploadAt,
          expiresAt: link.expiresAt,
        },
      };
    } catch (error) {
      console.error('Failed to get link status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  /**
   * Check if link will accept uploads after a specific date (future planning)
   */
  willLinkAcceptUploadsAt(link: Link, checkDate: Date): boolean {
    // Check if link would be expired at the given date
    if (link.expiresAt && checkDate > link.expiresAt) {
      return false;
    }

    // Check other conditions (these don't change over time)
    if (!link.isActive) return false;
    if (link.totalFiles >= link.maxFiles) return false;

    return true;
  }

  /**
   * Calculate when link will expire or become unavailable
   */
  getUploadAvailabilityWindow(link: Link): {
    availableUntil: Date | null;
    reason: 'expiration' | 'file_limit' | 'disabled' | 'available';
  } {
    if (!link.isActive) {
      return { availableUntil: null, reason: 'disabled' };
    }

    if (link.totalFiles >= link.maxFiles) {
      return { availableUntil: null, reason: 'file_limit' };
    }

    if (link.expiresAt) {
      return { availableUntil: link.expiresAt, reason: 'expiration' };
    }

    return { availableUntil: null, reason: 'available' };
  }
}

// Export singleton instance
export const linkUploadValidationService = new LinkUploadValidationService();
