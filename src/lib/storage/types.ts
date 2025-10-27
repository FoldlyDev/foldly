// =============================================================================
// STORAGE TYPES - Provider-Agnostic Type Definitions
// =============================================================================
// Type definitions for resumable upload sessions and storage operations
// Supports both Supabase Storage (TUS) and Google Cloud Storage (Resumable)

/**
 * Upload session configuration returned by storage providers
 * Contains all information needed for client to perform resumable upload
 *
 * @property uploadId - Unique identifier for this upload session
 * @property sessionUrl - TUS endpoint (Supabase) or resumable session URL (GCS)
 * @property chunkSize - Recommended chunk size in bytes for this provider
 * @property expiresAt - Session expiration timestamp
 * @property finalPath - Storage path where file will be stored
 * @property bucket - Storage bucket name
 */
export interface UploadSession {
  /** Unique identifier for this upload session */
  uploadId: string;

  /** TUS endpoint (Supabase) or resumable session URL (GCS) */
  sessionUrl: string;

  /** Recommended chunk size in bytes for this provider */
  chunkSize: number;

  /** Session expiration timestamp */
  expiresAt: Date;

  /** Storage path where file will be stored */
  finalPath: string;

  /** Storage bucket name */
  bucket: string;
}

/**
 * Parameters for initiating a resumable upload
 *
 * @property fileName - Name of the file to upload
 * @property fileSize - Size of the file in bytes
 * @property contentType - MIME type of the file
 * @property bucket - Storage bucket name
 * @property path - Directory path within bucket (without filename)
 * @property metadata - Optional metadata to attach to the file
 */
export interface InitiateUploadParams {
  /** Name of the file to upload */
  fileName: string;
  /** Size of the file in bytes */
  fileSize: number;
  /** MIME type of the file */
  contentType: string;
  /** Storage bucket name */
  bucket: string;
  /** Directory path within bucket (without filename) */
  path: string;
  /** Optional metadata to attach to the file */
  metadata?: Record<string, string>;
}

/**
 * Parameters for verifying upload completion
 *
 * @property uploadId - Unique identifier from upload session
 * @property bucket - Storage bucket name
 * @property path - Full file path in storage
 */
export interface VerifyUploadParams {
  /** Unique identifier from upload session */
  uploadId: string;
  /** Storage bucket name */
  bucket: string;
  /** Full file path in storage */
  path: string;
}

/**
 * Upload verification result
 *
 * @property success - Whether upload was successful
 * @property url - Public or signed URL to access the uploaded file
 */
export interface UploadVerificationResult {
  /** Whether upload was successful */
  success: boolean;
  /** Public or signed URL to access the uploaded file */
  url: string;
}

/**
 * Progress callback for upload operations
 * @param percent - Upload progress percentage (0-100)
 * @param bytesUploaded - Number of bytes uploaded so far
 * @param totalBytes - Total file size in bytes
 */
export type UploadProgressCallback = (
  percent: number,
  bytesUploaded: number,
  totalBytes: number
) => void;

/**
 * Default chunk sizes by provider
 */
export const DEFAULT_CHUNK_SIZES = {
  /** Supabase recommends 6MB chunks for TUS uploads */
  SUPABASE: 6 * 1024 * 1024, // 6MB
  /** GCS recommends 256KB chunks for resumable uploads */
  GCS: 256 * 1024, // 256KB
} as const;

/**
 * Upload session expiration time (24 hours)
 */
export const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
