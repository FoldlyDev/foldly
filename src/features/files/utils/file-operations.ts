// Files Feature Operations Utilities for Foldly - File Management Functions
// Utility functions for file operations, validation, and formatting
// Following 2025 TypeScript best practices with comprehensive functionality

import type { FileData, FolderData, FileType, FolderColor } from '../types';
import {
  getFileTypeFromExtension,
  getFileTypeFromMimeType,
  getFileIcon,
  getFolderIcon,
  isValidFileName,
  sanitizeFileName,
  generateUniqueFileName,
  THUMBNAIL_CONFIG,
  ANIMATIONS,
} from '../constants';

// =============================================================================
// FILE NAME OPERATIONS
// =============================================================================

/**
 * Extract file name without extension
 */
export const getFileNameWithoutExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
};

/**
 * Extract file extension
 */
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0
    ? fileName.substring(lastDotIndex + 1).toLowerCase()
    : '';
};

/**
 * Validate and sanitize file name
 */
export const validateAndSanitizeFileName = (
  fileName: string
): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check if empty
  if (!fileName.trim()) {
    errors.push('File name cannot be empty');
  }

  // Check length
  if (fileName.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    errors.push('File name contains invalid characters');
  }

  // Check for reserved names
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (reservedNames.test(fileName)) {
    errors.push('File name is reserved');
  }

  // Check for trailing dots or spaces
  if (fileName.endsWith('.') || fileName.endsWith(' ')) {
    errors.push('File name cannot end with dot or space');
  }

  return {
    isValid: errors.length === 0,
    sanitized: sanitizeFileName(fileName),
    errors,
  };
};

/**
 * Generate unique name for file/folder
 */
export const generateUniqueName = (
  baseName: string,
  existingNames: string[],
  maxAttempts: number = 1000
): string => {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const extension = getFileExtension(baseName);
  const nameWithoutExt = getFileNameWithoutExtension(baseName);

  for (let i = 1; i <= maxAttempts; i++) {
    const newName = extension
      ? `${nameWithoutExt} (${i}).${extension}`
      : `${nameWithoutExt} (${i})`;

    if (!existingNames.includes(newName)) {
      return newName;
    }
  }

  // Fallback with timestamp
  const timestamp = Date.now();
  return extension
    ? `${nameWithoutExt}-${timestamp}.${extension}`
    : `${nameWithoutExt}-${timestamp}`;
};

// =============================================================================
// FILE TYPE AND ICON OPERATIONS
// =============================================================================

/**
 * Get file type from file name or MIME type
 */
export const determineFileType = (
  fileName: string,
  mimeType?: string
): FileType => {
  if (mimeType) {
    const typeFromMime = getFileTypeFromMimeType(mimeType);
    if (typeFromMime !== 'OTHER') {
      return typeFromMime;
    }
  }

  const extension = getFileExtension(fileName);
  return getFileTypeFromExtension(extension);
};

/**
 * Get file icon with fallback
 */
export const getFileIconWithFallback = (
  fileType: FileType,
  fileName?: string
): string => {
  const icon = getFileIcon(fileType);

  // Return type-specific icon or fallback
  if (icon && icon !== '📎') {
    return icon;
  }

  // Fallback based on file extension
  if (fileName) {
    const extension = getFileExtension(fileName);
    const specificIcons: Record<string, string> = {
      // Code files
      js: '📜',
      ts: '📜',
      jsx: '⚛️',
      tsx: '⚛️',
      py: '🐍',
      java: '☕',
      cpp: '🔧',
      c: '🔧',
      cs: '🔷',
      php: '🐘',
      rb: '💎',
      go: '🐹',
      rs: '🦀',
      swift: '🍎',
      kt: '🟢',
      dart: '🎯',

      // Data files
      json: '📊',
      xml: '📄',
      yaml: '📝',
      yml: '📝',
      csv: '📈',
      sql: '🗃️',
      db: '🗄️',

      // Config files
      env: '⚙️',
      config: '🔧',
      ini: '📋',
      conf: '📋',

      // Web files
      html: '🌐',
      css: '🎨',
      scss: '🎨',
      sass: '🎨',
      js: '📜',
      ts: '📜',

      // Document formats
      md: '📝',
      txt: '📄',
      rtf: '📄',
      pdf: '📕',
      epub: '📖',

      // Compressed files
      zip: '📦',
      rar: '📦',
      '7z': '📦',
      tar: '📦',
      gz: '📦',
      bz2: '📦',
    };

    return specificIcons[extension] || '📎';
  }

  return '📎';
};

/**
 * Get folder icon with color variation
 */
export const getFolderIconWithColor = (
  color: FolderColor,
  isOpen: boolean = false
): string => {
  const baseIcon = getFolderIcon(color);

  // Use different icons for open/closed state
  if (isOpen) {
    const openIcons: Record<FolderColor, string> = {
      blue: '📂',
      green: '📂',
      purple: '📂',
      orange: '📂',
      red: '📂',
      yellow: '📂',
      pink: '📂',
      gray: '📂',
    };
    return openIcons[color];
  }

  return baseIcon;
};

