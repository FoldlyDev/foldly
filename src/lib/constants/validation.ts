// =============================================================================
// VALIDATION CONSTANTS - Limits and Reserved Values
// =============================================================================

/**
 * Validation limits for various resources
 * Used by Zod schemas for consistent validation
 */
export const VALIDATION_LIMITS = {
  LINK: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 255,
    SLUG_MIN_LENGTH: 3,
    SLUG_MAX_LENGTH: 100,
    CUSTOM_MESSAGE_MAX_LENGTH: 500,
  },

  FOLDER: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 255,
    MAX_NESTING_DEPTH: 5, // Maximum folder nesting level
  },

  FILE: {
    NAME_MAX_LENGTH: 255,
    MAX_SIZE_BYTES: 100 * 1024 * 1024, // 100MB per file
    DESCRIPTION_MAX_LENGTH: 1000,
  },

  USER: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    BIO_MAX_LENGTH: 500,
  },

  WORKSPACE: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
  },

  EMAIL: {
    MAX_LENGTH: 320, // RFC 5321 standard
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
  },

  BRANDING: {
    LOGO_ALT_TEXT_MAX_LENGTH: 100,
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  },
} as const;

/**
 * Reserved slugs that cannot be used for links
 * These conflict with application routes
 */
export const RESERVED_SLUGS = [
  // Application routes
  'dashboard',
  'settings',
  'onboarding',
  'workspace',
  'analytics',
  'billing',
  'api',
  'admin',
  'auth',

  // Authentication routes
  'sign-in',
  'sign-up',
  'sign-out',
  'login',
  'logout',
  'register',
  'forgot-password',
  'reset-password',

  // Static routes
  'about',
  'contact',
  'privacy',
  'terms',
  'help',
  'support',
  'docs',
  'blog',
  'profile',

  // Technical routes
  '_next',
  'static',
  'public',
  'assets',
  'favicon',
  'robots',
  'sitemap',

  // Common reserved words
  'root',
  'system',
  'null',
  'undefined',
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

/**
 * Allowed file MIME types for upload
 * Can be extended for specific use cases
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;

/**
 * Rate limit preset identifiers
 * Used for consistent rate limiting across actions
 */
export const RATE_LIMIT_KEYS = {
  LINK_CREATION: 'link-creation',
  PERMISSION_MANAGEMENT: 'permission-management',
  FILE_UPLOAD: 'file-upload',
  USER_ACTION: 'user-action',
} as const;
