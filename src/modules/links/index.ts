// =============================================================================
// LINKS MODULE EXPORTS
// =============================================================================
// Centralized export for all link-related functionality

// =============================================================================
// COMPONENTS
// =============================================================================

export * from './components';

// =============================================================================
// ACTIONS - Re-exported from Global Scope
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
} from '@/lib/actions';

export type { ActionResponse as LinkActionResponse } from '@/lib/utils/action-helpers';

// =============================================================================
// MODULE-SPECIFIC ACTIONS - Branding
// =============================================================================

export {
  // Branding configuration
  updateLinkBrandingAction,
  // Logo upload/deletion
  uploadBrandingLogoAction,
  deleteBrandingLogoAction,
} from './lib/actions/branding.actions';

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
  UpdateLinkBrandingInput,
  DeleteLinkInput,
  CheckSlugInput,
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from './lib/validation/link-schemas';

export type {
  // Branding upload types
  UploadBrandingLogoInput,
  DeleteBrandingLogoInput,
} from './lib/validation/branding-schemas';

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  // Error messages
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  // Validation constants
  VALIDATION_LIMITS,
  RESERVED_SLUGS,
  type ReservedSlug,
} from './lib/validation/constants';
