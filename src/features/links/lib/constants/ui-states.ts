/**
 * UI States and Status Configurations
 * Link status, visibility, and UI state constants
 * Following 2025 best practices with proper typing and const assertions
 */

export type LinkStatus = 'active' | 'paused' | 'expired';
export type StatusSize = 'sm' | 'md';
export type ColorType = 'primary' | 'secondary' | 'tertiary' | 'success';

export interface StatusConfig {
  readonly color: string;
  readonly dotColor: string;
  readonly text: string;
  readonly bgColor: string;
  readonly textColor: string;
  readonly borderColor: string;
}

export interface ColorClasses {
  readonly icon: string;
  readonly trend: string;
  readonly accent: string;
}

/**
 * Link status configurations for indicators and badges
 */
export const LINK_STATUS_CONFIGS: Record<LinkStatus, StatusConfig> = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-600',
    text: 'Active',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  paused: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotColor: 'bg-yellow-600',
    text: 'Paused',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  expired: {
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-600',
    text: 'Expired',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
  },
} as const;

/**
 * Default link status
 */
export const DEFAULT_LINK_STATUS: LinkStatus = 'active' as const;

/**
 * Color theme classes for different UI elements
 */
export const COLOR_THEME_CLASSES: Record<ColorType, ColorClasses> = {
  primary: {
    icon: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
    trend: 'text-[var(--primary)]',
    accent: 'border-l-[var(--primary)]',
  },
  secondary: {
    icon: 'text-[var(--secondary)] bg-[var(--secondary-subtle)]',
    trend: 'text-[var(--secondary)]',
    accent: 'border-l-[var(--secondary)]',
  },
  tertiary: {
    icon: 'text-[var(--tertiary)] bg-[var(--tertiary-subtle)]',
    trend: 'text-[var(--tertiary)]',
    accent: 'border-l-[var(--tertiary)]',
  },
  success: {
    icon: 'text-[var(--success-green)] bg-green-50',
    trend: 'text-[var(--success-green)]',
    accent: 'border-l-[var(--success-green)]',
  },
} as const;

/**
 * Visibility configuration for public/private links
 */
export const VISIBILITY_CONFIGS = {
  public: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'Globe',
    text: 'Public',
    description: 'Anyone can access',
  },
  private: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'EyeOff',
    text: 'Private',
    description: 'Restricted access',
  },
} as const;

/**
 * UI messages and text constants
 */
export const UI_MESSAGES = {
  loading: 'Loading...',
  noData: 'No data available',
  error: 'Something went wrong',
  success: 'Operation completed successfully',
  emptyState: {
    title: 'No links yet',
    description: 'Create your first upload link to get started',
    action: 'Create Link',
  },
  upload: {
    dragDrop: 'Drag and drop files here, or click to select',
    uploading: 'Uploading files...',
    success: 'Files uploaded successfully',
    error: 'Upload failed',
  },
} as const;

/**
 * Validation messages
 */
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  fileSize: 'File size exceeds limit',
  fileType: 'File type not allowed',
  maxFiles: 'Maximum number of files exceeded',
  password: {
    required: 'Password is required when protection is enabled',
    minLength: 'Password must be at least 6 characters',
    maxLength: 'Password must be less than 50 characters',
  },
} as const;
