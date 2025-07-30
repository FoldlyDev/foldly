// Files Feature Constants for Foldly - File Management and Processing
// Configuration constants specific to file functionality
// Following 2025 TypeScript best practices with strict type safety

import type { FileType, FolderColor } from '../types';

// =============================================================================
// FILE EXTENSIONS AND MIME TYPES
// =============================================================================

/**
 * File extensions mapping by type
 */
export const FILE_EXTENSIONS: Record<FileType, readonly string[]> = {
  IMAGE: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico',
    'avif',
  ] as const,
  VIDEO: [
    'mp4',
    'mov',
    'avi',
    'wmv',
    'flv',
    'webm',
    'mkv',
    'm4v',
    '3gp',
  ] as const,
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'] as const,
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'] as const,
  SPREADSHEET: ['xls', 'xlsx', 'csv', 'ods', 'numbers'] as const,
  PRESENTATION: ['ppt', 'pptx', 'odp', 'key'] as const,
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'] as const,
  CODE: [
    'js',
    'ts',
    'jsx',
    'tsx',
    'py',
    'java',
    'cpp',
    'c',
    'cs',
    'php',
    'rb',
    'go',
    'rs',
    'swift',
    'kt',
    'dart',
    'scala',
    'r',
    'sql',
    'sh',
    'ps1',
    'bat',
    'cmd',
  ] as const,
  FONT: ['ttf', 'otf', 'woff', 'woff2', 'eot'] as const,
  DESIGN: ['psd', 'ai', 'sketch', 'fig', 'xd', 'indd', 'eps'] as const,
  DATA: ['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'] as const,
  EXECUTABLE: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage'] as const,
  OTHER: [] as const,
} as const satisfies Record<FileType, readonly string[]>;

/**
 * MIME type to FileType mapping
 */
export const MIME_TYPE_MAPPING: Record<string, FileType> = {
  // Images
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/svg+xml': 'IMAGE',
  'image/bmp': 'IMAGE',
  'image/x-icon': 'IMAGE',
  'image/avif': 'IMAGE',

  // Videos
  'video/mp4': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'video/x-msvideo': 'VIDEO',
  'video/x-ms-wmv': 'VIDEO',
  'video/x-flv': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/x-matroska': 'VIDEO',
  'video/3gpp': 'VIDEO',

  // Audio
  'audio/mpeg': 'AUDIO',
  'audio/wav': 'AUDIO',
  'audio/flac': 'AUDIO',
  'audio/aac': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'audio/x-ms-wma': 'AUDIO',
  'audio/mp4': 'AUDIO',
  'audio/opus': 'AUDIO',

  // Documents
  'application/pdf': 'DOCUMENT',
  'application/msword': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOCUMENT',
  'text/plain': 'DOCUMENT',
  'application/rtf': 'DOCUMENT',
  'application/vnd.oasis.opendocument.text': 'DOCUMENT',

  // Spreadsheets
  'application/vnd.ms-excel': 'SPREADSHEET',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'SPREADSHEET',
  'text/csv': 'SPREADSHEET',
  'application/vnd.oasis.opendocument.spreadsheet': 'SPREADSHEET',

  // Presentations
  'application/vnd.ms-powerpoint': 'PRESENTATION',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'PRESENTATION',
  'application/vnd.oasis.opendocument.presentation': 'PRESENTATION',

  // Archives
  'application/zip': 'ARCHIVE',
  'application/x-rar-compressed': 'ARCHIVE',
  'application/x-7z-compressed': 'ARCHIVE',
  'application/x-tar': 'ARCHIVE',
  'application/gzip': 'ARCHIVE',
  'application/x-bzip2': 'ARCHIVE',

  // Code
  'application/javascript': 'CODE',
  'application/typescript': 'CODE',
  'text/javascript': 'CODE',
  'text/typescript': 'CODE',
  'text/x-python': 'CODE',
  'text/x-java': 'CODE',
  'text/x-c++src': 'CODE',
  'text/x-csrc': 'CODE',
  'text/x-csharp': 'CODE',
  'text/x-php': 'CODE',
  'text/x-ruby': 'CODE',
  'text/x-go': 'CODE',
  'text/x-rust': 'CODE',
  'text/x-swift': 'CODE',
  'text/x-kotlin': 'CODE',
  'text/x-dart': 'CODE',
  'text/x-scala': 'CODE',
  'text/x-r': 'CODE',
  'text/x-sql': 'CODE',
  'text/x-shellscript': 'CODE',

  // Fonts
  'font/ttf': 'FONT',
  'font/otf': 'FONT',
  'font/woff': 'FONT',
  'font/woff2': 'FONT',
  'application/vnd.ms-fontobject': 'FONT',

  // Design
  'image/vnd.adobe.photoshop': 'DESIGN',
  'application/postscript': 'DESIGN',
  'application/x-sketch': 'DESIGN',
  'application/x-figma': 'DESIGN',
  'application/x-adobe-xd': 'DESIGN',
  'application/x-indesign': 'DESIGN',

  // Data
  'application/json': 'DATA',
  'application/xml': 'DATA',
  'text/xml': 'DATA',
  'application/x-yaml': 'DATA',
  'text/yaml': 'DATA',
  'application/toml': 'DATA',
  'text/x-ini': 'DATA',

  // Executables
  'application/x-msdownload': 'EXECUTABLE',
  'application/x-msi': 'EXECUTABLE',
  'application/x-apple-diskimage': 'EXECUTABLE',
  'application/x-debian-package': 'EXECUTABLE',
  'application/x-rpm': 'EXECUTABLE',
  'application/x-appimage': 'EXECUTABLE',
} as const;

