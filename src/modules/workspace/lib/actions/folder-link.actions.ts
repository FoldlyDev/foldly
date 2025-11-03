// =============================================================================
// FOLDER-LINK ACTIONS - Folder ↔ Link Relationship Management
// =============================================================================
// Module-specific actions for Workspace Module
// Handles linking/unlinking folders to/from shareable links

'use server';

// Import from global utilities
import {
  withAuthInputAndRateLimit,
  validateInput,
} from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace } from '@/lib/utils/authorization';
import { sanitizeSlug } from '@/lib/utils/security';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import global actions (reuse existing standalone link creation)
import { createStandaloneLinkAction } from '@/lib/actions/link.actions';

// Import database queries
import {
  getFolderById,
  linkFolderToLink as linkFolderToLinkQuery,
  unlinkFolder as unlinkFolderQuery,
} from '@/lib/database/queries/folder.queries';
import {
  getLinkById,
  getAvailableLinks,
  isSlugAvailable,
} from '@/lib/database/queries/link.queries';

// Import rate limiting
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger } from '@/lib/utils/logger';

// Import types
import type { Link } from '@/lib/database/schemas';

// Import validation schemas
import {
  linkFolderToExistingLinkSchema,
  linkFolderWithNewLinkSchema,
  unlinkFolderSchema,
  type LinkFolderToExistingLinkInput,
  type LinkFolderWithNewLinkInput,
  type UnlinkFolderInput,
} from '@/lib/validation/folder-link-schemas';

// =============================================================================
// LINK FOLDER TO EXISTING LINK ACTION
// =============================================================================

/**
 * Link personal folder to existing inactive link
 * Validates folder ownership and link availability
 * Rate limited: 20 requests per minute
 *
 * @param input - Object containing folderId and linkId
 * @returns Action response with void (success/error only)
 *
 * @example
 * ```typescript
 * const result = await linkFolderToExistingLinkAction({
 *   folderId: 'folder_123',
 *   linkId: 'link_456'
 * });
 * if (result.success) {
 *   console.log('Folder linked to existing link');
 * }
 * ```
 */
export const linkFolderToExistingLinkAction = withAuthInputAndRateLimit<
  LinkFolderToExistingLinkInput,
  void
>(
  'linkFolderToExistingLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(linkFolderToExistingLinkSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder exists and user owns it
    const folder = await getFolderById(validated.folderId);
    if (!folder || folder.workspaceId !== workspace.id) {
      throw {
        success: false,
        error: ERROR_MESSAGES.FOLDER.NOT_FOUND,
      } as const;
    }

    // Verify folder is not already linked
    if (folder.linkId) {
      throw {
        success: false,
        error: 'Folder is already linked to a shareable link',
      } as const;
    }

    // Verify link exists and user owns it
    const link = await getLinkById(validated.linkId);
    if (!link || link.workspaceId !== workspace.id) {
      throw {
        success: false,
        error: ERROR_MESSAGES.LINK.NOT_FOUND,
      } as const;
    }

    // Verify link is available (inactive)
    if (link.isActive) {
      throw {
        success: false,
        error: 'Link is already active and cannot be reused',
      } as const;
    }

    // Link folder to link (transaction: update folder.linkId + link.isActive)
    await linkFolderToLinkQuery(validated.folderId, validated.linkId);

    logger.info('Folder linked to existing link', {
      userId,
      workspaceId: workspace.id,
      folderId: validated.folderId,
      linkId: validated.linkId,
    });

    return {
      success: true,
      data: undefined,
    } as const;
  }
);

// =============================================================================
// LINK FOLDER WITH NEW LINK ACTION
// =============================================================================

/**
 * Create new link and link folder in one atomic operation
 * Auto-generates link name/slug from folder name
 * Validates folder ownership and creates permissions
 * Rate limited: 20 requests per minute
 *
 * Auto-generation:
 * - Link name: "{folder.name} Link" (e.g., "Client Documents Link")
 * - Link slug: "{slugify(folder.name)}-link" (e.g., "client-documents-link")
 * - Conflict resolution: Auto-increment (e.g., "client-documents-link-2")
 * - Default config: Public, no password, notify on upload
 * - Owner permission: User's email (automatically added)
 * - Editor permissions: allowedEmails array
 *
 * @param input - Object containing folderId and optional allowedEmails
 * @returns Action response with created Link
 *
 * @example
 * ```typescript
 * const result = await linkFolderWithNewLinkAction({
 *   folderId: 'folder_123',
 *   allowedEmails: ['client@example.com']
 * });
 * if (result.success) {
 *   console.log('Link created:', result.data.id);
 *   console.log('Link URL:', result.data.slug); // client-documents-link
 * }
 * ```
 */
export const linkFolderWithNewLinkAction = withAuthInputAndRateLimit<
  LinkFolderWithNewLinkInput,
  Link
