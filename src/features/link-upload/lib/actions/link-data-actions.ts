'use server';

import { linkUploadService } from '../services/link-upload-service';
import { linksDbService } from '@/features/links/lib/db-service';
import { logger } from '@/lib/services/logging/logger';
import type { LinkWithStats } from '@/lib/database/types/links';

/**
 * Action result type for server actions
 */
export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Fetch link data by slug (public access - no auth required)
 * Thin wrapper around the service method
 * 
 * @param slug - The base slug for the link
 * @param topic - Required for custom/generated links, must be null/undefined for base links
 */
export async function fetchLinkBySlugAction(
  slug: string,
  topic?: string
): Promise<ActionResult<LinkWithStats | null>> {
  try {
    // Use the existing links service which returns LinkWithStats
    // Pass null explicitly when no topic to match database schema
    const result = await linksDbService.getBySlugAndTopic(slug, topic ?? null);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch link',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    logger.error('Failed to fetch link by slug', error, { slug, topic });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch link',
    };
  }
}

/**
 * Fetch link tree data (folders and files) for display
 * Includes owner check to determine if redirect should be shown
 */
export async function fetchLinkTreeDataAction(
  linkId: string
): Promise<ActionResult> {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    
    const result = await linkUploadService.getLinkTreeData(linkId);

    if (!result.success) {
      logger.error('Failed to fetch link tree data', undefined, {
        linkId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error || 'Failed to fetch link data',
      };
    }

    // Check if the current user is the owner
    const { userId } = await auth();
    let isOwner = false;
    
    if (userId && result.data?.link) {
      isOwner = result.data.link.userId === userId;
    }

    return {
      success: true,
      data: {
        ...result.data,
        isOwner,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch link tree data', error, { linkId });
    return {
      success: false,
      error: 'Failed to fetch link data',
    };
  }
}

/**
 * Validate link password (for password-protected links)
 * Thin wrapper around the service method
 */
export async function validateLinkPasswordAction(
  linkId: string,
  password: string
): Promise<ActionResult<boolean>> {
  try {
    const result = await linkUploadService.validateLinkPassword(linkId, password);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to validate password',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    logger.error('Failed to validate link password', error, { linkId });
    return {
      success: false,
      error: 'Failed to validate password',
    };
  }
}

/**
 * Validate a link for upload operations
 * Uses existing link data fetching and centralized quota checking
 */
export async function validateLinkUploadAction(params: {
  linkId: string;
  fileSize: number;
  password?: string;
}): Promise<ActionResult<{
  canUpload: boolean;
  errors: string[];
  warnings: string[];
}>> {
  try {
    const { linkId, fileSize, password } = params;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Use existing action to get link tree data which includes the link with owner info
    const linkDataResult = await fetchLinkTreeDataAction(linkId);
    
    if (!linkDataResult.success || !linkDataResult.data?.link) {
      return {
        success: false,
        error: 'Link not found',
        data: {
          canUpload: false,
          errors: ['Link not found'],
          warnings: [],
        },
      };
    }

    const link = linkDataResult.data.link;

    // Check if link is active
    if (!link.isActive) {
      errors.push('This link is disabled');
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      errors.push('This link has expired');
    }

    // Validate password if required
    if (link.requirePassword && password) {
      const passwordResult = await validateLinkPasswordAction(linkId, password);
      if (!passwordResult.success || !passwordResult.data) {
        errors.push('Invalid password');
      }
    } else if (link.requirePassword && !password) {
      errors.push('Password is required for this link');
    }

    // Check link's own storage limit
    if (link.storageLimit && link.totalStorageUsed + fileSize > link.storageLimit) {
      errors.push(`This link has reached its storage limit (${Math.round(link.storageLimit / (1024 * 1024))}MB)`);
    }

    // Check the link owner's quota using centralized service
    if (link.userId && errors.length === 0) {
      const { StorageQuotaService } = await import('@/lib/services/storage/storage-quota-service');
      
      const quotaService = new StorageQuotaService();
      
      // Check quota using the link owner's userId
      const quotaCheck = await quotaService.checkUserQuota(link.userId, fileSize);
      
      if (!quotaCheck.success) {
        const quotaMessage = 'error' in quotaCheck ? quotaCheck.error : 'Storage quota exceeded';
        errors.push(quotaMessage);
      } else if (!quotaCheck.data.allowed) {
        const quotaMessage = quotaCheck.data.message || 'Storage quota exceeded';
        errors.push(quotaMessage);
      } else if (quotaCheck.data.usagePercentage >= 80) {
        warnings.push(`Storage usage is at ${Math.round(quotaCheck.data.usagePercentage)}%`);
      }
    }

    // Add warning if close to link storage limit
    if (link.storageLimit) {
      const usageAfterUpload = link.totalStorageUsed + fileSize;
      const usagePercentage = (usageAfterUpload / link.storageLimit) * 100;
      if (usagePercentage >= 80 && usagePercentage < 100) {
        warnings.push(`This link is ${Math.round(usagePercentage)}% full`);
      }
    }

    return {
      success: true,
      data: {
        canUpload: errors.length === 0,
        errors,
        warnings,
      },
    };
  } catch (error) {
    logger.error('Failed to validate link for upload', error, { linkId: params.linkId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      data: {
        canUpload: false,
        errors: ['Validation failed'],
        warnings: [],
      },
    };
  }
}

/**
 * Combined action to fetch and validate link access
 * This includes checking if link exists, is active, not expired, and handles password validation
 */
export async function validateLinkAccessAction(params: {
  slugParts: string[];
  password?: string;
}): Promise<ActionResult<LinkWithStats>> {
  try {
    const { slugParts, password } = params;

    // Validate slug parts
    if (!slugParts || slugParts.length === 0 || !slugParts[0]) {
      return {
        success: false,
        error: 'Invalid link URL',
      };
    }

    const slug = slugParts[0];
    
    // Determine what we're looking for based on URL structure
    let linkResult: ActionResult<LinkWithStats | null>;
    
    if (slugParts.length === 1) {
      // Could be a base link (no topic)
      linkResult = await fetchLinkBySlugAction(slug);
    } else if (slugParts.length >= 2) {
      // Could be custom or generated link (has topic/path)
      const topic = slugParts[1];
      linkResult = await fetchLinkBySlugAction(slug, topic);
    } else {
      return {
        success: false,
        error: 'Invalid link format',
      };
    }

    if (!linkResult.success || !linkResult.data) {
      return {
        success: false,
        error: linkResult.error || 'Link not found',
      };
    }

    const link = linkResult.data;
    
    // Validate link type matches URL structure
    if (link.linkType === 'base' && slugParts.length > 1) {
      return {
        success: false,
        error: 'Invalid URL for base link',
      };
    }
    
    if ((link.linkType === 'custom' || link.linkType === 'generated') && slugParts.length < 2) {
      return {
        success: false,
        error: 'Topic required for this link type',
      };
    }

    // If link requires password and password is provided, validate it
    if (link.requirePassword && password) {
      const passwordResult = await validateLinkPasswordAction(link.id, password);
      if (!passwordResult.success) {
        return {
          success: false,
          error: passwordResult.error || 'Invalid password',
        };
      }
    }

    // If link requires password but none provided, return error
    if (link.requirePassword && !password) {
      return {
        success: false,
        error: 'password_required',
      };
    }

    return {
      success: true,
      data: link,
    };
  } catch (error) {
    logger.error('Failed to validate link access', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate link access',
    };
  }
}