import { SYSTEM_LIMITS } from '@/lib/config/plan-configuration';

// =============================================================================
// FILE SIZE LIMITS
// =============================================================================

/**
 * Recommended file size limits by type (in bytes)
 * These are UX recommendations only - actual limits are determined by user's plan
 * 
 * @deprecated Do not use for validation. Use plan-based limits from @/lib/config/plan-configuration
 */
export const FILE_TYPE_RECOMMENDATIONS: Record<FileType, number> = {
  IMAGE: 10 * 1024 * 1024, // 10MB recommended for images
  VIDEO: 500 * 1024 * 1024, // 500MB recommended for videos
  AUDIO: 50 * 1024 * 1024, // 50MB recommended for audio
  DOCUMENT: 25 * 1024 * 1024, // 25MB recommended for documents
  SPREADSHEET: 25 * 1024 * 1024, // 25MB recommended for spreadsheets
  PRESENTATION: 50 * 1024 * 1024, // 50MB recommended for presentations
  ARCHIVE: 100 * 1024 * 1024, // 100MB recommended for archives
  CODE: 5 * 1024 * 1024, // 5MB recommended for code files
  FONT: 2 * 1024 * 1024, // 2MB recommended for fonts
  DESIGN: 100 * 1024 * 1024, // 100MB recommended for design files
  DATA: 10 * 1024 * 1024, // 10MB recommended for data files
  EXECUTABLE: 100 * 1024 * 1024, // 100MB recommended for executables
  OTHER: 25 * 1024 * 1024, // 25MB recommended for other files
} as const;

/**
 * Global file size limits
 * Uses centralized system limits from plan configuration
 */
export const GLOBAL_FILE_LIMITS = {
  MAX_FILE_SIZE: SYSTEM_LIMITS.MAX_FILE_SIZE, // Plan-based (2GB free, 10GB pro, 25GB business)
  MAX_TOTAL_SIZE: SYSTEM_LIMITS.MAX_BATCH_SIZE, // 10GB for batch uploads
  MAX_FILES_PER_UPLOAD: SYSTEM_LIMITS.MAX_FILES_PER_BATCH,
  MAX_FILES_PER_FOLDER: SYSTEM_LIMITS.MAX_FILES_PER_FOLDER,
  MAX_FOLDER_DEPTH: SYSTEM_LIMITS.MAX_FOLDER_DEPTH,
} as const;

// =============================================================================
// FOLDER CONFIGURATION - Simplified for MVP
// =============================================================================

/**
 * Default folder icon for all folders
 */
export const DEFAULT_FOLDER_ICON = '📁';

/**
 * Folder configuration constants
 */
export const FOLDER_CONFIG = {
  DEFAULT_ICON: DEFAULT_FOLDER_ICON,
  MAX_DEPTH: 10,
  MAX_NAME_LENGTH: 255,
} as const;

// =============================================================================
// VIEW CONFIGURATION
// =============================================================================

/**
 * View settings for different layouts
 */
export const VIEW_SETTINGS = {
  GRID: {
    itemsPerRow: { sm: 2, md: 3, lg: 4, xl: 5 },
    cardSize: { width: 200, height: 240 },
    spacing: 16,
  },
  LIST: {
    itemHeight: 60,
    showThumbnails: true,
    showMetadata: true,
    spacing: 8,
  },
  CARD: {
    cardSize: { width: 280, height: 320 },
    showPreview: true,
    showDetails: true,
    spacing: 20,
  },
} as const;

