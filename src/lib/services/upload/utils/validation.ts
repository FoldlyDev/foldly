/**
 * Upload Validation Utilities
 * Centralized validation logic for file uploads
 */

import type { UploadContext, FileValidationResult, ValidationError } from '../types';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';
import { isWorkspaceContext } from '../types';

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

/**
 * Allowed file types by category
 */
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

/**
 * Blocked file extensions for security
 */
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.dmg', '.pkg', '.run', '.sh', '.bash'
];

/**
 * Validate file before upload
 */
export async function validateFile(
  file: File,
  context: UploadContext,
  options?: {
    maxFileSize?: number;
    allowedTypes?: string[];
    blockedTypes?: string[];
  }
): Promise<FileValidationResult> {
  const errors: ValidationError[] = [];
  const warnings = [];

  // Check file size
  const maxSize = options?.maxFileSize || DEFAULT_MAX_FILE_SIZE;
  if (file.size > maxSize) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(maxSize)})`,
      field: 'size',
      details: { fileSize: file.size, maxSize },
    });
  }

  // Check file extension
  const fileExtension = getFileExtension(file.name);
  if (BLOCKED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
    errors.push({
      code: 'BLOCKED_FILE_TYPE',
      message: `File type ${fileExtension} is not allowed for security reasons`,
      field: 'type',
      details: { extension: fileExtension },
    });
  }

  // Check MIME type if allowed types are specified
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      errors.push({
        code: 'INVALID_FILE_TYPE',
        message: `File type ${file.type} is not in the allowed list`,
        field: 'type',
        details: { type: file.type, allowed: options.allowedTypes },
      });
    }
  }

  // Check quota for workspace uploads
  if (isWorkspaceContext(context)) {
    const quotaCheck = await checkUserQuota(context.userId, file.size);
    if (!quotaCheck.canUpload) {
      errors.push({
        code: 'QUOTA_EXCEEDED',
        message: quotaCheck.reason || 'Storage quota exceeded',
        field: 'quota',
        details: {
          currentUsage: quotaCheck.currentUsage,
          limit: quotaCheck.limit,
          fileSize: file.size,
        },
      });
    } else if (quotaCheck.nearLimit) {
      warnings.push({
        code: 'QUOTA_WARNING',
        message: `You're approaching your storage limit (${quotaCheck.percentageUsed}% used)`,
        suggestion: 'Consider upgrading your plan or removing old files',
      });
    }
  }

  // Check file name for suspicious patterns
  if (containsSuspiciousPattern(file.name)) {
    warnings.push({
      code: 'SUSPICIOUS_FILENAME',
      message: 'File name contains unusual characters',
      suggestion: 'Consider renaming the file with standard characters',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check user storage quota
 */
async function checkUserQuota(
  userId: string,
  fileSize: number
): Promise<{
  canUpload: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
  nearLimit: boolean;
}> {
  try {
    const quotaStatus = await storageQuotaService.checkUserQuota(userId, fileSize);
    
    return {
      canUpload: quotaStatus.canUpload,
      reason: quotaStatus.canUpload ? undefined : 'Storage quota exceeded',
      currentUsage: quotaStatus.currentUsage,
      limit: quotaStatus.limit,
      percentageUsed: Math.round((quotaStatus.currentUsage / quotaStatus.limit) * 100),
      nearLimit: quotaStatus.currentUsage / quotaStatus.limit > 0.8,
    };
  } catch (error) {
    // If quota check fails, allow upload but log error
    console.error('Failed to check user quota:', error);
    return {
      canUpload: true,
      currentUsage: 0,
      limit: DEFAULT_MAX_FILE_SIZE,
      percentageUsed: 0,
      nearLimit: false,
    };
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Check for suspicious patterns in filename
 */
function containsSuspiciousPattern(filename: string): boolean {
  // Check for path traversal attempts
  if (filename.includes('../') || filename.includes('..\\')) {
    return true;
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(filename)) {
    return true;
  }

  // Check for extremely long filenames
  if (filename.length > 255) {
    return true;
  }

  return false;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || filename;
  
  // Replace unsafe characters
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Generate unique filename to avoid collisions
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  const extension = getFileExtension(originalName);
  const basename = originalName.substring(0, originalName.lastIndexOf('.') || originalName.length);
  
  return `${sanitizeFilename(basename)}_${timestamp}_${random}${extension}`;
}