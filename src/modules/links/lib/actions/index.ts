// =============================================================================
// LINK ACTIONS INDEX - Module-Specific Actions Export
// =============================================================================
// Centralized export for all link-related actions
// Organized by operation type: Read, Write, Validation

// =============================================================================
// ACTION HELPERS & TYPES
// =============================================================================

export type { LinkActionResponse } from './action-helpers';

// =============================================================================
// READ ACTIONS
// =============================================================================

export { getUserLinksAction, getLinkByIdAction } from './link-read.actions';

// =============================================================================
// WRITE ACTIONS
// =============================================================================

export {
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
} from './link-write.actions';

// =============================================================================
// VALIDATION ACTIONS
// =============================================================================

export { checkSlugAvailabilityAction } from './link-validation.actions';

// =============================================================================
// PERMISSION ACTIONS
// =============================================================================

export {
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
  getLinkPermissionsAction,
} from './link-permissions.actions';

// =============================================================================
// INPUT TYPES (from schemas)
// =============================================================================

export type {
  CreateLinkInput,
  UpdateLinkInput,
  UpdateLinkConfigInput,
  DeleteLinkInput,
  CheckSlugInput,
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from '../validation/link-schemas';
