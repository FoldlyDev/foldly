/**
 * Links Feature Validation Schemas
 *
 * Modern validation architecture following 2025 best practices:
 * - Standard Schema specification compliance
 * - Separation of concerns (forms vs actions vs database)
 * - Modular organization for maintainability
 * - Type safety and reusability
 *
 * @module links/lib/validations
 */

// =============================================================================
// BASE UTILITIES & SCHEMAS
// =============================================================================

export {
  // Utilities
  type ActionResult,
  handleFieldErrors,

  // Base schemas
  hexColorSchema,
  fileTypesSchema,
  topicSchema,
  titleSchema,
  descriptionSchema,
  passwordSchema,
  maxFilesSchema,
  maxFileSizeSchema,
  urlSchema,
  uuidSchema,

  // Refinement helpers
  withPasswordRequirement,
  withBrandingValidation,
} from './base';

// =============================================================================
// FORM VALIDATION SCHEMAS
// =============================================================================

export {
  // Main form schemas
  createLinkFormSchema,
  linkInformationSchema,
  linkBrandingSchema,
  generalSettingsSchema,

  // Quick edit schemas
  linkNameEditSchema,
  linkDescriptionEditSchema,
  bulkOperationsSchema,

  // Form types
  type CreateLinkFormData,
  type LinkInformationFormData,
  type LinkBrandingFormData,
  type GeneralSettingsFormData,
  type LinkNameEditFormData,
  type LinkDescriptionEditFormData,
  type BulkOperationsFormData,
} from './forms';

// =============================================================================
// SERVER ACTION VALIDATION SCHEMAS
// =============================================================================

export {
  // Action schemas
  createLinkActionSchema,
  updateLinkActionSchema,
  deleteLinkActionSchema,
  bulkDeleteActionSchema,
  toggleLinkActionSchema,
  duplicateLinkActionSchema,
  updateSettingsActionSchema,

  // Flexible types
  type FlexibleLinkUpdate,

  // Action types
  type CreateLinkActionData,
  type UpdateLinkActionData,
  type DeleteLinkActionData,
  type BulkDeleteActionData,
  type ToggleLinkActionData,
  type DuplicateLinkActionData,
  type UpdateSettingsActionData,
} from './actions';

// =============================================================================
// DATABASE VALIDATION SCHEMAS
// =============================================================================

export {
  // Database schemas
  databaseLinkSchema,
  databaseLinkInsertSchema,
  databaseLinkUpdateSchema,
  databaseLinkSelectSchema,

  // Database helpers
  validateDatabaseConstraints,
  validateDatabaseInsert,
  validateDatabaseUpdate,

  // Database types
  type DatabaseLink,
  type DatabaseLinkInsert,
  type DatabaseLinkUpdate,
  type DatabaseLinkSelect,
} from './database';

// =============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Note: Temporarily removed deprecated re-exports to fix build issues
// These should be added back once the webpack issue is resolved