// =============================================================================
// DRAG & DROP CONFIGURATION
// =============================================================================

/**
 * Drag & drop configuration
 */
export const DRAG_DROP_CONFIG = {
  ACCEPTED_TYPES: ['files', 'folders', 'mixed'] as const,
  MAX_DRAG_ITEMS: 50,
  DRAG_THRESHOLD: 5, // pixels
  DRAG_DELAY: 100, // milliseconds
  DROP_ZONES: ['workspace', 'folder', 'trash'] as const,
} as const;

/**
 * Drag & drop animations
 */
export const DRAG_ANIMATIONS = {
  DRAG_START: { scale: 0.95, opacity: 0.8 },
  DRAG_OVER: { scale: 1.05, opacity: 0.9 },
  DROP: { scale: 1, opacity: 1 },
  DURATION: 200, // milliseconds
} as const;
// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

/**
 * Keyboard shortcuts for file operations
 */
export const KEYBOARD_SHORTCUTS = {
  // File operations
  COPY: 'Ctrl+C',
  CUT: 'Ctrl+X',
  PASTE: 'Ctrl+V',
  DELETE: 'Delete',
  RENAME: 'F2',
  REFRESH: 'F5',

  // Navigation
  SELECT_ALL: 'Ctrl+A',
  DESELECT_ALL: 'Ctrl+D',
  MOVE_UP: 'ArrowUp',
  MOVE_DOWN: 'ArrowDown',
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',

  // View
  TOGGLE_VIEW: 'Ctrl+T',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',

  // Search
  SEARCH: 'Ctrl+F',
  ESCAPE: 'Escape',

  // Workspace
  NEW_FOLDER: 'Ctrl+Shift+N',
  UPLOAD_FILES: 'Ctrl+U',
  TOGGLE_SIDEBAR: 'Ctrl+B',
} as const;

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

/**
 * Animation durations and easings
 */
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
    EXTRA_SLOW: 500,
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  HOVER_SCALE: 1.02,
  ACTIVE_SCALE: 0.98,
  DRAG_SCALE: 0.95,
} as const;

// =============================================================================
// STORAGE & BACKUP CONFIGURATION
// =============================================================================

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  THUMBNAIL_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  METADATA_CACHE_SIZE: 10 * 1024 * 1024, // 10MB
  AUTO_SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BACKUP_INTERVAL: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Backup configuration
 */
