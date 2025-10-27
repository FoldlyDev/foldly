// =============================================================================
// BRANDING ACTIONS - Module-Specific Branding Operations
// =============================================================================
// Handles branding logo uploads and branding configuration updates
// Module: Links

"use server";

// Import from global utilities
import { withAuthInput, type ActionResponse } from "@/lib/utils/action-helpers";
import {
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
} from "@/lib/utils/authorization";
import { ERROR_MESSAGES } from "@/lib/constants";

// Import storage client (cross-module, provider-agnostic)
import { uploadFile, deleteFile, fileExists } from "@/lib/storage/client";

// Import database queries
import { updateLink } from "@/lib/database/queries";

// Import rate limiting
import {
  checkRateLimit,
  RateLimitPresets,
  RateLimitKeys,
} from "@/lib/middleware/rate-limit";

// Import logging
import { logger, logRateLimitViolation } from "@/lib/utils/logger";

// Import types
import type { Link } from "@/lib/database/schemas";

// Import global validation helper
import { validateInput } from "@/lib/validation";

import {
  type UploadBrandingLogoInput,
  type DeleteBrandingLogoInput,
  type UpdateLinkBrandingInput,
  uploadBrandingLogoSchema,
  deleteBrandingLogoSchema,
  updateLinkBrandingSchema,
  BRANDING_BUCKET_NAME,
  generateBrandingPath,
  getFileExtension,
  type AllowedBrandingType,
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
export const updateLinkBrandingAction = withAuthInput<
  UpdateLinkBrandingInput,
  Link
>(
  "updateLinkBrandingAction",
  async (
    userId: string,
    input: UpdateLinkBrandingInput
  ): Promise<ActionResponse<Link>> => {
    // Validate input
    const validated = validateInput(updateLinkBrandingSchema, input);

    const { linkId, branding } = validated;

    // Rate limit
    const rateLimitKey = RateLimitKeys.userAction(userId, "update-branding");
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      RateLimitPresets.PERMISSION_MANAGEMENT
    );

    if (!rateLimit.allowed) {
      logRateLimitViolation("Branding update rate limit exceeded", {
        userId,
        linkId,
        action: "updateLinkBrandingAction",
        limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
        window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
        attempts: rateLimit.remaining,
      });
      return {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimit.resetAt,
      };
    }

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
// LOGO UPLOAD ACTIONS
// =============================================================================

/**
 * Upload branding logo to GCS and update link branding
 * Rate limited: 10 requests per minute
 *
 * @param input - Logo upload input
 * @returns Updated link with logo URL
 *
 * @example
 * ```typescript
 * const result = await uploadBrandingLogoAction({
 *   linkId: 'link123',
 *   file: {
 *     buffer: fileBuffer,
 *     originalName: 'logo.png',
 *     mimeType: 'image/png',
 *     size: 102400,
 *   },
 * });
 * ```
 */
export const uploadBrandingLogoAction = withAuthInput<
  UploadBrandingLogoInput,
  { link: Link; logoUrl: string }
>(
  "uploadBrandingLogoAction",
  async (
    userId: string,
    input: UploadBrandingLogoInput
  ): Promise<ActionResponse<{ link: Link; logoUrl: string }>> => {
    // Validate input
    const validated = validateInput(uploadBrandingLogoSchema, input);

    const { linkId, file } = validated;

    // Rate limit
    const rateLimitKey = RateLimitKeys.userAction(userId, "upload-logo");
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      RateLimitPresets.PERMISSION_MANAGEMENT
    );

    if (!rateLimit.allowed) {
      logRateLimitViolation("Logo upload rate limit exceeded", {
        userId,
        linkId,
        action: "uploadBrandingLogoAction",
        limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
        window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
        attempts: rateLimit.remaining,
      });
      return {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimit.resetAt,
      };
    }

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
      "uploadBrandingLogoAction"
    );

    // Delete old logo if exists
    if (link.branding?.logo?.url) {
      const oldGcsPath = link.branding.logo.url.replace(
        `https://storage.googleapis.com/${BRANDING_BUCKET_NAME}/`,
        ""
      );

      try {
        const exists = await fileExists({
          gcsPath: oldGcsPath,
          bucket: BRANDING_BUCKET_NAME,
        });

        if (exists) {
          await deleteFile({
            gcsPath: oldGcsPath,
            bucket: BRANDING_BUCKET_NAME,
          });
          logger.info("Old branding logo deleted", { linkId, oldGcsPath });
        }
      } catch (error) {
        logger.warn("Failed to delete old logo, continuing with upload", {
          error: error instanceof Error ? error.message : "Unknown error",
          oldGcsPath,
        });
      }
    }

    // Generate GCS path
    const path = generateBrandingPath(workspace.id, linkId);
    const extension = getFileExtension(file.mimeType as AllowedBrandingType);
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.${extension}`;

    // Upload to storage (GCS or Supabase based on STORAGE_PROVIDER)
    // Storage layer handles Buffer/Uint8Array conversion internally
    const { url: logoUrl } = await uploadFile({
      file: file.buffer, // Can be Buffer (tests) or Uint8Array (client)
      fileName,
      path,
      bucket: BRANDING_BUCKET_NAME,
      contentType: file.mimeType,
      metadata: {
        workspaceId: workspace.id,
        linkId,
        originalFileName: file.originalName,
      },
    });

    // Update link branding with new logo
    const updatedLink = await updateLink(linkId, {
      branding: {
        ...link.branding,
        enabled: link.branding?.enabled ?? true,
        logo: {
          url: logoUrl,
          altText: link.branding?.logo?.altText,
        },
        colors: link.branding?.colors ?? null,
      },
    });

    if (!updatedLink) {
      return {
        success: false,
        error: ERROR_MESSAGES.LINK.UPDATE_FAILED,
      };
    }

    logger.info("Branding logo uploaded successfully", {
      userId,
      linkId,
      logoUrl,
    });

    return {
      success: true,
      data: {
        link: updatedLink,
        logoUrl,
      },
    };
  }
);

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
export const deleteBrandingLogoAction = withAuthInput<
  DeleteBrandingLogoInput,
  Link
>(
  "deleteBrandingLogoAction",
  async (
    userId: string,
    input: DeleteBrandingLogoInput
  ): Promise<ActionResponse<Link>> => {
    // Validate input
    const validated = validateInput(deleteBrandingLogoSchema, input);

    const { linkId } = validated;

    // Rate limit
    const rateLimitKey = RateLimitKeys.userAction(userId, "delete-logo");
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      RateLimitPresets.PERMISSION_MANAGEMENT
    );

    if (!rateLimit.allowed) {
      logRateLimitViolation("Logo deletion rate limit exceeded", {
        userId,
        linkId,
        action: "deleteBrandingLogoAction",
        limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
        window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
        attempts: rateLimit.remaining,
      });
      return {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimit.resetAt,
      };
    }

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

    // Delete logo from GCS if exists
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
        logger.error("Failed to delete logo from GCS", {
          error: error instanceof Error ? error.message : "Unknown error",
          gcsPath,
        });
        // Continue with database update even if GCS delete fails
      }
    }

    // Clear logo from link branding
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

    logger.info("Branding logo cleared successfully", {
      userId,
      linkId,
    });

    return {
      success: true,
      data: updatedLink,
    };
  }
);
