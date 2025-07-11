/**
 * Client-side form validation schemas for the Links feature
 * Used with React Hook Form and form components
 *
 * @module links/lib/validations/forms
 */

import { z } from 'zod';
import {
  titleSchema,
  topicSchema,
  descriptionSchema,
  hexColorSchema,
  fileTypesSchema,
  maxFilesSchema,
  maxFileSizeSchema,
  withPasswordRequirement,
} from './base';

// =============================================================================
// CREATE LINK FORM SCHEMAS
// =============================================================================

/**
 * Schema for the main create link form
 * Aligned with database schema - database fields only
 */
export const createLinkFormSchema = z
  .object({
    // === DATABASE FIELDS ONLY (aligned with database schema) ===

    // Basic information
    title: titleSchema,
    topic: z.string().optional(), // Simplified to avoid ZodEffects nesting
    description: descriptionSchema,

    // Security settings
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().optional(),
    isPublic: z.boolean().default(true),

    // Upload settings (database fields)
    maxFiles: maxFilesSchema.default(100),
    maxFileSize: maxFileSizeSchema.default(100), // Form shows MB, converted to bytes in action
    allowedFileTypes: fileTypesSchema.default([]),
    expiresAt: z.string().optional(),

    // Branding (aligned with database field names)
    brandEnabled: z.boolean().default(false),
    brandColor: hexColorSchema.optional(),
  })
  .refine(
    data => {
      if (
        data.requirePassword &&
        (!data.password || data.password.length < 8)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Password is required and must be at least 8 characters when password protection is enabled',
      path: ['password'],
    }
  )
  .refine(
    data => {
      if (data.brandEnabled) {
        return !!data.brandColor;
      }
      return true;
    },
    {
      message: 'Brand color must be configured when branding is enabled',
      path: ['brandEnabled'],
    }
  );

/**
 * Schema for link information step (wizard step 1)
 */
export const linkInformationSchema = withPasswordRequirement(
  z.object({
    // Database fields only for this schema
    title: titleSchema,
    description: descriptionSchema,
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().optional(),
    isPublic: z.boolean().default(true),
    isActive: z.boolean().default(true),

    // Upload constraints (database fields)
    maxFiles: maxFilesSchema.default(100),
    maxFileSize: maxFileSizeSchema.default(100), // Form shows MB
    allowedFileTypes: fileTypesSchema.default([]),
    expiresAt: z.date().optional(),
  })
);

/**
 * Schema for link branding step (wizard step 2)
 * Aligned with database field names
 */
export const linkBrandingSchema = z.object({
  brandEnabled: z.boolean().default(false),
  brandColor: hexColorSchema.optional(),
});

/**
 * Schema for unified settings modal (includes both general and branding)
 * Used in the settings modal that combines multiple tabs
 */
export const generalSettingsSchema = withPasswordRequirement(
  z.object({
    // === DATABASE FIELDS ===

    // General settings
    isPublic: z.boolean().default(true),
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().default(''),
    expiresAt: z.string().optional(),

    // Upload constraints (database fields)
    maxFiles: maxFilesSchema.default(100),
    maxFileSize: maxFileSizeSchema.default(100), // Form shows MB
    allowedFileTypes: fileTypesSchema.default([]),

    // Branding settings (aligned with database field names)
    brandEnabled: z.boolean().default(false),
    brandColor: hexColorSchema.default(''),
  })
);

// =============================================================================
// SPECIALIZED FORM SCHEMAS
// =============================================================================

/**
 * Schema for link name edit (quick edit modal)
 */
export const linkNameEditSchema = z.object({
  title: titleSchema,
});

/**
 * Schema for link description edit (quick edit modal)
 */
export const linkDescriptionEditSchema = z.object({
  description: descriptionSchema,
});

/**
 * Schema for bulk operations form
 */
export const bulkOperationsSchema = z.object({
  selectedIds: z
    .array(z.string().uuid())
    .min(1, 'At least one link must be selected'),
  operation: z.enum(['delete', 'toggle_active', 'move_workspace']),
  targetWorkspaceId: z.string().uuid().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateLinkFormData = z.infer<typeof createLinkFormSchema>;
export type LinkInformationFormData = z.infer<typeof linkInformationSchema>;
export type LinkBrandingFormData = z.infer<typeof linkBrandingSchema>;
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
export type LinkNameEditFormData = z.infer<typeof linkNameEditSchema>;
export type LinkDescriptionEditFormData = z.infer<
  typeof linkDescriptionEditSchema
>;
export type BulkOperationsFormData = z.infer<typeof bulkOperationsSchema>;
