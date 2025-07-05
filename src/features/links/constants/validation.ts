/**
 * Validation Constants and Rules
 * Form validation patterns, rules, and error messages
 * Following 2025 validation best practices
 */

export interface ValidationRule {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly min?: number;
  readonly max?: number;
  readonly message?: string;
}

export interface FieldValidation {
  readonly [fieldName: string]: ValidationRule;
}

/**
 * File upload validation limits - centralized constants
 * Following 2025 best practices for consistent validation across the app
 */
export const FILE_UPLOAD_LIMITS = {
  MIN_FILES: 1,
  MAX_FILES: 1000,
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  DEFAULT_MAX_FILES: 100,
  DEFAULT_MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Link-specific validation rules
 */
export const LINK_VALIDATION_RULES: FieldValidation = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Link name must be between 1 and 100 characters',
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 200,
    message: 'Title must be between 1 and 200 characters',
  },
  description: {
    maxLength: 500,
    message: 'Description cannot exceed 500 characters',
  },
  topic: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\-_\s]+$/,
    message:
      'Topic can only contain letters, numbers, hyphens, underscores, and spaces',
  },
  slug: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9\-_]+$/,
    message: 'Slug can only contain letters, numbers, hyphens, and underscores',
  },
  password: {
    minLength: 6,
    maxLength: 50,
    message: 'Password must be between 6 and 50 characters',
  },
  maxFiles: {
    required: true,
    min: FILE_UPLOAD_LIMITS.MIN_FILES,
    max: FILE_UPLOAD_LIMITS.MAX_FILES,
    message: `Maximum files must be between ${FILE_UPLOAD_LIMITS.MIN_FILES} and ${FILE_UPLOAD_LIMITS.MAX_FILES}`,
  },
  maxFileSize: {
    required: true,
    min: FILE_UPLOAD_LIMITS.MIN_FILE_SIZE,
    max: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE,
    message: `Maximum file size must be between ${Math.round(FILE_UPLOAD_LIMITS.MIN_FILE_SIZE / 1024)}KB and ${Math.round(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB`,
  },
} as const;

/**
 * File validation rules
 */
export const FILE_VALIDATION_RULES = {
  fileName: {
    required: true,
    maxLength: 255,
    pattern: /^[^<>:"/\\|?*]+$/,
    message: 'Invalid file name characters',
  },
  fileSize: {
    min: 1024, // 1KB minimum
    max: 1024 * 1024 * 1024, // 1GB maximum
    message: 'File size must be between 1KB and 1GB',
  },
  fileType: {
    pattern: /^[a-zA-Z0-9\/\-\.]+$/,
    message: 'Invalid file type',
  },
} as const;

/**
 * URL validation patterns
 */
export const URL_VALIDATION_PATTERNS = {
  slug: /^[a-zA-Z0-9\-_]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  hexColor: /^#([0-9A-F]{3}){1,2}$/i,
  username: /^[a-zA-Z0-9_-]{3,30}$/,
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_ERROR_MESSAGES = {
  required: 'This field is required',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  pattern: 'Invalid format',
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  password: {
    required: 'Password is required when protection is enabled',
    weak: 'Password is too weak',
    mismatch: 'Passwords do not match',
  },
  file: {
    tooLarge: 'File is too large',
    invalidType: 'File type not allowed',
    tooMany: 'Too many files',
    empty: 'File is empty',
  },
  link: {
    slugTaken: 'This URL is already taken',
    invalidSlug: 'URL contains invalid characters',
    expired: 'Link has expired',
    inactive: 'Link is inactive',
  },
} as const;

/**
 * Validation success messages
 */
export const VALIDATION_SUCCESS_MESSAGES = {
  linkCreated: 'Link created successfully',
  linkUpdated: 'Link updated successfully',
  linkDeleted: 'Link deleted successfully',
  fileUploaded: 'File uploaded successfully',
  settingsSaved: 'Settings saved successfully',
  passwordUpdated: 'Password updated successfully',
  brandingUpdated: 'Branding updated successfully',
} as const;
