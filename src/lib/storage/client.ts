// =============================================================================
// STORAGE CLIENT - Provider Abstraction Layer
// =============================================================================
// Routes storage operations to the correct provider based on STORAGE_PROVIDER
// environment variable. Allows seamless switching between Supabase and GCS.

import { logger } from '@/lib/utils/logger';

// Import both provider implementations
import * as gcsClient from './gcs/client';
import * as supabaseClient from './supabase/client';

/**
 * Get the configured storage provider
 * Defaults to 'supabase' if not set
 */
function getStorageProvider(): 'supabase' | 'gcs' {
  const provider = process.env.STORAGE_PROVIDER;

  if (!provider) {
    logger.warn('STORAGE_PROVIDER not set, defaulting to supabase');
    return 'supabase';
  }

  if (provider !== 'supabase' && provider !== 'gcs') {
    logger.error(`Invalid STORAGE_PROVIDER: ${provider}. Must be 'supabase' or 'gcs'. Defaulting to supabase.`);
    return 'supabase';
  }

  return provider;
}

/**
 * Upload file to configured storage provider
 *
 * @param params - Upload parameters
 * @returns Public URL and storage path
 *
 * @example
 * ```typescript
 * const { url, gcsPath } = await uploadFile({
 *   file: fileBuffer,
 *   fileName: 'logo.png',
 *   path: 'branding/workspace123/link456',
 *   bucket: 'foldly-link-branding',
 *   contentType: 'image/png',
 * });
 * ```
 */
export async function uploadFile(params: {
  file: Buffer;
  fileName: string;
  path: string;
  bucket: string;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; gcsPath: string }> {
  const provider = getStorageProvider();

  if (provider === 'gcs') {
    return gcsClient.uploadFile(params);
  }

  return supabaseClient.uploadFile(params);
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

  if (provider === 'gcs') {
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

  if (provider === 'gcs') {
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

  if (provider === 'gcs') {
    return gcsClient.fileExists(params);
  }

  return supabaseClient.fileExists(params);
}

/**
 * Get the current storage provider name
 * Useful for logging and debugging
 */
export function getCurrentProvider(): 'supabase' | 'gcs' {
  return getStorageProvider();
}
