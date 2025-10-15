// =============================================================================
// LINK MODULE CONSTANTS - Re-exports from Global Constants
// =============================================================================
// This file re-exports global constants for backward compatibility
// All constants have been moved to @/lib/constants

// Re-export error messages from global
export { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

// Re-export validation limits and reserved slugs from global
export { VALIDATION_LIMITS, RESERVED_SLUGS, type ReservedSlug } from '@/lib/constants/validation';

// Deprecated: Individual constant exports (use VALIDATION_LIMITS.LINK instead)
// Kept for backward compatibility with existing components
export const LINK_NAME_MIN_LENGTH = 3;
export const LINK_NAME_MAX_LENGTH = 255;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 100;
export const CUSTOM_MESSAGE_MAX_LENGTH = 500;

// =============================================================================
// ACTION NAMES (for logging)
// =============================================================================
// Note: Global actions now use inline string names instead of constants
// These are kept for any module-specific uses (e.g., UI components)

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
