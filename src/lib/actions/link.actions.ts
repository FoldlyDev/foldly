// =============================================================================
// LINK ACTIONS - Global Link CRUD Operations
// =============================================================================
// Used by: links module, workspace module, upload module, dashboard, analytics
// Handles creation, reading, updating, and deletion of shareable links

'use server';

// Import from global utilities
import {
  withAuth,
  withAuthInput,
  withAuthAndRateLimit,
  withAuthInputAndRateLimit,
  type ActionResponse,
} from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyLinkOwnership } from '@/lib/utils/authorization';
import { encryptPassword, isEncryptedPassword } from '@/lib/utils/security';
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

// Import rate limiting (RateLimitPresets used in HOF parameters)
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Link } from '@/lib/database/schemas';
import { withTransaction, isConstraintViolation } from '@/lib/database/transactions';
import { db } from '@/lib/database/connection';
import { links, permissions, folders } from '@/lib/database/schemas';
import { z } from 'zod';

// Import global validation schemas
import {
  validateInput,
  createLinkSchema,
  updateLinkSchema,
  updateLinkConfigSchema,
  deleteLinkSchema,
  checkSlugSchema,
  type CreateLinkInput,
  type UpdateLinkInput,
  type UpdateLinkConfigInput,
  type DeleteLinkInput,
} from '@/lib/validation';

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
export const getUserLinksAction = withAuthAndRateLimit<Link[]>(
  'getUserLinksAction',
  RateLimitPresets.GENEROUS,
  async (userId) => {
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
export const getLinkByIdAction = withAuthInputAndRateLimit<
  GetLinkByIdInput,
  Awaited<ReturnType<typeof getLinkWithPermissions>>
>(
  'getLinkByIdAction',
  RateLimitPresets.GENEROUS,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(getLinkByIdInputSchema, input);

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
  }
);

// =============================================================================
// WRITE ACTIONS
// =============================================================================

/**
 * Create a standalone link without auto-creating root folder
 * Used when linking existing folders (Workspace Module)
 * Creates link + owner permission + additional permissions (NO folder)
 * Rate limited: 20 requests per minute
 *
 * @param data - Link creation data
 * @returns Created link
 *
 * @example
 * ```typescript
 * const result = await createStandaloneLinkAction({
 *   name: 'Client Docs',
 *   slug: 'client-docs',
 *   isPublic: false
 * });
 * // Link created, but no root folder (user will link existing folder separately)
 * ```
 */
export const createStandaloneLinkAction = withAuthInputAndRateLimit<CreateLinkInput, Link>(
  'createStandaloneLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createLinkSchema, input);

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

    // Encrypt password if provided and not already encrypted
    let encryptedPassword: string | null = null;
    if (validated.linkConfig?.password) {
      if (!isEncryptedPassword(validated.linkConfig.password)) {
        encryptedPassword = encryptPassword(validated.linkConfig.password);
      } else {
        encryptedPassword = validated.linkConfig.password;
      }
    }

    // Prepare link configuration with defaults
    const linkConfig = {
      notifyOnUpload: validated.linkConfig?.notifyOnUpload ?? true,
      customMessage: validated.linkConfig?.customMessage ?? null,
      requiresName: validated.linkConfig?.requiresName ?? false,
      expiresAt: validated.linkConfig?.expiresAt ?? null,
      passwordProtected: validated.linkConfig?.passwordProtected ?? false,
      password: encryptedPassword,
    };

    // Prepare branding configuration
    const branding = {
      enabled: validated.branding?.enabled ?? false,
      logo: null,
      colors: validated.branding?.colors ?? null,
    };

    // Create link, owner permission, and additional permissions atomically
    // NO root folder creation (caller will link existing folder)
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
              isActive: false, // Will be activated when folder is linked
              linkConfig,
              branding,
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
              isVerified: 'true',
              verifiedAt: new Date(),
            })
            .returning();

          if (!permission) {
            throw new Error('Failed to create permission: Database insert returned no rows');
          }

          // Step 3: Create permissions for allowed emails (if private link with emails)
          const additionalPermissions: typeof permissions.$inferInsert[] = [];
          if (!validated.isPublic && validated.allowedEmails && validated.allowedEmails.length > 0) {
            for (const email of validated.allowedEmails) {
              additionalPermissions.push({
                id: crypto.randomUUID(),
                linkId: link.id,
                email,
                role: 'editor',
                isVerified: 'false',
                verifiedAt: null,
              });
            }

            await tx.insert(permissions).values(additionalPermissions);
          }

          // NOTE: NO root folder creation (Step 4 from createLinkAction)
          // Caller will link existing folder to this link

          return { link, permission, additionalPermissions };
        },
        {
          name: 'create-standalone-link',
          context: { userId, slug: validated.slug },
        }
      );

      // Check transaction result
      if (!transactionResult.success || !transactionResult.data) {
        logSecurityEvent('standaloneLinkCreationTransactionFailed', {
          userId,
          slug: validated.slug,
          error: transactionResult.error,
        });
        return {
          success: false,
          error: ERROR_MESSAGES.LINK.CREATION_FAILED,
        } as const;
      }

      const { link } = transactionResult.data;

      logger.info('Standalone link created successfully', {
        userId,
        linkId: link.id,
        slug: link.slug,
        isActive: false, // Will be activated when folder is linked
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
      logSecurityEvent('unexpectedStandaloneLinkCreationError', {
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
 * Create a new shareable link with auto-created root folder
 * Used by Links Module for standard link creation
 * Creates link + owner permission + additional permissions + root folder
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
export const createLinkAction = withAuthInputAndRateLimit<CreateLinkInput, Link>(
  'createLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createLinkSchema, input);

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

    // Encrypt password if provided and not already encrypted
    let encryptedPassword: string | null = null;
    if (validated.linkConfig?.password) {
      // Only encrypt if it's not already encrypted
      if (!isEncryptedPassword(validated.linkConfig.password)) {
        encryptedPassword = encryptPassword(validated.linkConfig.password);
      } else {
        // Already encrypted (shouldn't happen in normal flow, but handle it)
        encryptedPassword = validated.linkConfig.password;
      }
    }

    // Prepare link configuration with defaults
    const linkConfig = {
      notifyOnUpload: validated.linkConfig?.notifyOnUpload ?? true,
      customMessage: validated.linkConfig?.customMessage ?? null,
      requiresName: validated.linkConfig?.requiresName ?? false,
      expiresAt: validated.linkConfig?.expiresAt ?? null,
      passwordProtected: validated.linkConfig?.passwordProtected ?? false,
      password: encryptedPassword,
    };

    // Prepare branding configuration
    const branding = {
      enabled: validated.branding?.enabled ?? false,
      logo: null, // Logo will be added via separate upload action when GCS is configured
      colors: validated.branding?.colors ?? null,
    };

    // Create link, owner permission, additional permissions, and root folder atomically in a transaction
    // This ensures all are created or none are created (prevents orphaned links/permissions/folders)
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
              linkConfig,
              branding,
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

          // Step 3: Create permissions for allowed emails (if private link with emails)
          const additionalPermissions: typeof permissions.$inferInsert[] = [];
          if (!validated.isPublic && validated.allowedEmails && validated.allowedEmails.length > 0) {
            for (const email of validated.allowedEmails) {
              additionalPermissions.push({
                id: crypto.randomUUID(),
                linkId: link.id,
                email,
                role: 'editor',
                isVerified: 'false', // Will be verified via email
                verifiedAt: null,
              });
            }

            await tx.insert(permissions).values(additionalPermissions);
          }

          // Step 4: Auto-create root folder for this link
          // Pattern: {slug}-files (e.g., "tax-docs-2024-files")
          const [folder] = await tx
            .insert(folders)
            .values({
              id: crypto.randomUUID(),
              workspaceId: workspace.id,
              linkId: link.id,
              parentFolderId: null, // Root folder
              name: `${validated.slug}-files`,
            })
            .returning();

          if (!folder) {
            throw new Error('Failed to create root folder: Database insert returned no rows');
          }

          return { link, permission, additionalPermissions, folder };
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
 * Update link details (name, slug, isPublic, isActive, linkConfig, branding)
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
 *   isActive: false,
 *   linkConfig: {
 *     notifyOnUpload: true,
 *     customMessage: 'Please upload your files here',
 *     passwordProtected: true,
 *     password: 'secure123'
 *   },
 *   branding: {
 *     enabled: true,
 *     colors: {
 *       accentColor: '#6c47ff',
 *       backgroundColor: '#ffffff'
 *     }
 *   }
 * });
 * ```
 */
export const updateLinkAction = withAuthInputAndRateLimit<UpdateLinkInput, Link>(
  'updateLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateLinkSchema, input);

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

    // Encrypt password if provided and not already encrypted
    let passwordToStore: string | null | undefined = undefined;
    if (validated.linkConfig?.password !== undefined) {
      if (validated.linkConfig.password === null) {
        // Explicitly setting to null (removing password)
        passwordToStore = null;
      } else if (!isEncryptedPassword(validated.linkConfig.password)) {
        // New password provided - encrypt it
        passwordToStore = encryptPassword(validated.linkConfig.password);
      } else {
        // Already encrypted (shouldn't happen in normal flow, but handle it)
        passwordToStore = validated.linkConfig.password;
      }
    }

    // Prepare linkConfig if provided
    let linkConfig: Link['linkConfig'] | undefined;
    if (validated.linkConfig) {
      linkConfig = {
        notifyOnUpload: validated.linkConfig.notifyOnUpload ?? existingLink.linkConfig.notifyOnUpload,
        customMessage: validated.linkConfig.customMessage !== undefined
          ? validated.linkConfig.customMessage
          : existingLink.linkConfig.customMessage,
        requiresName: validated.linkConfig.requiresName ?? existingLink.linkConfig.requiresName,
        expiresAt: validated.linkConfig.expiresAt !== undefined
          ? validated.linkConfig.expiresAt
          : existingLink.linkConfig.expiresAt,
        passwordProtected: validated.linkConfig.passwordProtected ?? existingLink.linkConfig.passwordProtected,
        password: passwordToStore !== undefined
          ? passwordToStore
          : existingLink.linkConfig.password,
      };
    }

    // Prepare branding if provided
    let branding: Link['branding'] | undefined;
    if (validated.branding) {
      branding = {
        enabled: validated.branding.enabled,
        logo: existingLink.branding?.logo ?? null, // Preserve existing logo (logo updates via separate action)
        colors: validated.branding.colors ?? existingLink.branding?.colors ?? null,
      };
    }

    // Update link with race condition handling
    try {
      const updatedLink = await updateLink(validated.linkId, {
        name: validated.name,
        slug: validated.slug,
        isPublic: validated.isPublic,
        isActive: validated.isActive,
        linkConfig,
        branding,
      });

      logger.info('Link updated successfully', {
        userId,
        linkId: validated.linkId,
        fieldsUpdated: {
          name: validated.name !== undefined,
          slug: validated.slug !== undefined,
          isPublic: validated.isPublic !== undefined,
          isActive: validated.isActive !== undefined,
          linkConfig: linkConfig !== undefined,
          branding: branding !== undefined,
        },
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
export const updateLinkConfigAction = withAuthInputAndRateLimit<
  UpdateLinkConfigInput,
  Link
>(
  'updateLinkConfigAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateLinkConfigSchema, input);

    // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify link ownership
  await verifyLinkOwnership(
    validated.linkId,
    workspace.id,
    'updateLinkConfigAction'
  );

  // Encrypt password if provided and not already encrypted
  let configToStore = { ...validated.config };
  if (validated.config.password !== undefined && validated.config.password !== null) {
    if (!isEncryptedPassword(validated.config.password)) {
      // New password provided - encrypt it
      configToStore.password = encryptPassword(validated.config.password);
    }
    // If already encrypted, use as-is (already in configToStore)
  }

  // Update link config
  const updatedLink = await updateLinkConfig(validated.linkId, configToStore);

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
export const deleteLinkAction = withAuthInputAndRateLimit<DeleteLinkInput, void>(
  'deleteLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteLinkSchema, input);

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
export const checkSlugAvailabilityAction = withAuthInputAndRateLimit<
  { slug: string },
  boolean
>(
  'checkSlugAvailabilityAction',
  RateLimitPresets.SLUG_VALIDATION,
  async (userId, input) => {
    // Validate input (includes slug sanitization)
    const validated = validateInput(checkSlugSchema, input);

    // Check availability
  const available = await isSlugAvailable(validated.slug);

  return {
    success: true,
    data: available,
  } as const;
});
