'use server';

import { linkUploadService } from '../services/link-upload-service';
import type { DatabaseResult } from '@/lib/database/types/common';

// =============================================================================
// TYPES
// =============================================================================

interface UploadToLinkResult {
  success: boolean;
  data?: {
    fileId: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
  };
  error?: string;
  quotaInfo?: any;
}

interface UploaderInfo {
  name: string;
  email?: string;
  message?: string;
}

// =============================================================================
// UPLOAD TO LINK ACTION - With Real-Time Expiration Checking
// =============================================================================

/**
 * Upload a file to a public shared link with comprehensive validation
 * Includes real-time expiration checking to prevent uploads to expired links
 */
export async function uploadFileToLinkAction(
  file: File,
  linkId: string,
  uploaderInfo: UploaderInfo,
  folderId?: string,
  password?: string
): Promise<UploadToLinkResult> {
  try {
    console.log(`🔄 Starting upload to link ${linkId} by ${uploaderInfo.name}`);

    // Use service to handle the entire upload process
    const result = await linkUploadService.uploadFileToLink(
      file,
      linkId,
      uploaderInfo,
      folderId,
      password
    );

    if (!result.success) {
      console.error(`❌ Upload failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log(`✅ Upload completed successfully: ${result.data.fileName} to link ${linkId}`);

    return {
      success: true,
      data: {
        fileId: result.data.fileId,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
        uploadedAt: result.data.uploadedAt,
      },
      quotaInfo: result.data.quotaInfo,
    };
  } catch (error) {
    console.error('❌ Upload to link failed:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Upload failed due to an unexpected error',
    };
  }
}

/**
 * Validate if a link can accept uploads (without actually uploading)
 * Useful for frontend validation before showing upload interface
 */
export async function validateLinkForUploadAction(
  linkId: string,
  password?: string
): Promise<
  DatabaseResult<{
    canUpload: boolean;
    requiresPassword: boolean;
    requiresEmail: boolean;
    maxFiles: number;
    maxFileSize: number;
    allowedFileTypes: string[] | null;
    remainingUploads: number;
    linkTitle: string;
    linkType: string;
  }>
> {
  try {
    // Use service to validate link for upload
    return await linkUploadService.validateLinkForUpload(linkId, password);
  } catch (error) {
    console.error('Failed to validate link for upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}