// =============================================================================
// FILE SIZE AND DATE OPERATIONS
// =============================================================================

/**
 * Format file size with custom units
 */
export const formatFileSizeDetailed = (
  bytes: number,
  decimals: number = 2,
  binary: boolean = true
): {
  value: number;
  unit: string;
  formatted: string;
} => {
  if (bytes === 0) {
    return { value: 0, unit: 'Bytes', formatted: '0 Bytes' };
  }

  const base = binary ? 1024 : 1000;
  const units = binary
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const index = Math.floor(Math.log(bytes) / Math.log(base));
  const value = parseFloat((bytes / Math.pow(base, index)).toFixed(decimals));
  const unit = units[index];

  return {
    value,
    unit,
    formatted: `${value} ${unit}`,
  };
};

/**
 * Format date in relative format
 */
export const formatDateRelative = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 30) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;

  return 'Just now';
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date in standard format (alias for formatDateHuman)
 */
export const formatDate = (date: Date): string => {
  return formatDateHuman(date);
};

/**
 * Format date in human-readable format
 */
export const formatDateHuman = (date: Date): string => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Today at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// =============================================================================
// FILE PATH OPERATIONS
// =============================================================================

/**
 * Normalize file path
 */
export const normalizePath = (path: string): string => {
  return (
    path
      .replace(/\\/g, '/') // Convert backslashes to forward slashes
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/^\//, '') || // Remove leading slash
    '/'
  ); // Default to root if empty
};

/**
 * Join path segments
 */
export const joinPaths = (...segments: string[]): string => {
  return normalizePath(segments.join('/'));
};

/**
 * Get parent path
 */
export const getParentPath = (path: string): string => {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : '/';
};

/**
 * Get path depth
 */
export const getPathDepth = (path: string): number => {
  const normalized = normalizePath(path);
  return normalized === '/' ? 0 : normalized.split('/').length;
};

/**
 * Generate breadcrumb items from path
 */
