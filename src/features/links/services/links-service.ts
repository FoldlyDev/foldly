// Links Business Logic Service
// Handles business rules, validation, and complex operations

import type {
  UploadLink,
  CreateUploadLinkInput,
  UpdateUploadLinkInput,
} from '../types';
import type { LinkId, Result, ValidationError } from '@/types';

import type { LinksServiceInterface } from './types';
import { linksApiService } from './links-api-service';
import { FILE_UPLOAD_LIMITS } from '../constants/validation';

/**
 * Links Service Implementation
 * Handles business logic for links feature
 */
export class LinksService implements LinksServiceInterface {
  private readonly apiService = linksApiService;

  /**
   * Create link with comprehensive validation
   */
  async createLinkWithValidation(
    data: CreateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>> {
    // Validate input data
    const validation = this.validateLinkData(data);
    if (!validation.success) {
      return validation;
    }

    // Check slug availability if provided
    if (data.slug) {
      const isAvailable = await this.checkSlugAvailability(data.slug);
      if (!isAvailable) {
        return {
          success: false,
          error: 'Slug is already taken' as ValidationError,
        };
      }
    } else {
      // Generate unique slug from title
      data.slug = await this.generateUniqueSlug(data.title);
    } // Call API service
    return this.apiService.createLink(data);
  }

  /**
   * Update link with validation
   */
  async updateLinkWithValidation(
    id: LinkId,
    data: UpdateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>> {
    // Validate input data
    const validation = this.validateLinkData(data);
    if (!validation.success) {
      return validation;
    }

    // Check slug availability if being changed
    if (data.slug) {
      const isAvailable = await this.checkSlugAvailability(data.slug, id);
      if (!isAvailable) {
        return {
          success: false,
          error: 'Slug is already taken' as ValidationError,
        };
      }
    }

    return this.apiService.updateLink(id, data);
  }

  /**
   * Archive a link (soft delete)
   */
  async archiveLink(id: LinkId): Promise<Result<boolean, ValidationError>> {
    return this.apiService
      .updateLink(id, {
        isActive: false,
        archivedAt: new Date().toISOString(),
      })
      .then(result =>
        result.success
          ? { success: true, data: true }
          : { success: false, error: result.error }
      );
  } /**
   * Validate link data
   */
  validateLinkData(data: Partial<UploadLink>): Result<true, ValidationError> {
    const errors: string[] = [];

    // Required fields
    if (data.title && data.title.trim().length < 1) {
      errors.push('Title is required');
    }
    if (data.title && data.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    // Slug validation
    if (data.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(data.slug)) {
        errors.push(
          'Slug can only contain lowercase letters, numbers, and hyphens'
        );
      }
      if (data.slug.length > 50) {
        errors.push('Slug must be less than 50 characters');
      }
    }

    // File constraints - using centralized constants
    if (
      data.maxFiles !== undefined &&
      (data.maxFiles < FILE_UPLOAD_LIMITS.MIN_FILES ||
        data.maxFiles > FILE_UPLOAD_LIMITS.MAX_FILES)
    ) {
      errors.push(
        `Max files must be between ${FILE_UPLOAD_LIMITS.MIN_FILES} and ${FILE_UPLOAD_LIMITS.MAX_FILES}`
      );
    }
    if (
      data.maxFileSize !== undefined &&
      (data.maxFileSize < FILE_UPLOAD_LIMITS.MIN_FILE_SIZE ||
        data.maxFileSize > FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)
    ) {
      errors.push(
        `Max file size must be between ${Math.round(FILE_UPLOAD_LIMITS.MIN_FILE_SIZE / 1024)}KB and ${Math.round(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB`
      );
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; ') as ValidationError,
      };
    }

    return { success: true, data: true };
  } /**
   * Generate unique slug from title
   */
  async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 40);

    let slug = baseSlug;
    let counter = 1;

    while (!(await this.checkSlugAvailability(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(
    slug: string,
    excludeId?: LinkId
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/upload-links/check-slug?slug=${encodeURIComponent(slug)}&exclude=${excludeId || ''}`
      );
      const result = await response.json();
      return result.isAvailable;
    } catch {
      // If check fails, assume not available for safety
      return false;
    }
  }
}

// Export singleton instance
export const linksService = new LinksService();
