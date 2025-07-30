// =============================================================================
// FILE CONFLICT RESOLUTION UTILITIES
// =============================================================================
// Shared utilities for handling file name conflicts and duplicates
// Extracted from duplicate code in file-actions.ts

import { logger } from '@/lib/services/logging/logger';

/**
 * Generates a unique file name by appending a number suffix if conflicts exist
 * @param originalName - The original file name
 * @param existingNames - Array of existing file names to check against
 * @returns A unique file name that doesn't conflict with existing names
 */
export function generateUniqueName(originalName: string, existingNames: string[]): string {
  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  const nameWithoutExt = getNameWithoutExtension(originalName);
  const extension = getFileExtension(originalName);
  let counter = 1;

  while (true) {
    const newName = extension 
      ? `${nameWithoutExt} (${counter}).${extension}`
      : `${nameWithoutExt} (${counter})`;

    if (!existingNames.includes(newName)) {
      logger.debug('Generated unique file name', {
        metadata: { originalName, newName, conflictsFound: counter }
      });
      return newName;
    }
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      logger.warn('File name conflict resolution exceeded maximum attempts', {
        metadata: { originalName, maxAttempts: counter }
      });
      return `${nameWithoutExt}-${Date.now()}${extension ? `.${extension}` : ''}`;
    }
  }
}

/**
 * Extracts the file name without extension
 * @param fileName - The file name to process
 * @returns The name without extension
 */
export function getNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return fileName;
  }
  return fileName.substring(0, lastDotIndex);
}

/**
 * Extracts the file extension
 * @param fileName - The file name to process
 * @returns The extension without the dot, or empty string if no extension
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === fileName.length - 1) {
    return '';
  }
  return fileName.substring(lastDotIndex + 1);
}

/**
 * Checks if a file name would conflict with existing files
 * @param fileName - The file name to check
 * @param existingNames - Array of existing file names
 * @returns True if there's a conflict, false otherwise
 */
export function hasNameConflict(fileName: string, existingNames: string[]): boolean {
  return existingNames.includes(fileName);
}

/**
 * Resolves file conflicts by checking existing files and generating unique names
 * Handles both folder and workspace root scenarios
 * @param fileName - Original file name
 * @param existingFiles - Array of existing files with fileName property
 * @param excludeFileId - Optional file ID to exclude from conflict check (for moves)
 * @returns Resolved unique file name
 */
export function resolveFileConflict<T extends { fileName: string; id?: string }>(
  fileName: string,
  existingFiles: T[],
  excludeFileId?: string
): string {
  const existingNames = existingFiles
    .filter(f => f.id !== excludeFileId) // Exclude the file being moved/renamed
    .map(f => f.fileName);

  return generateUniqueName(fileName, existingNames);
}

/**
 * Batch conflict resolution for multiple files
 * @param fileNames - Array of file names to resolve
 * @param existingNames - Array of existing file names
 * @returns Map of original names to resolved names
 */
export function batchResolveConflicts(
  fileNames: string[],
  existingNames: string[]
): Map<string, string> {
  const resolutionMap = new Map<string, string>();
  const allNames = [...existingNames];

  for (const fileName of fileNames) {
    const resolvedName = generateUniqueName(fileName, allNames);
    resolutionMap.set(fileName, resolvedName);
    
    // Add resolved name to the list to prevent conflicts within the batch
    allNames.push(resolvedName);
  }

  return resolutionMap;
}

/**
 * Validates file name for security and format
 * @param fileName - The file name to validate
 * @returns Object with validation result and sanitized name
 */
export function validateAndSanitizeFileName(fileName: string): {
  isValid: boolean;
  sanitizedName: string;
  issues: string[];
} {
  const issues: string[] = [];
  let sanitizedName = fileName;

  // Check for empty name
  if (!fileName || fileName.trim().length === 0) {
    return {
      isValid: false,
      sanitizedName: '',
      issues: ['File name cannot be empty']
    };
  }

  // Remove/replace dangerous characters
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
  if (dangerousChars.test(fileName)) {
    sanitizedName = fileName.replace(dangerousChars, '_');
    issues.push('Replaced dangerous characters with underscores');
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  const nameWithoutExt = getNameWithoutExtension(sanitizedName).toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitizedName = `file_${sanitizedName}`;
    issues.push('Prefixed reserved system name');
  }

  // Check length (most file systems support 255 characters)
  if (sanitizedName.length > 255) {
    const ext = getFileExtension(sanitizedName);
    const maxNameLength = 255 - (ext.length > 0 ? ext.length + 1 : 0);
    const truncatedName = getNameWithoutExtension(sanitizedName).substring(0, maxNameLength);
    sanitizedName = ext ? `${truncatedName}.${ext}` : truncatedName;
    issues.push('Truncated file name to fit length limits');
  }

  // Trim whitespace and periods from end (Windows requirement)
  const trimmed = sanitizedName.replace(/[\s.]+$/, '');
  if (trimmed !== sanitizedName) {
    sanitizedName = trimmed;
    issues.push('Removed trailing whitespace and periods');
  }

  const isValid = issues.length === 0;
  
  if (issues.length > 0) {
    logger.info('File name sanitized', {
      metadata: { original: fileName, sanitized: sanitizedName, issues }
    });
  }

  return {
    isValid,
    sanitizedName,
    issues
  };
}