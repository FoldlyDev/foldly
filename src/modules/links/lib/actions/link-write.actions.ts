// =============================================================================
// LINK WRITE ACTIONS
// =============================================================================
// Write operations for creating, updating, and deleting links
// Uses withLinkAuthInput HOF to eliminate boilerplate
// Includes rate limiting, validation, and audit logging

'use server';

import {
  createLink,
  updateLink,
  updateLinkConfig,
  deleteLink,
  isSlugAvailable,
  getUserById,
  createPermission,
} from '@/lib/database/queries';
import {
  withLinkAuthInput,
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
  type LinkActionResponse,
} from './action-helpers';
import {
  ACTION_NAMES,
  ERROR_MESSAGES,
} from '../validation/constants';
import {
  createLinkSchema,
  updateLinkSchema,
  updateLinkConfigSchema,
  deleteLinkSchema,
  validateInput,
  type CreateLinkInput,
  type UpdateLinkInput,
  type UpdateLinkConfigInput,
  type DeleteLinkInput,
} from '../validation/link-schemas';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import {
  logger,
  logRateLimitViolation,
  logSecurityEvent,
} from '@/lib/utils/logger';
import type { Link } from '@/lib/database/schemas';
import { withTransaction, isConstraintViolation } from '@/lib/database/transactions';
import { db } from '@/lib/database/connection';
import { links, permissions } from '@/lib/database/schemas';

// =============================================================================
// WRITE ACTIONS
// =============================================================================

/**
 * Create a new shareable link
 * Validates slug availability and creates owner permission automatically
 * Rate limited: 20 requests per minute
 *
 * @param data - Link creation data
 * @returns Created link
 *
 * @example
 * ```typescript
 * const result = await createLinkAction({
 *   name: 'Tax Documents 2024',
 *   slug: 'tax-docs-2024',
 *   isPublic: false
 * });
 * ```
 */
export const createLinkAction = withLinkAuthInput<CreateLinkInput, Link>(
  ACTION_NAMES.CREATE_LINK,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createLinkSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.linkCreation(userId);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link creation rate limit exceeded', {
        userId,
        action: ACTION_NAMES.CREATE_LINK,
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
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

    // Get user to retrieve email for owner permission
    const user = await getUserById(userId);
    if (!user || !user.email) {
      logSecurityEvent('userEmailNotFound', { userId });
      throw {
        success: false,
        error: 'User email not found.',
      } as const;
    }

    // Check slug availability (optimistic check for UX)
    const slugAvailable = await isSlugAvailable(validated.slug);
    if (!slugAvailable) {
      logSecurityEvent('slugAlreadyTaken', {
        userId,
        slug: validated.slug,
      });
      throw {
        success: false,
        error: ERROR_MESSAGES.LINK.SLUG_TAKEN,
      } as const;
    }

    // Create link and owner permission atomically in a transaction
    // This ensures both are created or neither is created (prevents orphaned links)
    try {
      const transactionResult = await withTransaction(
        async (tx) => {
          // Step 1: Create link
          const [link] = await tx
            .insert(links)
            .values({
              id: crypto.randomUUID(),
              workspaceId: workspace.id,
              slug: validated.slug,
              name: validated.name,
              isPublic: validated.isPublic ?? false,
              isActive: true,
            })
            .returning();

          if (!link) {
            throw new Error('Failed to create link: Database insert returned no rows');
          }

          // Step 2: Create owner permission
          const [permission] = await tx
            .insert(permissions)
            .values({
              id: crypto.randomUUID(),
              linkId: link.id,
              email: user.email,
              role: 'owner',
              isVerified: 'true', // Owners are auto-verified
              verifiedAt: new Date(),
            })
            .returning();

          if (!permission) {
            throw new Error('Failed to create permission: Database insert returned no rows');
          }

          return { link, permission };
        },
        {
          name: 'create-link-with-owner',
          context: { userId, slug: validated.slug },
        }
      );

      // Check transaction result
      if (!transactionResult.success || !transactionResult.data) {
        logSecurityEvent('linkCreationTransactionFailed', {
          userId,
          slug: validated.slug,
          error: transactionResult.error,
        });
        // Return error response (don't throw - HOF will handle)
        return {
          success: false,
          error: ERROR_MESSAGES.LINK.CREATION_FAILED,
        } as const;
      }

      const { link } = transactionResult.data;

      logger.info('Link created successfully', {
        userId,
        linkId: link.id,
        slug: link.slug,
      });

      return {
        success: true,
        data: link,
      } as const;
    } catch (error) {
      // Handle race condition: slug claimed between availability check and insert
      if (error instanceof Error && isConstraintViolation(error)) {
        const message = error.message.toLowerCase();
        if (message.includes('unique') && message.includes('slug')) {
          logSecurityEvent('slugRaceConditionDetected', {
            userId,
            slug: validated.slug,
          });
          return {
            success: false,
            error: ERROR_MESSAGES.LINK.SLUG_TAKEN,
          } as const;
        }
      }

      // If error is already a LinkActionResponse, re-throw it
      if (typeof error === 'object' && error !== null && 'success' in error) {
        throw error;
      }

      // For unexpected errors, return generic failure
      logSecurityEvent('unexpectedLinkCreationError', {
        userId,
        slug: validated.slug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        error: ERROR_MESSAGES.LINK.CREATION_FAILED,
      } as const;
    }
  }
);

