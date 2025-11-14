// =============================================================================
// USE UPPY UPLOAD HOOK - Uppy.js Integration for File Uploads
// =============================================================================
// React hook wrapper for Uppy file upload library
// Supports both Supabase (TUS) and GCS (Resumable) via storage abstraction

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload';
import { useAuth } from '@clerk/nextjs';
import {
  useInitiateUpload,
  useVerifyUpload,
  useInitiatePublicUpload,
  useVerifyPublicUpload,
} from '../data/use-storage';
import type { UploadSession } from '@/lib/storage/types';

// =============================================================================
// TYPES
// =============================================================================

interface UseUppyUploadOptions {
  bucket: string;
  authMode?: 'authenticated' | 'public'; // Default: 'authenticated'
  rateLimitKey?: string; // Required for public uploads (e.g., email+IP)
  linkId?: string; // Required for public uploads (ownership verification)
  uploaderEmail?: string; // Required for public uploads (ownership verification)
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadOptions {
  path: string;
  parentFolderId?: string | null; // For duplicate detection
  metadata?: Record<string, string>;
}

interface UploadResult {
  uniqueFileName: string;
  storagePath: string;
  url: string; // Public or signed URL (for branding/public uploads)
}

interface UseUppyUploadReturn {
  upload: (file: File, options: UploadOptions) => Promise<UploadResult>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  cancel: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * React hook for file uploads using Uppy.js
 *
 * Automatically configures Uppy to use:
 * - TUS protocol for Supabase Storage
 * - XHR Resumable Upload for Google Cloud Storage
 *
 * Based on STORAGE_PROVIDER environment variable.
 *
 * Supports two upload modes:
 * - **Authenticated**: Dashboard users (requires Clerk JWT token)
 * - **Public**: External users via shareable links (uses Supabase anon key)
 *
 * @param options - Upload configuration
 * @param options.bucket - Storage bucket name
 * @param options.authMode - Authentication mode: 'authenticated' (default) or 'public'
 * @param options.rateLimitKey - Required for public uploads (e.g., `upload:${email}:${ip}`)
 * @param options.onSuccess - Success callback with uploaded file URL
 * @param options.onError - Error callback
 * @returns Upload functions and state
 *
 * @example Authenticated Upload (Dashboard)
 * ```tsx
 * function LogoUpload({ linkId }: { linkId: string }) {
 *   const logoUpload = useUppyUpload({
 *     bucket: 'branding',
 *     authMode: 'authenticated',
 *     onSuccess: (url) => console.log('Uploaded:', url),
 *   });
 *
 *   const handleUpload = async (file: File) => {
 *     const url = await logoUpload.upload(file, {
 *       path: `branding/${workspaceId}/${linkId}`,
 *       metadata: { linkId, workspaceId },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
 *       {logoUpload.isUploading && <Progress percent={logoUpload.progress} />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Public Upload (Shareable Link)
 * ```tsx
 * function PublicFileUpload({ linkId, uploaderEmail }: Props) {
 *   const fileUpload = useUppyUpload({
 *     bucket: 'foldly-uploads',
 *     authMode: 'public',
 *     rateLimitKey: `upload:${uploaderEmail}:${getClientIP()}`,
 *     onSuccess: (url) => console.log('Uploaded:', url),
 *   });
 *
 *   const handleUpload = async (file: File) => {
 *     const url = await fileUpload.upload(file, {
 *       path: `uploads/${workspaceId}/${linkId}`,
 *       metadata: { linkId, uploaderEmail },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
 *       {fileUpload.isUploading && <Progress percent={fileUpload.progress} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUppyUpload(
  options: UseUppyUploadOptions
): UseUppyUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uppyRef = useRef<Uppy | null>(null);
  const sessionRef = useRef<UploadSession | null>(null);

  // Clerk authentication for Supabase Storage
  const { getToken } = useAuth();

  // Storage hooks (follow three-layer architecture)
  const authMode = options.authMode || 'authenticated';
  const initiateAuthUpload = useInitiateUpload();
  const verifyAuthUpload = useVerifyUpload();
  const initiatePublicUpload = useInitiatePublicUpload();
  const verifyPublicUpload = useVerifyPublicUpload();

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      if (uppyRef.current) {
        uppyRef.current.cancelAll();
        uppyRef.current = null;
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (uppyRef.current) {
      uppyRef.current.cancelAll();
      uppyRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
  }, []);

  const upload = useCallback(
    async (file: File, uploadOptions: UploadOptions): Promise<UploadResult> => {
      try {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        // Step 1: Initiate resumable upload to get session URL (via server action)
        // Includes duplicate detection for authenticated uploads
        const session = authMode === 'authenticated'
          ? await initiateAuthUpload.mutateAsync({
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              bucket: options.bucket,
              path: uploadOptions.path,
              parentFolderId: uploadOptions.parentFolderId,
              metadata: uploadOptions.metadata,
            })
          : await initiatePublicUpload.mutateAsync({
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              bucket: options.bucket,
              path: uploadOptions.path,
              metadata: uploadOptions.metadata,
              rateLimitKey: options.rateLimitKey,
            });

        sessionRef.current = session;

        // Step 2: Configure Uppy instance
        const uppy = new Uppy({
          id: `upload-${Date.now()}`,
          autoProceed: false,
          allowMultipleUploadBatches: false,
          restrictions: {
            maxNumberOfFiles: 1,
          },
        });

        uppyRef.current = uppy;

        // Determine storage provider from session
        const isTus = session.sessionUrl.includes('upload/resumable');

        if (isTus) {
          // Supabase Storage (TUS protocol)
          let authHeader: string;

          if (authMode === 'authenticated') {
            // Authenticated mode: Use Clerk JWT token
            const token = await getToken({ template: 'supabase' });

            if (!token) {
              throw new Error('Failed to get authentication token for upload');
            }

            authHeader = `Bearer ${token}`;
          } else {
            // Public mode: Use Supabase anon key
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!anonKey) {
              throw new Error('Supabase anon key not configured');
            }

            authHeader = `Bearer ${anonKey}`;
          }

          uppy.use(Tus, {
            endpoint: session.sessionUrl,
            chunkSize: session.chunkSize,
            headers: {
              Authorization: authHeader,
            },
            allowedMetaFields: [
              'bucketName',
              'objectName',
              'contentType',
              'cacheControl',
            ],
            retryDelays: [0, 1000, 3000, 5000],
            removeFingerprintOnSuccess: true,
          });
        } else {
          // Google Cloud Storage (XHR Resumable)
          uppy.use(XHRUpload, {
            endpoint: session.sessionUrl,
            method: 'PUT',
            fieldName: 'file',
            headers: {
              'Content-Type': file.type,
            },
          });
        }

        // Track progress
        uppy.on('progress', (progressValue) => {
          setProgress(Math.round(progressValue));
        });

        // Add file to Uppy with Supabase-required metadata
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
          meta: {
            bucketName: session.bucket,
            objectName: session.finalPath,
            contentType: file.type,
            cacheControl: '3600',
          },
        });

        // Step 3: Upload file
        const result = await uppy.upload();

        if (!result) {
          throw new Error('Upload failed: No result returned');
        }

        if (result.failed && result.failed.length > 0) {
          throw new Error(
            result.failed[0].error || 'Upload failed'
          );
        }

        // Step 4: Verify upload completed successfully (via server action)
        const verification = authMode === 'authenticated'
          ? await verifyAuthUpload.mutateAsync({
              uploadId: session.uploadId,
              bucket: options.bucket,
              path: session.finalPath,
            })
          : await verifyPublicUpload.mutateAsync({
              uploadId: session.uploadId,
              bucket: options.bucket,
              path: session.finalPath,
              linkId: options.linkId || '',
              uploaderEmail: options.uploaderEmail || '',
            });

        setProgress(100);
        setIsUploading(false);

        // Cleanup
        uppyRef.current = null;
        sessionRef.current = null;

        // Call success callback
        options.onSuccess?.(verification.url);

        return {
          uniqueFileName: session.uniqueFileName,
          storagePath: session.finalPath,
          url: verification.url,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        setIsUploading(false);

        // Cleanup on error
        if (uppyRef.current) {
          uppyRef.current.cancelAll();
          uppyRef.current = null;
        }
        sessionRef.current = null;

        // Call error callback
        options.onError?.(error);

        throw error;
      }
    },
    [options, authMode, getToken, initiateAuthUpload, verifyAuthUpload, initiatePublicUpload, verifyPublicUpload]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    cancel,
  };
}
