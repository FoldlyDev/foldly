// =============================================================================
// LINK MODULE CONSTANTS
// =============================================================================
// Centralized constants for validation rules, error messages, and configuration
// Eliminates magic strings and improves maintainability

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const LINK_NAME_MIN_LENGTH = 3;
export const LINK_NAME_MAX_LENGTH = 255;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 100;
export const CUSTOM_MESSAGE_MAX_LENGTH = 500;

/**
 * Reserved slugs that cannot be used (system routes)
 * These protect critical application routes from being overridden
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'dashboard',
  'settings',
  'login',
  'signup',
  'logout',
  'profile',
  'help',
  'docs',
  'about',
  'contact',
  'support',
  'terms',
  'privacy',
  'onboarding',
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

// =============================================================================
// ERROR MESSAGES
// =============================================================================

/**
 * Centralized error messages for consistent user feedback
 * Organized by category for easy maintenance
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    UNAUTHORIZED: 'Unauthorized. Please sign in.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  },

  // Workspace errors
  WORKSPACE: {
    NOT_FOUND: 'Workspace not found. Please complete onboarding.',
    ACCESS_DENIED: 'You do not have access to this workspace.',
  },

  // Link errors
  LINK: {
    NOT_FOUND: 'Link not found.',
    ACCESS_DENIED: 'You do not have permission to access this link.',
    SLUG_TAKEN: 'This slug is already in use. Please choose a different one.',
    SLUG_RESERVED: 'This slug is reserved and cannot be used.',
    CREATION_FAILED: 'Failed to create link. Please try again.',
    UPDATE_FAILED: 'Failed to update link. Please try again.',
    DELETE_FAILED: 'Failed to delete link. Please try again.',
    INVALID_CONFIG: 'Invalid link configuration.',
  },

  // Permission errors
  PERMISSION: {
    NOT_FOUND: 'Permission not found.',
    ALREADY_EXISTS: 'Permission already exists for this email.',
    CANNOT_REMOVE_OWNER: 'Cannot remove owner permission.',
    INVALID_ROLE: 'Invalid permission role.',
    ADD_FAILED: 'Failed to add permission. Please try again.',
    REMOVE_FAILED: 'Failed to remove permission. Please try again.',
    UPDATE_FAILED: 'Failed to update permission. Please try again.',
  },

  // Validation errors
  VALIDATION: {
    INVALID_INPUT: 'Invalid input provided.',
    INVALID_UUID: 'Invalid ID format.',
    INVALID_EMAIL: 'Invalid email format.',
    INVALID_SLUG: 'Invalid slug format.',
    NAME_TOO_SHORT: `Link name must be at least ${LINK_NAME_MIN_LENGTH} characters.`,
    NAME_TOO_LONG: `Link name must be less than ${LINK_NAME_MAX_LENGTH} characters.`,
    SLUG_TOO_SHORT: `Slug must be at least ${SLUG_MIN_LENGTH} characters.`,
    SLUG_TOO_LONG: `Slug must be less than ${SLUG_MAX_LENGTH} characters.`,
    MESSAGE_TOO_LONG: `Custom message must be less than ${CUSTOM_MESSAGE_MAX_LENGTH} characters.`,
  },

  // Rate limit errors
  RATE_LIMIT: {
    EXCEEDED: 'Too many requests. Please try again later.',
    BLOCKED: 'You have been temporarily blocked due to too many requests.',
  },

  // Generic errors
  GENERIC: {
    UNEXPECTED: 'An unexpected error occurred.',
    DATABASE_ERROR: 'Database error. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
  },
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

/**
 * Centralized success messages for consistent user feedback
 * Used in toast notifications and action responses
 */
export const SUCCESS_MESSAGES = {
  LINK: {
    CREATED: 'Link created successfully.',
    UPDATED: 'Link updated successfully.',
    DELETED: 'Link deleted successfully.',
    CONFIG_UPDATED: 'Link configuration updated successfully.',
  },
  PERMISSION: {
    ADDED: 'Permission added successfully.',
    REMOVED: 'Permission removed successfully.',
    UPDATED: 'Permission updated successfully.',
  },
} as const;

// =============================================================================
// ACTION NAMES (for logging)
// =============================================================================

/**
 * Standardized action names for logging and monitoring
 * Used in withLinkAuth() HOF and security event logging
 */
export const ACTION_NAMES = {
  // Read actions
  GET_USER_LINKS: 'getUserLinksAction',
  GET_LINK_BY_ID: 'getLinkByIdAction',
  GET_LINK_BY_SLUG: 'getLinkBySlugAction',

  // Write actions
  CREATE_LINK: 'createLinkAction',
  UPDATE_LINK: 'updateLinkAction',
  UPDATE_LINK_CONFIG: 'updateLinkConfigAction',
  DELETE_LINK: 'deleteLinkAction',

  // Validation actions
  CHECK_SLUG_AVAILABILITY: 'checkSlugAvailabilityAction',

  // Permission actions
  ADD_PERMISSION: 'addPermissionAction',
  REMOVE_PERMISSION: 'removePermissionAction',
  UPDATE_PERMISSION: 'updatePermissionAction',
  VERIFY_LINK_ACCESS: 'verifyLinkAccessAction',
  GET_LINK_PERMISSIONS: 'getLinkPermissionsAction',
} as const;

export type ActionName = (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES];
