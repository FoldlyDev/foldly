// =============================================================================
// LINK ACTIONS - Global Link CRUD Operations
// =============================================================================
// Used by: links module, workspace module, upload module, dashboard, analytics
// Handles creation, reading, updating, and deletion of shareable links

'use server';

// Import from global utilities
import { withAuth, withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyLinkOwnership } from '@/lib/utils/authorization';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getWorkspaceLinks,
  getLinkWithPermissions,
  createLink,
  updateLink,
  updateLinkConfig,
  deleteLink,
  isSlugAvailable,
  getLinkById,
  getUserById,
  createPermission,
} from '@/lib/database/queries';

// Import rate limiting
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Link } from '@/lib/database/schemas';
import { withTransaction, isConstraintViolation } from '@/lib/database/transactions';
import { db } from '@/lib/database/connection';
import { links, permissions } from '@/lib/database/schemas';
import { z } from 'zod';

// Import module-specific validation schemas (Phase 3 will refactor these)
import {
  validateInput,
  type CreateLinkInput,
  type UpdateLinkInput,
  type UpdateLinkConfigInput,
  type DeleteLinkInput,
} from '@/modules/links/lib/validation/link-schemas';

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
export const getUserLinksAction = withAuth<Link[]>(
  'getUserLinksAction',
  async (userId) => {
    // Rate limiting: 100 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'list-links');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link read rate limit exceeded', {
        userId,
        action: 'getUserLinksAction',
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
export const getLinkByIdAction = withAuthInput<
  GetLinkByIdInput,
  Awaited<ReturnType<typeof getLinkWithPermissions>>
>('getLinkByIdAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(getLinkByIdInputSchema, input);

  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'get-link');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Link read rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: 'getLinkByIdAction',
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
    'getLinkByIdAction'
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
export const createLinkAction = withAuthInput<CreateLinkInput, Link>(
  'createLinkAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(
      await import('@/modules/links/lib/validation/link-schemas').then(m => m.createLinkSchema),
      input
    );

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.linkCreation(userId);
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link creation rate limit exceeded', {
        userId,
        action: 'createLinkAction',
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

      // If error is already an ActionResponse, re-throw it
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
export const updateLinkAction = withAuthInput<UpdateLinkInput, Link>(
  'updateLinkAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(
      await import('@/modules/links/lib/validation/link-schemas').then(m => m.updateLinkSchema),
      input
    );

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'update-link');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link update rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: 'updateLinkAction',
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
      'updateLinkAction'
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

      // If error is already an ActionResponse, re-throw it
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
export const updateLinkConfigAction = withAuthInput<
  UpdateLinkConfigInput,
  Link
>('updateLinkConfigAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(
    await import('@/modules/links/lib/validation/link-schemas').then(m => m.updateLinkConfigSchema),
    input
  );

  // Rate limiting: 20 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'update-link-config');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Link config update rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: 'updateLinkConfigAction',
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
    'updateLinkConfigAction'
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
export const deleteLinkAction = withAuthInput<DeleteLinkInput, void>(
  'deleteLinkAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(
      await import('@/modules/links/lib/validation/link-schemas').then(m => m.deleteLinkSchema),
      input
    );

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'delete-link');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Link deletion rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: 'deleteLinkAction',
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
      'deleteLinkAction'
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

// =============================================================================
// VALIDATION ACTIONS
// =============================================================================

/**
 * Check if a slug is available
 * Requires authentication to prevent abuse
 * Rate limited: 30 requests per minute (strict to prevent slug enumeration)
 *
 * @param data - Object containing slug to check
 * @returns Availability status (true = available, false = taken)
 *
 * @example
 * ```typescript
 * const result = await checkSlugAvailabilityAction({ slug: 'my-slug' });
 * if (result.success && result.data) {
 *   console.log('Slug is available');
 * }
 * ```
 */
export const checkSlugAvailabilityAction = withAuthInput<
  { slug: string },
  boolean
>('checkSlugAvailabilityAction', async (userId, input) => {
  // Validate input (includes slug sanitization)
  const validated = validateInput(
    await import('@/modules/links/lib/validation/link-schemas').then(m => m.checkSlugSchema),
    input
  );

  // Rate limiting: 30 requests/minute (strict to prevent slug enumeration)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'check-slug');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.SLUG_VALIDATION);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Slug availability check rate limit exceeded', {
      userId,
      action: 'checkSlugAvailabilityAction',
      limit: RateLimitPresets.SLUG_VALIDATION.limit,
      window: RateLimitPresets.SLUG_VALIDATION.windowMs,
      attempts: RateLimitPresets.SLUG_VALIDATION.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Check availability
  const available = await isSlugAvailable(validated.slug);

  return {
    success: true,
    data: available,
  } as const;
});
