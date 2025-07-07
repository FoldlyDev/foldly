/**
 * File Type and Size Constants
 * Centralized configuration for file upload limitations and options
 * Following 2025 TypeScript best practices with proper typing and const assertions
 */

export interface FileTypeOption {
  readonly value: string;
  readonly label: string;
  readonly description: string;
}

export interface FileSizeOption {
  readonly value: string;
  readonly label: string;
  readonly description: string;
  readonly bytes: number;
}

/**
 * Predefined file type categories for upload restrictions
 */
export const FILE_TYPE_OPTIONS: readonly FileTypeOption[] = [
  {
    value: '*',
    label: 'All File Types',
    description: 'Accept any file type',
  },
  {
    value: 'image/*',
    label: 'Images Only',
    description: 'JPG, PNG, GIF, WebP, etc.',
  },
  {
    value: '.pdf,.doc,.docx,.txt,.rtf',
    label: 'Documents',
    description: 'PDF, Word, Text files',
  },
  {
    value: '.xlsx,.xls,.csv',
    label: 'Spreadsheets',
    description: 'Excel, CSV files',
  },
  {
    value: '.pptx,.ppt',
    label: 'Presentations',
    description: 'PowerPoint files',
  },
  {
    value: '.zip,.rar,.7z,.tar.gz',
    label: 'Archives',
    description: 'Compressed files',
  },
  {
    value: '.mp3,.wav,.aac,.flac,.m4a',
    label: 'Audio Files',
    description: 'Music and audio',
  },
  {
    value: '.mp4,.avi,.mov,.wmv,.flv',
    label: 'Video Files',
    description: 'Video content',
  },
  {
    value: '.html,.css,.js,.ts,.jsx,.tsx',
    label: 'Code Files',
    description: 'Web development files',
  },
] as const;

/**
 * File size limit options for uploads
 */
export const FILE_SIZE_OPTIONS: readonly FileSizeOption[] = [
  {
    value: '1',
    label: '1 MB',
    description: 'Small files only',
    bytes: 1024 * 1024,
  },
  {
    value: '5',
    label: '5 MB',
    description: 'Standard documents',
    bytes: 5 * 1024 * 1024,
  },
  {
    value: '10',
    label: '10 MB',
    description: 'Images and docs',
    bytes: 10 * 1024 * 1024,
  },
  {
    value: '25',
    label: '25 MB',
    description: 'High-res images',
    bytes: 25 * 1024 * 1024,
  },
  {
    value: '50',
    label: '50 MB',
    description: 'Large presentations',
    bytes: 50 * 1024 * 1024,
  },
  {
    value: '100',
    label: '100 MB',
    description: 'Video clips',
    bytes: 100 * 1024 * 1024,
  },
  {
    value: '250',
    label: '250 MB',
    description: 'Large video files',
    bytes: 250 * 1024 * 1024,
  },
  {
    value: '500',
    label: '500 MB',
    description: 'Very large files',
    bytes: 500 * 1024 * 1024,
  },
  {
    value: '1000',
    label: '1 GB',
    description: 'Maximum size',
    bytes: 1000 * 1024 * 1024,
  },
] as const;

/**
 * Default configurations
 */
export const DEFAULT_FILE_TYPES = '*' as const;
export const DEFAULT_FILE_SIZES = '10' as const;

/**
 * File type validation and MIME type definitions
 */
export const FILE_TYPE_CONSTRAINTS = {
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_FILE_SIZE: 1000 * 1024 * 1024, // 1GB
  MAX_FILES_PER_UPLOAD: 100,
  ALLOWED_MIME_TYPES: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;
