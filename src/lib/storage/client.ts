// =============================================================================
// STORAGE CLIENT - Provider Abstraction Layer
// =============================================================================
// Routes storage operations to the correct provider based on STORAGE_PROVIDER
// environment variable. Allows seamless switching between Supabase and GCS.

import { logger } from "@/lib/utils/logger";

// Import both provider implementations
import * as gcsClient from "./gcs/client";
import * as supabaseClient from "./supabase/client";

// Import types
import type {
  UploadSession,
  InitiateUploadParams,
  VerifyUploadParams,
  UploadVerificationResult,
} from "./types";

/**
 * Get the configured storage provider
 * Defaults to 'supabase' if not set
 */
function getStorageProvider(): "supabase" | "gcs" {
  const provider = process.env.STORAGE_PROVIDER;

  if (!provider) {
    logger.warn("STORAGE_PROVIDER not set, defaulting to supabase");
    return "supabase";
  }

  if (provider !== "supabase" && provider !== "gcs") {
    logger.error(
      `Invalid STORAGE_PROVIDER: ${provider}. Must be 'supabase' or 'gcs'. Defaulting to supabase.`
    );
    return "supabase";
  }

  return provider;
}

/**
 * Upload file to configured storage provider
 *
 * Accepts both Buffer (Node.js) and Uint8Array (browser) for maximum flexibility.
 * The storage provider implementation will handle the necessary conversions internally.
 *
 * @param params - Upload parameters
 * @returns Public URL and storage path
 *
 * @example
 * ```typescript
 * // From server action with Buffer
 * const { url, gcsPath } = await uploadFile({
 *   file: fileBuffer,
 *   fileName: 'logo.png',
 *   path: 'branding/workspace123/link456',
 *   bucket: 'foldly-link-branding',
 *   contentType: 'image/png',
 * });
 *
 * // From client via server action with Uint8Array
 * const fileData = await serializeFileForUpload(file);
 * await uploadAction({ file: fileData.buffer, ... });
 * ```
 */
export async function uploadFile(params: {
  file: Buffer | Uint8Array;
  fileName: string;
  path: string;
  bucket: string;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; gcsPath: string }> {
  const provider = getStorageProvider();

  // Convert Uint8Array to Buffer for providers that need it
  const normalizedParams = {
    ...params,
    file: Buffer.isBuffer(params.file) ? params.file : Buffer.from(params.file),
  };

  if (provider === "gcs") {
    return gcsClient.uploadFile(normalizedParams);
  }

  return supabaseClient.uploadFile(normalizedParams);
}

/**
 * Delete file from configured storage provider
 *
 * @param params - Delete parameters
 *
 * @example
 * ```typescript
 * await deleteFile({
 *   gcsPath: 'branding/workspace123/link456/logo.png',
 *   bucket: 'foldly-link-branding',
 * });
 * ```
 */
export async function deleteFile(params: {
  gcsPath: string;
  bucket: string;
}): Promise<void> {
  const provider = getStorageProvider();

  if (provider === "gcs") {
    return gcsClient.deleteFile(params);
  }

  return supabaseClient.deleteFile(params);
}

/**
 * Generate signed URL for private file access
 *
 * @param params - Signed URL parameters
 * @returns Signed URL valid for specified duration
 *
 * @example
 * ```typescript
 * const signedUrl = await getSignedUrl({
 *   gcsPath: 'uploads/workspace123/file.pdf',
 *   bucket: 'foldly-uploads',
 *   expiresIn: 3600,
 * });
 * ```
 */
export async function getSignedUrl(params: {
  gcsPath: string;
  bucket: string;
  expiresIn?: number;
}): Promise<string> {
  const provider = getStorageProvider();

  if (provider === "gcs") {
    return gcsClient.getSignedUrl(params);
  }

  return supabaseClient.getSignedUrl(params);
}

/**
 * Check if file exists in configured storage provider
 *
 * @param params - File check parameters
 * @returns True if file exists
 *
 * @example
 * ```typescript
 * const exists = await fileExists({
 *   gcsPath: 'branding/workspace123/link456/logo.png',
 *   bucket: 'foldly-link-branding',
 * });
 * ```
 */
export async function fileExists(params: {
  gcsPath: string;
  bucket: string;
}): Promise<boolean> {
  const provider = getStorageProvider();

  if (provider === "gcs") {
    return gcsClient.fileExists(params);
  }

  return supabaseClient.fileExists(params);
}

/**
 * Get the current storage provider name
 * Useful for logging and debugging
 */
export function getCurrentProvider(): "supabase" | "gcs" {
  return getStorageProvider();
}

// =============================================================================
// RESUMABLE UPLOAD METHODS (Provider-Agnostic)
// =============================================================================

/**
 * Initiate resumable upload session
 * Routes to provider-specific implementation (TUS for Supabase, Resumable API for GCS)
 *
 * Returns session configuration for direct client-to-storage upload.
 * Client uploads file in chunks directly to storage, bypassing Server Actions.
 *
 * @param params - Upload initiation parameters
 * @returns Upload session with provider-specific upload URL
 *
 * @example
 * ```typescript
 * // Server action initiates upload
 * const session = await initiateResumableUpload({
 *   fileName: 'logo.png',
 *   fileSize: 2048000,
 *   contentType: 'image/png',
 *   bucket: 'foldly-link-branding',
 *   path: 'branding/workspace123/link456',
 * });
 *
 * // Client uploads directly to session.sessionUrl
 * // Then calls verification action
 * ```
 */
export async function initiateResumableUpload(
  params: InitiateUploadParams
): Promise<UploadSession> {
  const provider = getStorageProvider();

  if (provider === "gcs") {
    return gcsClient.initiateResumableUpload(params);
  }

  return supabaseClient.initiateResumableUpload(params);
}

/**
 * Verify upload completion
 * Checks that file exists in storage and returns public URL
 *
 * Call this after client completes direct upload to storage.
 * Verifies file integrity and retrieves URL for database storage.
 *
 * @param params - Verification parameters
 * @returns Verification result with file URL
 *
 * @example
 * ```typescript
 * // After client completes upload
 * const result = await verifyUpload({
 *   uploadId: session.uploadId,
 *   bucket: 'foldly-link-branding',
 *   path: 'branding/workspace123/link456/logo.png',
 * });
 *
 * if (result.success) {
 *   // Update database with result.url
 * }
 * ```
 */
export async function verifyUpload(
  params: VerifyUploadParams
): Promise<UploadVerificationResult> {
  const provider = getStorageProvider();

  if (provider === "gcs") {
    return gcsClient.verifyUpload(params);
  }

  return supabaseClient.verifyUpload(params);
}
