/**
 * Links Actions - Barrel Export
 * Centralized exports for all link-related server actions
 */

// Create actions
export { createLinkAction } from './create';

// Fetch actions
export { fetchLinksAction, fetchLinkByIdAction } from './fetch';

// Update actions
export { updateLinkAction, updateLinkSettingsAction } from './update';

// Delete actions
export { deleteLinkAction, bulkDeleteLinksAction } from './delete';

// Toggle actions
export { toggleLinkActiveAction } from './toggle';

// Duplicate actions
export { duplicateLinkAction } from './duplicate';

// Validation actions
export { checkSlugAvailabilityAction } from './check-slug-availability';
export type {
  CheckSlugAvailabilityInput,
  SlugAvailabilityResult,
} from './check-slug-availability';
export { checkTopicAvailabilityAction } from './check-topic-availability';
export type {
  CheckTopicAvailabilityInput,
  TopicAvailabilityResult,
} from './check-topic-availability';

// Shared utilities and types
export type { AuditEntry } from './shared';
export { requireAuth, logAudit } from './shared';

// Re-export validation types and schemas
export type { ActionResult, FlexibleLinkUpdate } from '../validations';
export {
  handleFieldErrors,
  createLinkActionSchema,
  updateLinkActionSchema,
  updateSettingsActionSchema as updateLinkSettingsSchema,
} from '../validations';
