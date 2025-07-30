/**
 * Shared File Validation Utilities
 * Common validation logic used by both link uploads and workspace uploads
 */

import type { ValidationError } from '@/types/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface FileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  fileSize: number;
  fileType: string;
  fileName: string;
}

export interface FileConstraints {
  maxFileSize?: number;
  allowedFileTypes?: string[];
  blockedFileTypes?: string[];
  maxFiles?: number;
  allowDuplicates?: boolean;
  maxFileNameLength?: number;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a single file against constraints
 */
export function validateFile(
  file: File,
  constraints: FileConstraints = {}
): FileValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // File name validation
  if (file.name.length > (constraints.maxFileNameLength || 255)) {
    errors.push({
      field: 'fileName',
      message: `File name is too long. Maximum ${constraints.maxFileNameLength || 255} characters allowed.`,
    });
  }

  // Check for special characters in filename
  if (!/^[^<>:"/\\|?*]+$/.test(file.name)) {
    warnings.push('File name contains special characters that may cause issues.');
  }

  // File size validation
  if (constraints.maxFileSize && file.size > constraints.maxFileSize) {
    const maxSizeMB = Math.round(constraints.maxFileSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    errors.push({
      field: 'fileSize',
      message: `File too large. This file (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit.`,
    });
  }

  // Large file warning
  if (file.size > 100 * 1024 * 1024) {
    // 100MB
    warnings.push('This is a large file and may take some time to upload.');
  }

  // File type validation
  const fileExtension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  // Check blocked file types first
  if (constraints.blockedFileTypes?.length) {
    const isBlocked = constraints.blockedFileTypes.some(blocked =>
      fileExtension === blocked.toLowerCase().replace('.', '') ||
      mimeType.includes(blocked.toLowerCase())
    );

    if (isBlocked) {
      errors.push({
        field: 'fileType',
        message: `File type not allowed. ${fileExtension} files are blocked for security reasons.`,
      });
    }
  }

  // Check allowed file types
  if (constraints.allowedFileTypes?.length) {
    const isAllowed = constraints.allowedFileTypes.some(allowed => {
      const allowedLower = allowed.toLowerCase();
      return (
        mimeType.includes(allowedLower) ||
        fileExtension === allowedLower.replace('.', '') ||
        (allowedLower.includes('*') && mimeType.startsWith(allowedLower.replace('/*', '')))
      );
    });

    if (!isAllowed) {
      errors.push({
        field: 'fileType',
        message: `File type not allowed. Only ${constraints.allowedFileTypes.join(', ')} files are accepted.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileSize: file.size,
    fileType: mimeType || getFileTypeFromExtension(fileExtension),
    fileName: file.name,
  };
}

/**
 * Validate multiple files for batch upload
 */
export function validateFiles(
  files: File[],
  constraints: FileConstraints = {}
): {
  results: FileValidationResult[];
  globalErrors: ValidationError[];
  globalWarnings: string[];
  validFiles: File[];
  invalidFiles: Array<{ file: File; errors: ValidationError[] }>;
} {
  const results: FileValidationResult[] = [];
  const globalErrors: ValidationError[] = [];
  const globalWarnings: string[] = [];
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; errors: ValidationError[] }> = [];

  // Check total file count
  if (constraints.maxFiles && files.length > constraints.maxFiles) {
    globalErrors.push({
      field: 'fileCount',
      message: `Too many files. Maximum ${constraints.maxFiles} files allowed, but ${files.length} were selected.`,
    });
  }

  // Check for duplicates
  if (!constraints.allowDuplicates) {
    const fileNames = new Set<string>();
    const duplicates: string[] = [];

    files.forEach(file => {
      if (fileNames.has(file.name)) {
        duplicates.push(file.name);
      }
      fileNames.add(file.name);
    });

    if (duplicates.length > 0) {
      globalWarnings.push(`Duplicate files detected: ${duplicates.join(', ')}`);
    }
  }

  // Validate each file
  files.forEach(file => {
    const result = validateFile(file, constraints);
    results.push(result);

    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, errors: result.errors });
    }
  });

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 1024 * 1024 * 1024) {
    // 1GB
    globalWarnings.push(
      `Large batch upload (${formatFileSize(totalSize)}). Upload may take considerable time.`
    );
  }

  return {
    results,
    globalErrors,
    globalWarnings,
    validFiles,
    invalidFiles,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if file size is within limit
 */
export function checkFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Check if file type is allowed
 */
export function checkFileType(file: File, allowedTypes: string[]): boolean {
  if (!allowedTypes.length) return true;

  const fileExtension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  return allowedTypes.some(allowed => {
    const allowedLower = allowed.toLowerCase();
    return (
      mimeType.includes(allowedLower) ||
      fileExtension === allowedLower.replace('.', '') ||
      (allowedLower.includes('*') && mimeType.startsWith(allowedLower.replace('/*', '')))
    );
  });
}

/**
 * Check if file name is valid
 */
export function checkFileName(fileName: string): boolean {
  return /^[^<>:"/\\|?*]+$/.test(fileName) && fileName.length <= 255;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getFileTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',

    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',

    // Media
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',

    // Code
    js: 'text/javascript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    xml: 'application/xml',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get human-readable file type
 */
export function getReadableFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/': 'Image',
    'video/': 'Video',
    'audio/': 'Audio',
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'text/plain': 'Text File',
    'text/csv': 'CSV File',
    'application/zip': 'ZIP Archive',
    'application/x-rar-compressed': 'RAR Archive',
  };

  // Check for exact match first
  if (typeMap[mimeType]) {
    return typeMap[mimeType];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(typeMap)) {
    if (mimeType.startsWith(key)) {
      return value;
    }
  }

  return 'File';
}