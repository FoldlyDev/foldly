// =============================================================================
// GOOGLE CLOUD STORAGE CLIENT
// =============================================================================
// Configuration for Google Cloud Storage
// Provides singleton client instance for file upload operations

import { Storage } from '@google-cloud/storage';
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
 * Validates required GCS environment variables
 */
function validateGCSEnv(): void {
  if (!process.env.GCS_PROJECT_ID) {
    throw new Error(
      'GCS_PROJECT_ID environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!process.env.GCS_CLIENT_EMAIL) {
    throw new Error(
      'GCS_CLIENT_EMAIL environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!process.env.GCS_PRIVATE_KEY) {
    throw new Error(
      'GCS_PRIVATE_KEY environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }
}

/**
 * Initialize GCS client with service account credentials
 */
function initializeGCS(): Storage {
  validateGCSEnv();

  const projectId = process.env.GCS_PROJECT_ID!;
  const clientEmail = process.env.GCS_CLIENT_EMAIL!;
  const privateKey = process.env.GCS_PRIVATE_KEY!;

  // Decode private key if it's base64 encoded
  const decodedPrivateKey = privateKey.includes('\\n')
    ? privateKey
    : Buffer.from(privateKey, 'base64').toString('utf-8');

  return new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: decodedPrivateKey,
    },
  });
}

// Singleton GCS client
let gcsClient: Storage | null = null;

/**
 * Get GCS client singleton instance
 *
 * @returns Storage client instance
 *
 * @example
 * ```typescript
 * import { getGCSClient } from '@/lib/gcs/client';
 *
 * const storage = getGCSClient();
 * const bucket = storage.bucket('my-bucket');
 * ```
 */
export function getGCSClient(): Storage {
  if (!gcsClient) {
    gcsClient = initializeGCS();
  }
  return gcsClient;
}

/**
 * Upload file to GCS bucket
 *
 * @param params - Upload parameters
 * @returns GCS public URL and path
 *
 * @example
 * ```typescript
 * const { url, gcsPath } = await uploadFile({
 *   file: fileBuffer,
 *   fileName: 'logo.png',
 *   path: 'branding/workspace123/link456',
 *   bucket: 'foldly-branding',
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
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);

    // Full path in bucket: path/fileName
    const gcsPath = `${path}/${fileName}`;
    const fileRef = bucketInstance.file(gcsPath);

    // Upload file
    await fileRef.save(file, {
      contentType,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
      public: true,
    });

    // Generate public URL
    const url = `https://storage.googleapis.com/${bucket}/${gcsPath}`;

    logger.info('File uploaded to GCS', {
      bucket,
      gcsPath,
      contentType,
      size: file.length,
    });

    return { url, gcsPath };
  } catch (error) {
    logger.error('Failed to upload file to GCS', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
      fileName,
    });
    throw new Error('Failed to upload file to cloud storage.');
  }
}

/**
 * Delete file from GCS bucket
 *
 * @param params - Delete parameters
 *
 * @example
 * ```typescript
 * await deleteFile({
 *   gcsPath: 'branding/workspace123/link456/logo.png',
 *   bucket: 'foldly-branding',
 * });
 * ```
 */
export async function deleteFile(params: {
  gcsPath: string;
  bucket: string;
}): Promise<void> {
  const { gcsPath, bucket } = params;

  try {
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);
    const fileRef = bucketInstance.file(gcsPath);

    await fileRef.delete();

    logger.info('File deleted from GCS', {
      bucket,
      gcsPath,
    });
  } catch (error) {
    logger.error('Failed to delete file from GCS', {
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
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);
    const fileRef = bucketInstance.file(gcsPath);

    const [signedUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    logger.info('Generated signed URL', {
      bucket,
      gcsPath,
      expiresIn,
    });

    return signedUrl;
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
 * Check if file exists in GCS bucket
 *
 * @param params - File check parameters
 * @returns True if file exists
 *
 * @example
 * ```typescript
 * const exists = await fileExists({
 *   gcsPath: 'branding/workspace123/link456/logo.png',
 *   bucket: 'foldly-branding',
 * });
 * ```
 */
export async function fileExists(params: {
  gcsPath: string;
  bucket: string;
}): Promise<boolean> {
  const { gcsPath, bucket } = params;

  try {
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);
    const fileRef = bucketInstance.file(gcsPath);

    const [exists] = await fileRef.exists();
    return exists;
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
// RESUMABLE UPLOAD METHODS (GCS Resumable Upload API)
// =============================================================================

/**
 * Initiate GCS resumable upload session
 * Returns session URL for client-side chunked upload
 *
 * GCS Resumable Upload: https://cloud.google.com/storage/docs/resumable-uploads
 *
 * @param params - Upload initiation parameters
 * @returns Upload session with resumable session URL and configuration
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
 * // Client uploads directly to session.sessionUrl using GCS resumable API
 * ```
 */
export async function initiateResumableUpload(
  params: InitiateUploadParams
): Promise<UploadSession> {
  const { fileName, fileSize, contentType, bucket, path, metadata = {} } = params;

  try {
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);

    const filePath = `${path}/${fileName}`;
    const fileRef = bucketInstance.file(filePath);

    // Create resumable upload session
    // This generates a unique session URL for client-side upload
    const [sessionUrl] = await fileRef.createResumableUpload({
      metadata: {
        contentType,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        },
      },
      origin: '*', // Allow CORS from any origin (adjust for production)
    });

    // Generate unique upload ID for tracking
    const uploadId = crypto.randomUUID();

    logger.info('Initiated GCS resumable upload session', {
      bucket,
      filePath,
      fileSize,
      sessionUrl,
      chunkSize: DEFAULT_CHUNK_SIZES.GCS,
    });

    return {
      uploadId,
      sessionUrl,
      chunkSize: DEFAULT_CHUNK_SIZES.GCS,
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
      finalPath: filePath,
      bucket,
    };
  } catch (error) {
    logger.error('Failed to initiate GCS resumable upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
      fileName,
    });
    throw new Error('Failed to initiate file upload.');
  }
}

/**
 * Verify upload completion in GCS
 * Checks that file exists and returns public URL
 *
 * Call this after client completes resumable upload to:
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
    const storage = getGCSClient();
    const bucketInstance = storage.bucket(bucket);
    const fileRef = bucketInstance.file(path);

    // Check if file exists
    const [exists] = await fileRef.exists();

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

    // Generate public URL
    const url = `https://storage.googleapis.com/${bucket}/${path}`;

    logger.info('Upload verified successfully', {
      bucket,
      path,
      url,
    });

    return {
      success: true,
      url,
    };
  } catch (error) {
    logger.error('Failed to verify GCS upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path,
    });
    throw new Error('Failed to verify file upload.');
  }
}