export const generateBreadcrumbs = (
  path: string
): Array<{
  name: string;
  path: string;
  isLast: boolean;
}> => {
  const normalized = normalizePath(path);

  if (normalized === '/') {
    return [{ name: 'Home', path: '/', isLast: true }];
  }

  const segments = normalized.split('/');
  const breadcrumbs = [{ name: 'Home', path: '/', isLast: false }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: segment,
      path: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return breadcrumbs;
};

// =============================================================================
// FILE SEARCH AND FILTERING
// =============================================================================

/**
 * Search files by multiple criteria
 */
export const searchFiles = (
  files: FileData[],
  query: string,
  filters?: {
    type?: FileType[];
    sizeMin?: number;
    sizeMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
    isShared?: boolean;
  }
): FileData[] => {
  let results = files;

  // Text search
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    results = results.filter(
      file =>
        file.name.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Apply filters
  if (filters) {
    if (filters.type && filters.type.length > 0) {
      results = results.filter(file => filters.type!.includes(file.type));
    }

    if (filters.sizeMin !== undefined) {
      results = results.filter(file => file.size >= filters.sizeMin!);
    }

    if (filters.sizeMax !== undefined) {
      results = results.filter(file => file.size <= filters.sizeMax!);
    }

    if (filters.dateFrom) {
      results = results.filter(file => file.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      results = results.filter(file => file.createdAt <= filters.dateTo!);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(file =>
        filters.tags!.some(tag => file.tags.includes(tag))
      );
    }

    if (filters.isShared !== undefined) {
      results = results.filter(file => file.isShared === filters.isShared);
    }

  }

  return results;
};

/**
 * Search folders by criteria
 */
export const searchFolders = (
  folders: FolderData[],
  query: string,
  filters?: {
    color?: FolderColor[];
    isShared?: boolean;
    tags?: string[];
  }
): FolderData[] => {
  let results = folders;

  // Text search
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    results = results.filter(
      folder =>
        folder.name.toLowerCase().includes(searchTerm) ||
        folder.description?.toLowerCase().includes(searchTerm) ||
        folder.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Apply filters
  if (filters) {
    if (filters.color && filters.color.length > 0) {
      results = results.filter(folder => filters.color!.includes(folder.color));
    }

    if (filters.isShared !== undefined) {
      results = results.filter(folder => folder.isShared === filters.isShared);
    }


    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(folder =>
        filters.tags!.some(tag => folder.tags.includes(tag))
      );
    }
  }

  return results;
};

// =============================================================================
// FILE SORTING
// =============================================================================

/**
 * Sort files by various criteria
 */
export const sortFiles = (
  files: FileData[],
  sortBy:
    | 'name'
    | 'size'
    | 'type'
    | 'createdAt'
    | 'updatedAt'
    | 'downloadCount',
  sortOrder: 'asc' | 'desc' = 'asc'
): FileData[] => {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'downloadCount':
        comparison = a.downloadCount - b.downloadCount;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

/**
 * Sort folders by various criteria
 */
export const sortFolders = (
  folders: FolderData[],
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'fileCount' | 'totalSize',
  sortOrder: 'asc' | 'desc' = 'asc'
): FolderData[] => {
  const sorted = [...folders].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'fileCount':
        comparison = a.fileCount - b.fileCount;
        break;
      case 'totalSize':
        comparison = a.totalSize - b.totalSize;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

// =============================================================================
// THUMBNAIL OPERATIONS
// =============================================================================

/**
 * Generate thumbnail URL
 */
export const generateThumbnailUrl = (
  fileId: string,
  size: keyof typeof THUMBNAIL_CONFIG.SIZES = 'medium'
): string => {
  const { width, height } = THUMBNAIL_CONFIG.SIZES[size];
  return `/api/files/${fileId}/thumbnail?w=${width}&h=${height}`;
};

/**
 * Check if file type supports thumbnails
 */
export const supportsThumbnails = (fileType: FileType): boolean => {
  return ['IMAGE', 'VIDEO', 'DOCUMENT', 'PRESENTATION'].includes(fileType);
};

/**
 * Get placeholder thumbnail for file type
 */
export const getPlaceholderThumbnail = (fileType: FileType): string => {
  const placeholders: Record<FileType, string> = {
    IMAGE: '🖼️',
    VIDEO: '🎥',
    AUDIO: '🎵',
    DOCUMENT: '📄',
    SPREADSHEET: '📊',
    PRESENTATION: '📺',
    ARCHIVE: '📦',
    CODE: '💻',
    FONT: '🔤',
    DESIGN: '🎨',
    DATA: '📋',
    EXECUTABLE: '⚙️',
    OTHER: '📎',
  };

  return placeholders[fileType];
};

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

/**
 * Get animation duration based on type
 */
export const getAnimationDuration = (
  type: keyof typeof ANIMATIONS.DURATION
): number => {
  return ANIMATIONS.DURATION[type];
};

/**
 * Get animation easing function
 */
export const getAnimationEasing = (
  type: keyof typeof ANIMATIONS.EASING
): string => {
  return ANIMATIONS.EASING[type];
};

/**
 * Create animation style object
 */
export const createAnimationStyle = (
  duration: number,
  easing: string,
  delay: number = 0
): React.CSSProperties => ({
  transitionDuration: `${duration}ms`,
  transitionTimingFunction: easing,
  transitionDelay: `${delay}ms`,
});

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Debounce function for search
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for performance
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Convert bytes to human readable format with progress
 */
export const formatBytesWithProgress = (
  bytes: number,
  total: number
): {
  current: string;
  total: string;
  percentage: number;
} => {
  const percentage = total > 0 ? Math.round((bytes / total) * 100) : 0;

  return {
    current: formatFileSize(bytes),
    total: formatFileSize(total),
    percentage,
  };
};

/**
 * Check if two files are the same
 */
export const areFilesEqual = (file1: FileData, file2: FileData): boolean => {
  return (
    file1.id === file2.id &&
    file1.name === file2.name &&
    file1.size === file2.size &&
    file1.metadata.checksum === file2.metadata.checksum
  );
};

/**
 * Generate file statistics
 */
export const generateFileStats = (files: FileData[]) => {
  const stats = {
    total: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byType: {} as Record<FileType, number>,
    sizeByType: {} as Record<FileType, number>,
    averageSize: 0,
    largestFile: null as FileData | null,
    smallestFile: null as FileData | null,
    mostDownloaded: null as FileData | null,
    recentFiles: [] as FileData[],
  };

  if (files.length === 0) return stats;

  // Calculate by type
  files.forEach(file => {
    stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;
    stats.sizeByType[file.type] =
      (stats.sizeByType[file.type] || 0) + file.size;
  });

  // Calculate other stats
  stats.averageSize = stats.totalSize / stats.total;
  stats.largestFile = files.reduce((largest, file) =>
    file.size > (largest?.size || 0) ? file : largest
  );
  stats.smallestFile = files.reduce((smallest, file) =>
    file.size < (smallest?.size || Infinity) ? file : smallest
  );
  stats.mostDownloaded = files.reduce((most, file) =>
    file.downloadCount > (most?.downloadCount || 0) ? file : most
  );

  // Recent files (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  stats.recentFiles = files.filter(file => file.createdAt >= sevenDaysAgo);

  return stats;
};

// =============================================================================
// FILTERING OPERATIONS
// =============================================================================

/**
 * Filter files based on search query and filters
 */
export const filterFiles = (
  files: FileData[],
  searchQuery: string,
  filters: Record<string, any>
): FileData[] => {
  let filtered = files;

  // Apply search query filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      file =>
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
    );
  }

  // Apply additional filters
  if (filters.type && filters.type !== '') {
    filtered = filtered.filter(file => file.type === filters.type);
  }

  if (filters.size) {
    // Add size-based filtering logic if needed
  }

  return filtered;
};

/**
 * Filter folders based on search query and filters
 */
export const filterFolders = (
  folders: FolderData[],
  searchQuery: string,
  filters: Record<string, any>
): FolderData[] => {
  let filtered = folders;

  // Apply search query filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(folder =>
      folder.name.toLowerCase().includes(query)
    );
  }

  // Apply additional filters
  if (filters.color && filters.color !== '') {
    filtered = filtered.filter(folder => folder.color === filters.color);
  }

  return filtered;
};