/**
 * Update link details (name, slug, isPublic, isActive)
 * Validates ownership and slug availability if slug is being changed
 * Rate limited: 20 requests per minute
 *
 * @param data - Link update data
 * @returns Updated link
 *
 * @example
 * ```typescript
 * const result = await updateLinkAction({
 *   linkId: 'link_123',
 *   name: 'Updated Name',
 *   isActive: false
 * });
 * ```
 */
export const updateLinkAction = withLinkAuthInput<UpdateLinkInput, Link>(
  ACTION_NAMES.UPDATE_LINK,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateLinkSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'update-link');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link update rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: ACTION_NAMES.UPDATE_LINK,
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
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
    const existingLink = await verifyLinkOwnership(
      validated.linkId,
      workspace.id,
      ACTION_NAMES.UPDATE_LINK
    );

    // If slug is being changed, validate it
    if (validated.slug && validated.slug !== existingLink.slug) {
      // Check slug availability (excluding current link)
      const slugAvailable = await isSlugAvailable(
        validated.slug,
        validated.linkId
      );
      if (!slugAvailable) {
        logSecurityEvent('slugAlreadyTaken', {
          userId,
          linkId: validated.linkId,
          slug: validated.slug,
        });
        throw {
          success: false,
          error: ERROR_MESSAGES.LINK.SLUG_TAKEN,
        } as const;
      }
    }

    // Update link with race condition handling
    try {
      const updatedLink = await updateLink(validated.linkId, {
        name: validated.name,
        slug: validated.slug,
        isPublic: validated.isPublic,
        isActive: validated.isActive,
      });

      logger.info('Link updated successfully', {
        userId,
        linkId: validated.linkId,
      });

      return {
        success: true,
        data: updatedLink,
      } as const;
    } catch (error) {
      // Handle race condition: slug claimed between availability check and update
      if (error instanceof Error && isConstraintViolation(error)) {
        const message = error.message.toLowerCase();
        if (message.includes('unique') && message.includes('slug')) {
          logSecurityEvent('slugRaceConditionDetected', {
            userId,
            linkId: validated.linkId,
            slug: validated.slug,
          });
          return {
            success: false,
            error: ERROR_MESSAGES.LINK.SLUG_TAKEN,
          } as const;
        }
      }

      // If error is already a LinkActionResponse, re-throw it
      if (typeof error === 'object' && error !== null && 'success' in error) {
        throw error;
      }

      // For unexpected errors, return generic failure
      logSecurityEvent('unexpectedLinkUpdateError', {
        userId,
        linkId: validated.linkId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        error: ERROR_MESSAGES.LINK.UPDATE_FAILED,
      } as const;
    }
  }
);

/**
 * Update link configuration settings
 * Validates ownership before updating
 * Rate limited: 20 requests per minute
 *
 * @param data - Link config update data
 * @returns Updated link
 *
 * @example
 * ```typescript
 * const result = await updateLinkConfigAction({
 *   linkId: 'link_123',
 *   config: {
 *     notifyOnUpload: true,
 *     requiresName: true,
 *     customMessage: 'Please upload your documents here'
 *   }
 * });
 * ```
 */
export const updateLinkConfigAction = withLinkAuthInput<
  UpdateLinkConfigInput,
  Link
>(ACTION_NAMES.UPDATE_LINK_CONFIG, async (userId, input) => {
  // Validate input
  const validated = validateInput(updateLinkConfigSchema, input);

  // Rate limiting: 20 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'update-link-config');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Link config update rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: ACTION_NAMES.UPDATE_LINK_CONFIG,
      limit: RateLimitPresets.MODERATE.limit,
      window: RateLimitPresets.MODERATE.windowMs,
      attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
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
    ACTION_NAMES.UPDATE_LINK_CONFIG
  );

  // Update link config
  const updatedLink = await updateLinkConfig(validated.linkId, validated.config);

  logger.info('Link config updated successfully', {
    userId,
    linkId: validated.linkId,
  });

  return {
    success: true,
    data: updatedLink,
  } as const;
});

/**
 * Delete a link
 * Validates ownership before deletion
 * Note: Files and folders will have their link_id set to NULL (preserves content)
 * Rate limited: 20 requests per minute
 *
 * @param data - Object containing linkId
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await deleteLinkAction({ linkId: 'link_123' });
 * ```
 */
export const deleteLinkAction = withLinkAuthInput<DeleteLinkInput, void>(
  ACTION_NAMES.DELETE_LINK,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteLinkSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'delete-link');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link deletion rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: ACTION_NAMES.DELETE_LINK,
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
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
      ACTION_NAMES.DELETE_LINK
    );

    // Delete link (cascade deletes permissions, sets link_id to NULL in files/folders)
    await deleteLink(validated.linkId);

    logger.info('Link deleted successfully', {
      userId,
      linkId: validated.linkId,
    });

    return {
      success: true,
    } as const;
  }
);
