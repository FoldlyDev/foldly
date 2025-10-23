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
// HOOKS - Re-exported from Global Scope
// =============================================================================
// Note: Basic link/permission hooks are now global (cross-module usage)
// Only module-specific branding hooks remain in this module

export {
  // Link query hooks
  useUserLinks,
  useLinkById,
  useCheckSlugAvailability,
  // Link mutation hooks
  useCreateLink,
  useUpdateLink,
  useUpdateLinkConfig,
  useDeleteLink,
} from '@/hooks';

export {
  // Permission query hooks
  useLinkPermissions,
  // Permission mutation hooks
  useAddPermission,
  useRemovePermission,
  useUpdatePermission,
} from '@/hooks';

// =============================================================================
// MODULE-SPECIFIC HOOKS - Branding
// =============================================================================

export {
  // Branding mutation hooks (module-specific)
  useUpdateLinkBranding,
  useUploadBrandingLogo,
  useDeleteBrandingLogo,
} from './hooks';

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
} from './lib/validation/link-core-schemas';

export type {
  // Branding action types
  UpdateLinkBrandingInput,
  UploadBrandingLogoInput,
  DeleteBrandingLogoInput,
} from './lib/validation/link-branding-schemas';
