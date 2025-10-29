// =============================================================================
// USE STORAGE HOOKS - Global Storage Operations
// =============================================================================
// React Query hooks for storage operations (cross-module usage)

'use client';

import { useMutation } from '@tanstack/react-query';
import {
  initiateUploadAction,
  verifyUploadAction,
  initiatePublicUploadAction,
  verifyPublicUploadAction,
  type InitiateUploadInput,
  type VerifyUploadInput,
  type InitiatePublicUploadInput,
  type VerifyPublicUploadInput,
} from '@/lib/actions/storage.actions';
import {
  transformActionError,
  createMutationErrorHandler,
} from '@/lib/utils/react-query-helpers';

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Initiate resumable upload session
 *
 * Used by:
 * - useUppyUpload hook (orchestration)
 * - Any component needing direct storage uploads
 *
 * @returns Mutation for initiating upload session
 *
 * @example
 * ```tsx
 * const initiateUpload = useInitiateUpload();
 *
 * const session = await initiateUpload.mutateAsync({
 *   fileName: 'logo.png',
 *   fileSize: 102400,
 *   contentType: 'image/png',
 *   bucket: 'branding',
 *   path: 'workspace/link',
 * });
 * ```
 */
export function useInitiateUpload() {
  return useMutation({
    mutationFn: async (input: InitiateUploadInput) => {
      const result = await initiateUploadAction(input);
      return transformActionError(result, 'Failed to initiate upload');
    },
    retry: false, // Never retry mutations
    onError: createMutationErrorHandler('Upload initiation'),
  });
}

/**
 * Verify upload completed successfully
 *
 * Used by:
 * - useUppyUpload hook (orchestration)
 * - Any component needing upload verification
 *
 * @returns Mutation for verifying upload
 *
 * @example
 * ```tsx
 * const verifyUpload = useVerifyUpload();
 *
 * const result = await verifyUpload.mutateAsync({
 *   uploadId: session.uploadId,
 *   bucket: 'branding',
 *   path: session.finalPath,
 * });
 * ```
 */
export function useVerifyUpload() {
  return useMutation({
    mutationFn: async (input: VerifyUploadInput) => {
      const result = await verifyUploadAction(input);
      return transformActionError(result, 'Failed to verify upload');
    },
    retry: false, // Never retry mutations
    onError: createMutationErrorHandler('Upload verification'),
  });
}

/**
 * Initiate public upload (no authentication required)
 *
 * Used by:
 * - Uploads module (external users uploading via shareable links)
 * - Any module needing public file uploads
 *
 * @returns Mutation for initiating public upload session
 *
 * @example
 * ```tsx
 * const initiatePublicUpload = useInitiatePublicUpload();
 *
 * const session = await initiatePublicUpload.mutateAsync({
 *   fileName: 'document.pdf',
 *   fileSize: 204800,
 *   contentType: 'application/pdf',
 *   bucket: 'foldly-uploads',
 *   path: 'uploads/workspace/link',
 *   rateLimitKey: `upload:${email}:${ip}`,
 *   metadata: { linkId, uploaderEmail },
 * });
 * ```
 */
export function useInitiatePublicUpload() {
  return useMutation({
    mutationFn: async (input: InitiatePublicUploadInput) => {
      const result = await initiatePublicUploadAction(input);
      return transformActionError(result, 'Failed to initiate upload');
    },
    retry: false,
    onError: createMutationErrorHandler('Public upload initiation'),
  });
}

/**
 * Verify public upload completed successfully (no authentication required)
 *
 * Used by:
 * - Uploads module (external users)
 * - Any module needing public upload verification
 *
 * @returns Mutation for verifying public upload
 *
 * @example
 * ```tsx
 * const verifyPublicUpload = useVerifyPublicUpload();
 *
 * const result = await verifyPublicUpload.mutateAsync({
 *   uploadId: session.uploadId,
 *   bucket: 'foldly-uploads',
 *   path: session.finalPath,
 * });
 * ```
 */
export function useVerifyPublicUpload() {
  return useMutation({
    mutationFn: async (input: VerifyPublicUploadInput) => {
      const result = await verifyPublicUploadAction(input);
      return transformActionError(result, 'Failed to verify upload');
    },
    retry: false,
    onError: createMutationErrorHandler('Public upload verification'),
  });
}
