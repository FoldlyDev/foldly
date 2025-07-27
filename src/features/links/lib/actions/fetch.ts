'use server';

import { linksDbService } from '../db-service';
import { requireAuth } from './shared';
import type { ActionResult } from '../validations';
import type { LinkWithStats } from '@/lib/database/types/links';

/**
 * Fetch all links for the current user
 */
export async function fetchLinksAction(
  options: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ActionResult<LinkWithStats[]>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Fetch links from database
    const result = await linksDbService.getByUserId(user.id, options);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch links',
      };
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    console.error('Fetch links error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch a single link by ID for the current user
 */
export async function fetchLinkByIdAction(
  linkId: string
): Promise<ActionResult<LinkWithStats | null>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Fetch link from database
    const result = await linksDbService.getById(linkId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch link',
      };
    }

    // 3. Verify ownership
    if (result.data && result.data.userId !== user.id) {
      return {
        success: false,
        error: 'Access denied: Link not found',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Fetch link by ID error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
