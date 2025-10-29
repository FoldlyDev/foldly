// =============================================================================
// STORAGE ACTIONS - Global Cross-Module Storage Operations
// =============================================================================
// Server actions for storage operations (cross-module usage)
// Bridge between client and storage abstraction layer
//
// Two Upload Flows:
// 1. Authenticated Uploads: Dashboard users (branding logos, personal files)
// 2. Public Uploads: External users via shareable links (see modules/uploads/)

"use server";

import { withAuthInput, type ActionResponse } from "@/lib/utils/action-helpers";
import { getAuthenticatedWorkspace } from "@/lib/utils/authorization";
import {
  initiateResumableUpload as storageInitiateUpload,
  verifyUpload as storageVerifyUpload,
} from "@/lib/storage/client";
import type { UploadSession } from "@/lib/storage/types";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from "@/lib/middleware/rate-limit";
import { VALIDATION_LIMITS } from "@/lib/constants/validation";

// =============================================================================
// TYPES
// =============================================================================

export interface InitiateUploadInput {
  fileName: string;
  fileSize: number;
  contentType: string;
  bucket: string;
  path: string;
  metadata?: Record<string, string>;
}

export interface VerifyUploadInput {
  uploadId: string;
  bucket: string;
  path: string;
}

export interface VerifyUploadResult {
  success: boolean;
  url: string;
}

// Public upload inputs (no auth required)
export interface InitiatePublicUploadInput {
  fileName: string;
  fileSize: number;
  contentType: string;
  bucket: string;
  path: string;
  metadata?: Record<string, string>;
  rateLimitKey?: string; // Custom rate limit key (e.g., email+IP)
}

export interface VerifyPublicUploadInput {
  uploadId: string;
  bucket: string;
  path: string;
  linkId: string; // Required for ownership verification
  uploaderEmail: string; // Required for ownership verification
}

// =============================================================================
// ACTIONS - AUTHENTICATED
// =============================================================================

/**
 * Initiate resumable upload session
 * Returns upload session for direct client-to-storage upload
 *
 * @param input - Upload initiation parameters
 * @returns Upload session with TUS/Resumable URL
 */
export const initiateUploadAction = withAuthInput<
  InitiateUploadInput,
  UploadSession
>(
  "initiateUploadAction",
  async (userId: string, input: InitiateUploadInput): Promise<ActionResponse<UploadSession>> => {
    try {
      // Rate limiting (10 uploads per 5 minutes)
      const rateLimitKey = RateLimitKeys.fileUpload(userId);
      const rateLimit = await checkRateLimit(rateLimitKey, RateLimitPresets.FILE_UPLOAD);

      if (!rateLimit.allowed) {
        logger.warn("Upload rate limit exceeded", {
          userId,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        });

        return {
          success: false,
          error: `Upload limit exceeded. You can upload again at ${new Date(rateLimit.resetAt).toLocaleTimeString()}. (${rateLimit.remaining} uploads remaining)`,
        };
      }

      // Validate file size using existing constants
      if (input.fileSize > VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES) {
        return {
          success: false,
          error: `File size cannot exceed ${VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES / 1024 / 1024}MB.`,
        };
      }

      if (input.fileSize <= 0) {
        return {
          success: false,
          error: "File cannot be empty.",
        };
      }

      // Get authenticated workspace (validates user session)
      const workspace = await getAuthenticatedWorkspace(userId);

      // Initiate resumable upload via storage abstraction
      const session = await storageInitiateUpload({
        fileName: input.fileName,
        fileSize: input.fileSize,
        contentType: input.contentType,
        bucket: input.bucket,
        path: input.path,
        metadata: {
          ...input.metadata,
          workspaceId: workspace.id,
          uploadedBy: userId,
        },
      });

      logger.info("Upload session initiated", {
        userId,
        workspaceId: workspace.id,
        fileName: input.fileName,
        bucket: input.bucket,
      });

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      logger.error("Failed to initiate upload", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });

      return {
        success: false,
        error: "Failed to initiate upload session. Please check your connection and try again.",
      };
    }
  }
);

/**
 * Verify upload completed successfully
 * Checks file exists in storage and returns public URL
 *
 * @param input - Upload verification parameters
 * @returns Verification result with URL
 */
export const verifyUploadAction = withAuthInput<
  VerifyUploadInput,
  VerifyUploadResult
>(
  "verifyUploadAction",
  async (userId: string, input: VerifyUploadInput): Promise<ActionResponse<VerifyUploadResult>> => {
    try {
      // Get authenticated workspace (validates user session)
      const workspace = await getAuthenticatedWorkspace(userId);

      // Verify upload via storage abstraction
      const verification = await storageVerifyUpload({
        uploadId: input.uploadId,
        bucket: input.bucket,
        path: input.path,
      });

      // Check verification success and URL presence
      if (!verification.success || !verification.url) {
        logger.warn("Upload verification failed", {
          userId,
          workspaceId: workspace.id,
          uploadId: input.uploadId,
          path: input.path,
          verificationSuccess: verification.success,
          hasUrl: !!verification.url,
        });

        return {
          success: false,
          error: "Upload completed but verification failed. Please contact support if this persists.",
        };
      }

      logger.info("Upload verified successfully", {
        userId,
        workspaceId: workspace.id,
        uploadId: input.uploadId,
        url: verification.url,
      });

      return {
        success: true,
        data: verification,
      };
    } catch (error) {
      logger.error("Failed to verify upload", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });

      return {
        success: false,
        error: "Failed to verify upload. Please check your connection and try again.",
      };
    }
  }
);

