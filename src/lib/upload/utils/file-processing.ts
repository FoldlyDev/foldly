/**
 * Shared File Processing Utilities
 * Common file processing functions used across upload features
 */

import { nanoid } from 'nanoid';
import type { FileId, BatchId } from '@/types/ids';

// =============================================================================
// FILE PROCESSING
// =============================================================================

/**
 * Generate a unique file ID
 */
export function generateFileId(): FileId {
  return `file_${nanoid(12)}` as FileId;
}

/**
 * Generate a unique batch ID
 */
export function generateBatchId(): BatchId {
  return `batch_${nanoid(12)}` as BatchId;
}

/**
 * Create a safe filename by removing special characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and other dangerous characters
  let safeName = fileName.replace(/[<>:"/\\|?*]/g, '_');
  
  // Remove leading/trailing dots and spaces
  safeName = safeName.replace(/^\.+|\.+$/g, '').trim();
  
  // Ensure filename is not empty
  if (!safeName) {
    safeName = 'unnamed_file';
  }
  
  // Limit length
  if (safeName.length > 255) {
    const extension = getFileExtension(safeName);
    const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
    safeName = nameWithoutExt.substring(0, 250 - extension.length) + '.' + extension;
  }
  
  return safeName;
}

/**
 * Generate a unique filename if duplicate exists
 */
export function generateUniqueFileName(
  fileName: string,
  existingFileNames: string[]
): string {
  if (!existingFileNames.includes(fileName)) {
    return fileName;
  }

  const extension = getFileExtension(fileName);
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  
  let counter = 1;
  let newFileName = `${nameWithoutExt} (${counter}).${extension}`;
  
  while (existingFileNames.includes(newFileName)) {
    counter++;
    newFileName = `${nameWithoutExt} (${counter}).${extension}`;
  }
  
  return newFileName;
}

/**
 * Extract file extension from filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

/**
 * Calculate file hash for duplicate detection
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if file is an audio file
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

/**
 * Check if file is a document
 */
export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];
  
  return documentTypes.includes(file.type);
}

/**
 * Get file category for organization
 */
export function getFileCategory(file: File): string {
  if (isImageFile(file)) return 'images';
  if (isVideoFile(file)) return 'videos';
  if (isAudioFile(file)) return 'audio';
  if (isDocumentFile(file)) return 'documents';
  
  // Check by extension if type is not set
  const extension = getFileExtension(file.name).toLowerCase();
  const categoryMap: Record<string, string> = {
    // Archives
    zip: 'archives',
    rar: 'archives',
    '7z': 'archives',
    tar: 'archives',
    gz: 'archives',
    
    // Code
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    py: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    html: 'code',
    css: 'code',
    json: 'code',
    xml: 'code',
  };
  
  return categoryMap[extension] || 'other';
}

/**
 * Create file metadata object
 */
export interface FileMetadata {
  id: FileId;
  originalName: string;
  safeName: string;
  size: number;
  type: string;
  category: string;
  extension: string;
  lastModified: Date;
  hash?: string;
}

export async function createFileMetadata(
  file: File,
  options?: {
    generateHash?: boolean;
    existingFileNames?: string[];
  }
): Promise<FileMetadata> {
  const safeName = sanitizeFileName(file.name);
  const uniqueName = options?.existingFileNames
    ? generateUniqueFileName(safeName, options.existingFileNames)
    : safeName;

  const metadata: FileMetadata = {
    id: generateFileId(),
    originalName: file.name,
    safeName: uniqueName,
    size: file.size,
    type: file.type || 'application/octet-stream',
    category: getFileCategory(file),
    extension: getFileExtension(file.name),
    lastModified: new Date(file.lastModified),
  };

  if (options?.generateHash) {
    metadata.hash = await calculateFileHash(file);
  }

  return metadata;
}

/**
 * Group files by category
 */
export function groupFilesByCategory(files: File[]): Record<string, File[]> {
  const groups: Record<string, File[]> = {};
  
  files.forEach(file => {
    const category = getFileCategory(file);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(file);
  });
  
  return groups;
}

/**
 * Sort files by various criteria
 */
export type FileSortCriteria = 'name' | 'size' | 'type' | 'date';
export type FileSortOrder = 'asc' | 'desc';

export function sortFiles(
  files: File[],
  criteria: FileSortCriteria = 'name',
  order: FileSortOrder = 'asc'
): File[] {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0;
    
    switch (criteria) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'date':
        comparison = a.lastModified - b.lastModified;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Calculate total size of files
 */
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Get file preview URL if possible
 */
export function getFilePreviewUrl(file: File): string | null {
  if (isImageFile(file) || isVideoFile(file)) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Clean up preview URLs to prevent memory leaks
 */
export function revokeFilePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Convert File to base64 string (useful for small files)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Read file as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}