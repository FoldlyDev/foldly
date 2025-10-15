// =============================================================================
// LINKS MODULE EXPORTS
// =============================================================================
// Centralized export for all link-related functionality

// =============================================================================
// COMPONENTS
// =============================================================================

export * from './components';

// =============================================================================
// ACTIONS
// =============================================================================

export {
  // Read actions
  getUserLinksAction,
  getLinkByIdAction,
  // Write actions
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
  // Validation actions
  checkSlugAvailabilityAction,
  // Permission actions
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
  getLinkPermissionsAction,
  // Types
  type LinkActionResponse,
} from './lib/actions';

// =============================================================================
// HOOKS
// =============================================================================

export {
  // Query hooks
  useUserLinks,
  useLinkById,
  useCheckSlugAvailability,
  useGetLinkPermissions,
  // Mutation hooks
  useCreateLink,
  useUpdateLink,
  useUpdateLinkConfig,
  useDeleteLink,
  useAddPermission,
  useRemovePermission,
  useUpdatePermission,
  // Query keys
  linkKeys,
} from './hooks/use-links';

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Action input types
  CreateLinkInput,
  UpdateLinkInput,
  UpdateLinkConfigInput,
  DeleteLinkInput,
  CheckSlugInput,
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from './lib/validation/link-schemas';

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  // Action names
  ACTION_NAMES,
  // Error messages
  ERROR_MESSAGES,
  // Validation constants
  LINK_NAME_MIN_LENGTH,
  LINK_NAME_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  CUSTOM_MESSAGE_MAX_LENGTH,
  RESERVED_SLUGS,
} from './lib/validation/constants';
