// =============================================================================
// LINK MODULE CONSTANTS - Re-exports from Global Constants
// =============================================================================
// This file re-exports global constants for backward compatibility
// All constants have been moved to @/lib/constants

// Re-export error messages from global
export { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

// Re-export validation limits and reserved slugs from global
export { VALIDATION_LIMITS, RESERVED_SLUGS, type ReservedSlug } from '@/lib/constants/validation';

// =============================================================================
// ACTION NAMES (for logging)
// =============================================================================
// Note: Global actions now use inline string names instead of constants
// These are kept for any module-specific uses (e.g., UI components)

/**
 * Action name constants for link and permission operations
 *
 * Used for:
 * - Error logging and debugging (consistent action identifiers)
 * - UI component references (toast notifications, loading states)
 * - Test assertions and mocks
 *
 * Categories:
 * - Read actions: Retrieve link data by various criteria
 * - Write actions: Create, update, and delete link operations
 * - Validation actions: Check slug availability before creation
 * - Permission actions: Manage email-based access control
 *
 * @example
 * ```typescript
 * // In UI components
 * toast.error(`${ACTION_NAMES.CREATE_LINK} failed`);
 *
 * // In logging
 * logger.info(`Executing ${ACTION_NAMES.GET_USER_LINKS}`);
 * ```
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
