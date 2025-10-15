// =============================================================================
// LINK READ ACTIONS
// =============================================================================
// Read-only operations for retrieving link data
// Uses withLinkAuth HOF to eliminate boilerplate
// Includes distributed rate limiting via Redis

'use server';

import {
  getWorkspaceLinks,
  getLinkWithPermissions,
} from '@/lib/database/queries';
import {
  withLinkAuth,
  withLinkAuthInput,
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
  type LinkActionResponse,
} from './action-helpers';
import { ACTION_NAMES, ERROR_MESSAGES } from '../validation/constants';
import { validateInput } from '../validation/link-schemas';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';
import { z } from 'zod';
import type { Link } from '@/lib/database/schemas';

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for getLinkById input
 */
const getLinkByIdInputSchema = z.object({
  linkId: z.string().uuid({ message: 'Invalid link ID format.' }),
});

type GetLinkByIdInput = z.infer<typeof getLinkByIdInputSchema>;

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Get all links for the authenticated user's workspace
 * Rate limited: 100 requests per minute
 *
 * @returns Array of links for the user's workspace
 *
 * @example
 * ```typescript
 * const result = await getUserLinksAction();
 * if (result.success) {
 *   console.log('Links:', result.data);
 * }
 * ```
 */
export const getUserLinksAction = withLinkAuth<Link[]>(
  ACTION_NAMES.GET_USER_LINKS,
  async (userId) => {
    // Rate limiting: 100 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'list-links');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link read rate limit exceeded', {
        userId,
        action: ACTION_NAMES.GET_USER_LINKS,
        limit: RateLimitPresets.GENEROUS.limit,
        window: RateLimitPresets.GENEROUS.windowMs,
        attempts: RateLimitPresets.GENEROUS.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Get all links for workspace
    const links = await getWorkspaceLinks(workspace.id);

    return {
      success: true,
      data: links,
    } as const;
  }
);

/**
 * Get a link by ID with its permissions
 * Validates that the link belongs to the authenticated user's workspace
 * Rate limited: 100 requests per minute
 *
 * @param input - Object containing linkId
 * @returns Link with permissions
 *
 * @example
 * ```typescript
 * const result = await getLinkByIdAction({ linkId: 'link_123' });
 * if (result.success) {
 *   console.log('Link:', result.data);
 * }
 * ```
 */
export const getLinkByIdAction = withLinkAuthInput<
  GetLinkByIdInput,
  Awaited<ReturnType<typeof getLinkWithPermissions>>
>(ACTION_NAMES.GET_LINK_BY_ID, async (userId, input) => {
  // Validate input
  const validated = validateInput(getLinkByIdInputSchema, input);

  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'get-link');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Link read rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: ACTION_NAMES.GET_LINK_BY_ID,
      limit: RateLimitPresets.GENEROUS.limit,
      window: RateLimitPresets.GENEROUS.windowMs,
      attempts: RateLimitPresets.GENEROUS.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify link ownership
  await verifyLinkOwnership(
    validated.linkId,
    workspace.id,
    ACTION_NAMES.GET_LINK_BY_ID
  );

  // Get link with permissions (ownership already verified)
  const link = await getLinkWithPermissions(validated.linkId);
  if (!link) {
    // This shouldn't happen since we just verified it exists, but handle it
    logSecurityEvent('linkDisappeared', {
      linkId: validated.linkId,
      userId,
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.LINK.NOT_FOUND,
    } as const;
  }

  return {
    success: true,
    data: link,
  } as const;
});
