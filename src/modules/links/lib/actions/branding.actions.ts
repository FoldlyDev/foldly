// =============================================================================
// BRANDING ACTIONS - Module-Specific Branding Operations
// =============================================================================
// Handles branding logo uploads and branding configuration updates
// Module: Links

"use server";

// Import from global utilities
import { withAuthInputAndRateLimit, validateInput, type ActionResponse } from "@/lib/utils/action-helpers";
import {
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
} from "@/lib/utils/authorization";
import { ERROR_MESSAGES } from "@/lib/constants";

// Import storage client (cross-module, provider-agnostic)
import {
  deleteFile,
  fileExists,
} from "@/lib/storage/client";

// Import database queries
import { updateLink } from "@/lib/database/queries";

// Import rate limiting
import { RateLimitPresets } from "@/lib/middleware/rate-limit";

// Import logging
import { logger } from "@/lib/utils/logger";

// Import types
import type { Link } from "@/lib/database/schemas";

import {
  type DeleteBrandingLogoInput,
  type UpdateLinkBrandingInput,
  deleteBrandingLogoSchema,
  updateLinkBrandingSchema,
  BRANDING_BUCKET_NAME,
} from "../validation/link-branding-schemas";

// =============================================================================
// BRANDING CONFIGURATION ACTIONS
// =============================================================================

/**
 * Update link branding configuration
 * Rate limited: 10 requests per minute
 *
 * @param input - Branding configuration update
 * @returns Updated link branding
 *
 * @example
 * ```typescript
 * const result = await updateLinkBrandingAction({
 *   linkId: 'link123',
 *   branding: {
 *     enabled: true,
 *     colors: {
 *       accentColor: '#6c47ff',
 *       backgroundColor: '#ffffff',
 *     },
 *   },
 * });
 * ```
 */
export const updateLinkBrandingAction = withAuthInputAndRateLimit<
  UpdateLinkBrandingInput,
  Link
>(
  "updateLinkBrandingAction",
  RateLimitPresets.PERMISSION_MANAGEMENT,
  async (
    userId: string,
    input: UpdateLinkBrandingInput
  ): Promise<ActionResponse<Link>> => {
    // Validate input
    const validated = validateInput(updateLinkBrandingSchema, input);

    const { linkId, branding } = validated;

    // Get authenticated workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify link ownership
    const link = await verifyLinkOwnership(
      linkId,
      workspace.id,
      "updateLinkBrandingAction"
    );

    // Update branding (merge with existing to ensure all fields are present)
    const updatedBranding = {
      enabled: branding.enabled ?? link.branding?.enabled ?? false,
      logo:
        branding.logo !== undefined
          ? branding.logo
          : (link.branding?.logo ?? null),
      colors:
        branding.colors !== undefined
          ? branding.colors
          : (link.branding?.colors ?? null),
    };

    const updatedLink = await updateLink(linkId, { branding: updatedBranding });

    if (!updatedLink) {
      return {
        success: false,
        error: ERROR_MESSAGES.LINK.UPDATE_FAILED,
      };
    }

    logger.info("Link branding updated", {
      userId,
      linkId,
      brandingEnabled: branding.enabled,
    });

    return {
      success: true,
      data: updatedLink,
    };
  }
);

// =============================================================================
// LOGO DELETION ACTION
// =============================================================================
// NOTE: Logo upload actions removed - now handled by useUppyUpload hook
// See: src/hooks/utility/use-uppy-upload.ts

/**
 * Delete branding logo from GCS and clear link branding
 * Rate limited: 10 requests per minute
 *
 * @param input - Delete logo input
 * @returns Updated link with logo cleared
 *
 * @example
 * ```typescript
 * const result = await deleteBrandingLogoAction({
 *   linkId: 'link123',
 * });
 * ```
 */
export const deleteBrandingLogoAction = withAuthInputAndRateLimit<
  DeleteBrandingLogoInput,
  Link
>(
  "deleteBrandingLogoAction",
  RateLimitPresets.PERMISSION_MANAGEMENT,
  async (
    userId: string,
    input: DeleteBrandingLogoInput
  ): Promise<ActionResponse<Link>> => {
    // Validate input
    const validated = validateInput(deleteBrandingLogoSchema, input);

    const { linkId } = validated;

    // Validate bucket configuration
    if (!BRANDING_BUCKET_NAME) {
      logger.error("GCS branding bucket not configured");
      return {
        success: false,
        error: ERROR_MESSAGES.STORAGE.NOT_CONFIGURED,
      };
    }

    // Get authenticated workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify link ownership
    const link = await verifyLinkOwnership(
      linkId,
      workspace.id,
      "deleteBrandingLogoAction"
    );

    // CRITICAL: Delete logo from storage FIRST (storage-first deletion pattern)
    // Users don't pay for logo storage, but consistency matters
    if (link.branding?.logo?.url) {
      const gcsPath = link.branding.logo.url.replace(
        `https://storage.googleapis.com/${BRANDING_BUCKET_NAME}/`,
        ""
      );

      try {
        const exists = await fileExists({
          gcsPath,
          bucket: BRANDING_BUCKET_NAME,
        });

        if (exists) {
          await deleteFile({
            gcsPath,
            bucket: BRANDING_BUCKET_NAME,
          });
          logger.info("Branding logo deleted from GCS", { linkId, gcsPath });
        }
      } catch (error) {
        // Storage deletion failed - ABORT operation
        // User can retry, and logo will eventually be deleted
        logger.error("Failed to delete logo from GCS - aborting operation", {
          userId,
          linkId,
          gcsPath,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
          success: false,
          error: "Failed to delete logo from storage. Please try again.",
        };
      }
    }

    // Storage deleted successfully (or no logo) - now update database
    // If this fails, we have orphaned DB reference (acceptable - can be cleaned up)
    try {
      const updatedLink = await updateLink(linkId, {
        branding: {
          ...link.branding,
          enabled: link.branding?.enabled ?? false,
          logo: null,
          colors: link.branding?.colors ?? null,
        },
      });

      if (!updatedLink) {
        return {
          success: false,
          error: ERROR_MESSAGES.LINK.UPDATE_FAILED,
        };
      }

      logger.info("Branding logo cleared successfully (storage + DB)", {
        userId,
        linkId,
      });

      return {
        success: true,
        data: updatedLink,
      };
    } catch (error) {
      // DB update failed but storage is already deleted
      // Log orphaned DB reference for cleanup
      logger.warn("Orphaned DB reference (storage deleted, DB update failed)", {
        userId,
        linkId,
        requiresCleanup: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Still return success - logo is deleted from storage (primary concern)
      // DB reference can be cleaned up via retry or background job
      return {
        success: true,
        data: link, // Return original link data
      };
    }
  }
);
