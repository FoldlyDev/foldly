/**
 * Link File Validation Service - Handles file upload validation
 */

import { LinksDbService } from '@/features/links/lib/db-service';
import { canAcceptUploads, isLinkExpired } from '@/lib/database/types/links';
import {
  validateFile,
  type FileConstraints,
} from '@/lib/upload/utils/file-validation';
import type { Link, LinkWithStats } from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  link?: LinkWithStats;
}

export class LinkFileValidationService {
  private linksService: LinksDbService;

  constructor() {
    this.linksService = new LinksDbService();
  }

  /**
   * Validate link availability for uploads
   */
  async validateLinkAvailability(linkId: string): Promise<ValidationResult> {
    const linkResult = await this.linksService.getById(linkId);

    if (!linkResult.success || !linkResult.data) {
      return {
        isValid: false,
        error: 'Upload link not found. Please check the link and try again.',
      };
    }

    const link = linkResult.data;

    // Check if link can accept uploads (includes real-time expiration checking)
    if (!canAcceptUploads(link)) {
      if (isLinkExpired(link)) {
        return {
          isValid: false,
          error: 'This upload link has expired and can no longer accept files. Please contact the link owner for a new link.',
        };
      } else if (!link.isActive) {
        return {
          isValid: false,
          error: 'This upload link is currently disabled. Please contact the link owner.',
        };
      } else if (link.totalFiles >= link.maxFiles) {
        return {
          isValid: false,
          error: `This upload link has reached its maximum file limit (${link.maxFiles} files). No more files can be uploaded.`,
        };
      } else {
        return {
          isValid: false,
          error: 'This upload link cannot accept files at this time. Please try again later or contact the link owner.',
        };
      }
    }

    return {
      isValid: true,
      link,
    };
  }

  /**
   * Validate password requirement
   */
  validatePassword(link: Link | LinkWithStats, password?: string): ValidationResult {
    if (link.requirePassword) {
      if (!password) {
        return {
          isValid: false,
          error: 'This upload link requires a password. Please provide the password to continue.',
        };
      }
      // TODO: Implement password verification against link.passwordHash
      // This would involve bcrypt comparison or similar
    }
    return { isValid: true };
  }

  /**
   * Validate email requirement
   */
  validateEmail(link: Link | LinkWithStats, email?: string): ValidationResult {
    if (link.requireEmail && !email) {
      return {
        isValid: false,
        error: 'This upload link requires an email address. Please provide your email to continue.',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate file against link constraints
   */
  validateFileConstraints(file: File, link: Link | LinkWithStats): ValidationResult {
    const constraints: FileConstraints = {
      maxFileSize: link.maxFileSize,
      ...(link.allowedFileTypes && { allowedFileTypes: link.allowedFileTypes }),
    };

    const validationResult = validateFile(file, constraints);
    
    if (!validationResult.isValid) {
      const errors = validationResult.errors;
      const sizeError = errors.find(e => e.field === 'fileSize');
      
      if (sizeError) {
        const maxSizeMB = Math.round(link.maxFileSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return {
          isValid: false,
          error: `File too large. This file (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for this upload link.`,
        };
      }

      const typeError = errors.find(e => e.field === 'fileType');
      if (typeError) {
        const allowedExtensions = link.allowedFileTypes?.join(', ') || 'all';
        return {
          isValid: false,
          error: `File type not allowed. This upload link only accepts: ${allowedExtensions}`,
        };
      }

      return {
        isValid: false,
        error: errors.map(e => e.message).join(', '),
      };
    }

    return { isValid: true };
  }

  /**
   * Comprehensive validation for file upload to link
   */
  async validateUpload(
    file: File,
    linkId: string,
    uploaderInfo: { email?: string },
    password?: string
  ): Promise<ValidationResult> {
    // Validate link availability
    const linkValidation = await this.validateLinkAvailability(linkId);
    if (!linkValidation.isValid || !linkValidation.link) {
      return linkValidation;
    }

    const link = linkValidation.link;

    // Validate password
    const passwordValidation = this.validatePassword(link, password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    // Validate email
    const emailValidation = this.validateEmail(link, uploaderInfo.email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    // Validate file constraints
    const fileValidation = this.validateFileConstraints(file, link);
    if (!fileValidation.isValid) {
      return fileValidation;
    }

    return {
      isValid: true,
      link,
    };
  }

  /**
   * Validate storage quota
   */
  async validateStorageQuota(
    userId: string,
    fileSize: number
  ): Promise<DatabaseResult<boolean>> {
    // TODO: Implement storage quota validation
    // This would check user's storage limits from subscription
    return {
      success: true,
      data: true,
    };
  }
}

export const linkFileValidationService = new LinkFileValidationService();