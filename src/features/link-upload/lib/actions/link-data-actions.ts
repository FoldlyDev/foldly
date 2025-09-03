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
 * Thin wrapper around the service method
 */
export async function fetchLinkTreeDataAction(
  linkId: string
): Promise<ActionResult> {
  try {
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

    return {
      success: true,
      data: result.data,
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