// =============================================================================
// ACTIONS - PUBLIC (NO AUTH)
// =============================================================================

/**
 * Initiate public upload session (no authentication required)
 * Generic action for public uploads - caller must validate permissions
 *
 * @param input - Public upload initiation parameters
 * @returns Upload session with TUS/Resumable URL
 */
export async function initiatePublicUploadAction(
  input: InitiatePublicUploadInput
): Promise<ActionResponse<UploadSession>> {
  try {
    // Rate limiting (if key provided)
    if (input.rateLimitKey) {
      const rateLimit = await checkRateLimit(input.rateLimitKey, RateLimitPresets.FILE_UPLOAD);

      if (!rateLimit.allowed) {
        logger.warn("Public upload rate limit exceeded", {
          rateLimitKey: input.rateLimitKey,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        });

        return {
          success: false,
          error: `Upload limit exceeded. Try again at ${new Date(rateLimit.resetAt).toLocaleTimeString()}.`,
        };
      }
    }

    // Validate file size
    if (input.fileSize > VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES) {
      return {
        success: false,
        error: `File size cannot exceed ${VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES / 1024 / 1024}MB.`,
      };
    }

    if (input.fileSize <= 0) {
      return {
        success: false,
        error: "File cannot be empty.",
      };
    }

    // Initiate resumable upload via storage abstraction
    const session = await storageInitiateUpload({
      fileName: input.fileName,
      fileSize: input.fileSize,
      contentType: input.contentType,
      bucket: input.bucket,
      path: input.path,
      metadata: input.metadata,
    });

    logger.info("Public upload session initiated", {
      fileName: input.fileName,
      bucket: input.bucket,
      metadata: input.metadata,
    });

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("Failed to initiate public upload", {
      error: error instanceof Error ? error.message : "Unknown error",
      fileName: input.fileName,
    });

    return {
      success: false,
      error: "Failed to initiate upload. Please check your connection and try again.",
    };
  }
}

/**
 * Verify public upload completed successfully (no authentication required)
 * Requires linkId and uploaderEmail to prevent enumeration attacks
 *
 * SECURITY: Returns 404 for unauthorized access to prevent enumeration
 * RLS policies on storage buckets provide additional protection
 *
 * @param input - Public upload verification parameters (including ownership context)
 * @returns Verification result with URL
 */
export async function verifyPublicUploadAction(
  input: VerifyPublicUploadInput
): Promise<ActionResponse<VerifyUploadResult>> {
  try {
    // Validate ownership parameters
    if (!input.linkId || !input.uploaderEmail) {
      logger.warn("Public upload verification missing ownership parameters", {
        uploadId: input.uploadId,
        hasLinkId: !!input.linkId,
        hasUploaderEmail: !!input.uploaderEmail,
      });

      return {
        success: false,
        error: "Upload not found.", // 404-style message to prevent enumeration
      };
    }

    // Validate path matches expected pattern (basic sanity check)
    // Path should contain linkId for proper isolation
    if (!input.path.includes(input.linkId)) {
      logger.warn("Public upload verification path mismatch", {
        uploadId: input.uploadId,
        linkId: input.linkId,
        path: input.path,
      });

      return {
        success: false,
        error: "Upload not found.", // 404-style message to prevent enumeration
      };
    }

    // Verify upload via storage abstraction
    const verification = await storageVerifyUpload({
      uploadId: input.uploadId,
      bucket: input.bucket,
      path: input.path,
    });

    // Check verification success and URL presence
    if (!verification.success || !verification.url) {
      logger.warn("Public upload verification failed", {
        uploadId: input.uploadId,
        linkId: input.linkId,
        uploaderEmail: input.uploaderEmail,
        path: input.path,
        verificationSuccess: verification.success,
        hasUrl: !!verification.url,
      });

      return {
        success: false,
        error: "Upload completed but verification failed. Please contact support if this persists.",
      };
    }

    logger.info("Public upload verified successfully", {
      uploadId: input.uploadId,
      linkId: input.linkId,
      uploaderEmail: input.uploaderEmail,
      url: verification.url,
    });

    return {
      success: true,
      data: verification,
    };
  } catch (error) {
    logger.error("Failed to verify public upload", {
      error: error instanceof Error ? error.message : "Unknown error",
      uploadId: input.uploadId,
      linkId: input.linkId,
    });

    return {
      success: false,
      error: "Failed to verify upload. Please check your connection and try again.",
    };
  }
}
