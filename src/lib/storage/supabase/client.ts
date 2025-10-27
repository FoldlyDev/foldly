// =============================================================================
// SUPABASE STORAGE CLIENT
// =============================================================================
// Configuration for Supabase Storage
// Provides storage operations matching GCS interface for easy provider switching

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import type {
  UploadSession,
  InitiateUploadParams,
  VerifyUploadParams,
  UploadVerificationResult,
} from '../types';
import {
  DEFAULT_CHUNK_SIZES,
  SESSION_EXPIRATION_MS,
} from '../types';

/**
 * Validates required Supabase environment variables
 */
function validateSupabaseEnv(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }
}

/**
 * Initialize Supabase client with service role key (for admin operations)
 */
function initializeSupabaseStorage(): SupabaseClient {
  validateSupabaseEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client singleton instance
 *
 * @returns Supabase client instance
 *
 * @example
 * ```typescript
 * import { getSupabaseStorageClient } from '@/lib/storage/supabase/client';
 *
 * const supabase = getSupabaseStorageClient();
 * const { data, error } = await supabase.storage.from('bucket').list();
 * ```
 */
export function getSupabaseStorageClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = initializeSupabaseStorage();
  }
  return supabaseClient;
}

/**
 * Upload file to Supabase Storage bucket
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
  const { file, fileName, path, bucket, contentType, metadata = {} } = params;

  try {
    const supabase = getSupabaseStorageClient();

    // Full path in bucket: path/fileName (matching GCS format)
    const storagePath = `${path}/${fileName}`;

    // Convert Buffer to Uint8Array for Supabase upload
    const fileData = new Uint8Array(file);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileData, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const url = urlData.publicUrl;

    logger.info('File uploaded to Supabase Storage', {
      bucket,
      storagePath,
      contentType,
      size: file.length,
    });

    // Return in GCS-compatible format (gcsPath = storagePath for interface compatibility)
    return { url, gcsPath: storagePath };
  } catch (error) {
    logger.error('Failed to upload file to Supabase Storage', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
      fileName,
    });
    throw new Error('Failed to upload file to cloud storage.');
  }
}

/**
 * Delete file from Supabase Storage bucket
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
  const { gcsPath, bucket } = params;

  try {
    const supabase = getSupabaseStorageClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([gcsPath]);

    if (error) {
      throw error;
    }

    logger.info('File deleted from Supabase Storage', {
      bucket,
      gcsPath,
    });
  } catch (error) {
    logger.error('Failed to delete file from Supabase Storage', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      gcsPath,
    });
    throw new Error('Failed to delete file from cloud storage.');
  }
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
  const { gcsPath, bucket, expiresIn = 3600 } = params;

  try {
    const supabase = getSupabaseStorageClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(gcsPath, expiresIn);

    if (error) {
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    logger.info('Generated signed URL', {
      bucket,
      gcsPath,
      expiresIn,
    });

    return data.signedUrl;
  } catch (error) {
    logger.error('Failed to generate signed URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      gcsPath,
    });
    throw new Error('Failed to generate file access URL.');
  }
}

/**
 * Check if file exists in Supabase Storage bucket
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
  const { gcsPath, bucket } = params;

  try {
    const supabase = getSupabaseStorageClient();

    // Supabase doesn't have a direct "exists" method, so we try to get file info
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(gcsPath.substring(0, gcsPath.lastIndexOf('/')), {
        limit: 1,
        search: gcsPath.substring(gcsPath.lastIndexOf('/') + 1),
      });

    // If no error and we found the file, it exists
    return !error && data !== null && data.length > 0;
  } catch (error) {
    logger.error('Failed to check file existence', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      gcsPath,
    });
    return false;
  }
}

// =============================================================================
// RESUMABLE UPLOAD METHODS (TUS Protocol)
// =============================================================================

/**
 * Initiate TUS resumable upload session for Supabase Storage
 * Returns session URL and configuration for client-side chunked upload
 *
 * TUS Protocol: https://tus.io/
 * Supabase Endpoint: {SUPABASE_URL}/storage/v1/upload/resumable
 *
 * @param params - Upload initiation parameters
 * @returns Upload session with TUS endpoint and configuration
 *
 * @example
 * ```typescript
 * const session = await initiateResumableUpload({
 *   fileName: 'logo.png',
 *   fileSize: 102400,
 *   contentType: 'image/png',
 *   bucket: 'foldly-link-branding',
 *   path: 'branding/workspace123/link456',
 * });
 * // Client uploads directly to session.sessionUrl using TUS protocol
 * ```
 */
export async function initiateResumableUpload(
  params: InitiateUploadParams
): Promise<UploadSession> {
  const { fileName, bucket, path } = params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
    }

    const filePath = `${path}/${fileName}`;

    // Supabase TUS endpoint for resumable uploads
    // Note: Bucket and file path are passed as Uppy metadata, not in URL
    const tusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

    // Generate unique upload ID for tracking
    const uploadId = crypto.randomUUID();

    logger.info('Initiated TUS resumable upload session', {
      bucket,
      filePath,
      tusEndpoint,
      chunkSize: DEFAULT_CHUNK_SIZES.SUPABASE,
    });

    return {
      uploadId,
      sessionUrl: tusEndpoint,
      chunkSize: DEFAULT_CHUNK_SIZES.SUPABASE,
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
      finalPath: filePath,
      bucket,
    };
  } catch (error) {
    logger.error('Failed to initiate resumable upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
      fileName,
    });
    throw new Error('Failed to initiate file upload.');
  }
}

/**
 * Verify upload completion in Supabase Storage
 * Checks that file exists and returns public URL
 *
 * Call this after client completes TUS upload to:
 * 1. Verify file was uploaded successfully
 * 2. Get public URL for database storage
 *
 * @param params - Verification parameters
 * @returns Verification result with file URL
 *
 * @example
 * ```typescript
 * const result = await verifyUpload({
 *   uploadId: 'abc123',
 *   bucket: 'foldly-link-branding',
 *   path: 'branding/workspace123/link456/logo.png',
 * });
 * if (result.success) {
 *   // Store result.url in database
 * }
 * ```
 */
export async function verifyUpload(
  params: VerifyUploadParams
): Promise<UploadVerificationResult> {
  const { bucket, path } = params;

  try {
    const supabase = getSupabaseStorageClient();

    // Check if file exists
    const exists = await fileExists({ gcsPath: path, bucket });

    if (!exists) {
      logger.warn('Upload verification failed: file not found', {
        bucket,
        path,
      });
      return {
        success: false,
        url: '',
      };
    }

    // Get public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    logger.info('Upload verified successfully', {
      bucket,
      path,
      url: data.publicUrl,
    });

    return {
      success: true,
      url: data.publicUrl,
    };
  } catch (error) {
    logger.error('Failed to verify upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
    });
    throw new Error('Failed to verify file upload.');
  }
}