export const BACKUP_CONFIG = {
  MAX_BACKUPS: 10,
  BACKUP_TYPES: ['full', 'incremental', 'differential'] as const,
  RETENTION_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
  COMPRESSION_LEVEL: 6, // 0-9 scale
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

/**
 * Thumbnail configuration
 */
export const THUMBNAIL_CONFIG = {
  SIZES: {
    SMALL: { width: 48, height: 48 },
    MEDIUM: { width: 96, height: 96 },
    LARGE: { width: 192, height: 192 },
    EXTRA_LARGE: { width: 384, height: 384 },
  },
  FORMATS: ['webp', 'jpeg', 'png'] as const,
  QUALITY: 85,
  PLACEHOLDER_COLOR: '#f3f4f6',
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

/**
 * Loading states
 */
export const LOADING_STATES = {
  SKELETON_ITEMS: 12,
  PAGINATION_SIZE: 50,
  INFINITE_SCROLL_THRESHOLD: 0.8,
  DEBOUNCE_DELAY: 300,
} as const;

// =============================================================================
// ERROR & SUCCESS MESSAGES
// =============================================================================

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // File operations
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  FILE_TYPE_NOT_SUPPORTED: 'File type is not supported',
  FILE_UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  FILE_DELETE_FAILED: 'Failed to delete file. Please try again.',
  FILE_MOVE_FAILED: 'Failed to move file. Please try again.',
  FILE_COPY_FAILED: 'Failed to copy file. Please try again.',
  FILE_RENAME_FAILED: 'Failed to rename file. Please try again.',

  // Folder operations
  FOLDER_CREATE_FAILED: 'Failed to create folder. Please try again.',
  FOLDER_DELETE_FAILED: 'Failed to delete folder. Please try again.',
  FOLDER_MOVE_FAILED: 'Failed to move folder. Please try again.',
  FOLDER_RENAME_FAILED: 'Failed to rename folder. Please try again.',
  FOLDER_NOT_EMPTY: 'Folder is not empty. Please delete all contents first.',

  // Workspace operations
  WORKSPACE_LOAD_FAILED: 'Failed to load workspace. Please refresh the page.',
  WORKSPACE_SAVE_FAILED: 'Failed to save workspace changes.',
  WORKSPACE_SYNC_FAILED: 'Failed to sync workspace. Changes may be lost.',

  // General
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  PERMISSION_DENIED:
    'Permission denied. You do not have access to this resource.',
  QUOTA_EXCEEDED: 'Storage quota exceeded. Please delete some files.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  // File operations
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  FILE_MOVED: 'File moved successfully',
  FILE_COPIED: 'File copied successfully',
  FILE_RENAMED: 'File renamed successfully',
  FILES_UPLOADED: 'Files uploaded successfully',

  // Folder operations
  FOLDER_CREATED: 'Folder created successfully',
  FOLDER_DELETED: 'Folder deleted successfully',
  FOLDER_MOVED: 'Folder moved successfully',
  FOLDER_RENAMED: 'Folder renamed successfully',

  // Workspace operations
  WORKSPACE_SAVED: 'Workspace saved successfully',
  WORKSPACE_SYNCED: 'Workspace synced successfully',

  // Sharing
  LINK_COPIED: 'Link copied to clipboard',
  FILE_SHARED: 'File shared successfully',
  FOLDER_SHARED: 'Folder shared successfully',
} as const;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default values for new items
 */
export const DEFAULT_VALUES = {
  FOLDER_NAME: 'New Folder',
  FILE_NAME: 'Untitled',
  WORKSPACE_NAME: 'My Workspace',
  VIEW_MODE: 'grid' as const,
  SORT_BY: 'name' as const,
  SORT_ORDER: 'asc' as const,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flags for conditional functionality - MVP Configuration
 */
export const FEATURE_FLAGS = {
  ENABLE_DRAG_DROP: true,
  ENABLE_FILE_PREVIEW: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_FILE_SHARING: true,
  ENABLE_SEARCH: true,
  ENABLE_FILTERS: true,
  ENABLE_THUMBNAILS: true,
  ENABLE_BREADCRUMBS: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_INFINITE_SCROLL: true,
  ENABLE_VIRTUAL_SCROLLING: false, // Experimental
  ENABLE_COLLABORATION: false, // Future feature
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get file type from MIME type
 */
export const getFileTypeFromMimeType = (mimeType: string): FileType => {
  return MIME_TYPE_MAPPING[mimeType] || 'OTHER';
};

/**
 * Get file type from extension
 */
export const getFileTypeFromExtension = (extension: string): FileType => {
  const ext = extension.toLowerCase().replace('.', '');

  for (const [fileType, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext as never)) {
      return fileType as FileType;
    }
  }

  return 'OTHER';
};

/**
 * Check if file size is within recommended limit for file type
 * @deprecated Use plan-based validation instead
 */
export const isFileSizeWithinRecommendation = (size: number, fileType: FileType): boolean => {
  return size <= FILE_TYPE_RECOMMENDATIONS[fileType];
};

/**
 * Check if file type is supported
 */
export const isFileTypeSupported = (mimeType: string): boolean => {
  return mimeType in MIME_TYPE_MAPPING;
};

/**
 * Generate unique file name to avoid conflicts
 */
export const generateUniqueFileName = (
  baseName: string,
  existingNames: string[]
): string => {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const [name, ext] = baseName.includes('.')
    ? [
        baseName.slice(0, baseName.lastIndexOf('.')),
        baseName.slice(baseName.lastIndexOf('.')),
      ]
    : [baseName, ''];

  let counter = 1;
  let uniqueName = `${name} (${counter})${ext}`;

  while (existingNames.includes(uniqueName)) {
    counter++;
    uniqueName = `${name} (${counter})${ext}`;
  }

  return uniqueName;
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileType: FileType): string => {
  const icons: Record<FileType, string> = {
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

  return icons[fileType];
};

/**
 * Get default folder icon
 */
export const getFolderIcon = (): string => {
  return DEFAULT_FOLDER_ICON;
};

/**
 * Validate file name
 */
export const isValidFileName = (name: string): boolean => {
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(name)) return false;

  // Check for reserved names (Windows)
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (reservedNames.test(name)) return false;

  // Check length
  if (name.length === 0 || name.length > 255) return false;

  // Check for trailing dots or spaces
  if (name.endsWith('.') || name.endsWith(' ')) return false;

  return true;
};

/**
 * Sanitize file name
 */
export const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
    .replace(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, '$1_') // Handle reserved names
    .replace(/[.\s]+$/, '') // Remove trailing dots and spaces
    .slice(0, 255); // Limit length
};
