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
  // Logo deletion (upload now handled by useUppyUpload hook)
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
  // Note: Logo upload now uses global useUppyUpload hook from @/hooks
  useUpdateLinkBranding,
  useDeleteBrandingLogo,
} from './hooks';

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Action input types (from global validation)
  CreateLinkInput,
  UpdateLinkInput,
  UpdateLinkConfigInput,
  DeleteLinkInput,
  CheckSlugInput,
} from '@/lib/validation';

export type {
  // Permission types (from global validation)
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from '@/lib/validation';

export type {
  // Branding action types
  // Note: UploadBrandingLogoInput removed - now using useUppyUpload hook
  UpdateLinkBrandingInput,
  DeleteBrandingLogoInput,
} from './lib/validation/link-branding-schemas';