>(
  'linkFolderWithNewLinkAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(linkFolderWithNewLinkSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder exists and user owns it
    const folder = await getFolderById(validated.folderId);
    if (!folder || folder.workspaceId !== workspace.id) {
      throw {
        success: false,
        error: ERROR_MESSAGES.FOLDER.NOT_FOUND,
      } as const;
    }

    // Verify folder is not already linked
    if (folder.linkId) {
      throw {
        success: false,
        error: 'Folder is already linked to a shareable link',
      } as const;
    }

    // Step 1: Auto-generate link name and slug from folder name
    const linkName = `${folder.name} Link`;
    const baseSlug = `${sanitizeSlug(folder.name)}-link`;

    // Step 2: Handle slug conflicts with auto-increment
    let finalSlug = baseSlug;
    let slugAvailable = await isSlugAvailable(finalSlug);
    let attempt = 2;

    // Try up to 10 times to find available slug
    while (!slugAvailable && attempt <= 10) {
      finalSlug = `${baseSlug}-${attempt}`;
      slugAvailable = await isSlugAvailable(finalSlug);
      attempt++;
    }

    // If still not available after 10 attempts, fail
    if (!slugAvailable) {
      logger.error('Failed to generate unique slug after 10 attempts', {
        userId,
        folderId: validated.folderId,
        folderName: folder.name,
        baseSlug,
      });
      throw {
        success: false,
        error: 'Unable to generate unique link URL. Please try again.',
      } as const;
    }

    // Step 3: Create standalone link (no root folder) using global action
    // Handles permissions, password encryption, branding, transaction
    const linkResult = await createStandaloneLinkAction({
      name: linkName,
      slug: finalSlug,
      isPublic: true, // Default to public (user can change later in link settings)
      allowedEmails: validated.allowedEmails, // Optional editor permissions
      linkConfig: {
        notifyOnUpload: true, // Default config
        customMessage: null,
        requiresName: false,
        expiresAt: null,
        passwordProtected: false,
        password: null,
      },
      branding: {
        enabled: false, // Default branding
        colors: null,
      },
    });

    if (!linkResult.success || !linkResult.data) {
      // Forward error from link creation
      throw linkResult.success
        ? {
            success: false,
            error: 'Failed to create link',
          }
        : linkResult;
    }

    const link = linkResult.data;

    // Step 4: Link the existing folder to the new link
    // Also activates the link (isActive = true)
    await linkFolderToLinkQuery(validated.folderId, link.id);

    logger.info('Link created and folder linked', {
      userId,
      workspaceId: workspace.id,
      folderId: validated.folderId,
      linkId: link.id,
      slug: link.slug,
      autoGenerated: true,
      basedOnFolderName: folder.name,
    });

    // Step 5: Fetch the link with workspace.user.username relation for URL generation
    const linkWithRelations = await getLinkById(link.id);
    if (!linkWithRelations) {
      throw {
        success: false,
        error: 'Failed to fetch created link',
      } as const;
    }

    return {
      success: true,
      data: linkWithRelations,
    } as const;
  }
);

// =============================================================================
// UNLINK FOLDER ACTION
// =============================================================================

/**
 * Unlink folder from shareable link (convert to personal folder)
 * Non-destructive: Sets folder.linkId = NULL, link.isActive = false
 * Preserves link record for potential re-use
 * Rate limited: 20 requests per minute
 *
 * @param input - Object containing folderId
 * @returns Action response with void (success/error only)
 *
 * @example
 * ```typescript
 * const result = await unlinkFolderAction({
 *   folderId: 'folder_123'
 * });
 * if (result.success) {
 *   console.log('Folder converted to personal');
 * }
 * ```
 */
export const unlinkFolderAction = withAuthInputAndRateLimit<
  UnlinkFolderInput,
  void
>(
  'unlinkFolderAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(unlinkFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder exists and user owns it
    const folder = await getFolderById(validated.folderId);
    if (!folder || folder.workspaceId !== workspace.id) {
      throw {
        success: false,
        error: ERROR_MESSAGES.FOLDER.NOT_FOUND,
      } as const;
    }

    // Verify folder is actually linked (graceful handling if not)
    if (!folder.linkId) {
      logger.warn('Attempted to unlink folder that is not linked', {
        userId,
        folderId: validated.folderId,
      });

      // Return success (idempotent operation - folder is already personal)
      return {
        success: true,
        data: undefined,
      } as const;
    }

    // Unlink folder (transaction: folder.linkId = NULL, link.isActive = false)
    await unlinkFolderQuery(validated.folderId);

    logger.info('Folder unlinked (converted to personal)', {
      userId,
      workspaceId: workspace.id,
      folderId: validated.folderId,
      previousLinkId: folder.linkId,
    });

    return {
      success: true,
      data: undefined,
    } as const;
  }
);

// =============================================================================
// GET AVAILABLE LINKS ACTION
// =============================================================================

/**
 * Get available links for workspace
 * Returns inactive links that can be reused
 * Rate limited: 100 requests per minute
 *
 * @returns Action response with array of available links
 *
 * @example
 * ```typescript
 * const result = await getAvailableLinksAction();
 * if (result.success) {
 *   console.log('Available links:', result.data);
 * }
 * ```
 */
export const getAvailableLinksAction = withAuthInputAndRateLimit<
  void,
  Link[]
>(
  'getAvailableLinksAction',
  RateLimitPresets.GENEROUS,
  async (userId) => {
    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Get available links
    const availableLinks = await getAvailableLinks(workspace.id);

    return {
      success: true,
      data: availableLinks,
    } as const;
  }
);
