// =============================================================================
// LINK VALIDATION SCHEMAS - Core Link Validation
// =============================================================================
// Used by: Global link actions (cross-module), workspace module, uploads module
// Extends base schemas with link-specific logic and validation limits

import { z } from 'zod';

// Import base schemas from global
import {
  uuidSchema,
  emailSchema,
  createSlugSchema,
  createNameSchema,
} from './base-schemas';

// Import constants from global
import { VALIDATION_LIMITS, RESERVED_SLUGS } from '@/lib/constants/validation';

// =============================================================================
// FIELD SCHEMAS (7 schemas)
// =============================================================================

/**
 * Link name schema using global builder
 * Used in: Create link, update link, forms
 */
export const linkNameSchema = createNameSchema({
  minLength: VALIDATION_LIMITS.LINK.NAME_MIN_LENGTH,
  maxLength: VALIDATION_LIMITS.LINK.NAME_MAX_LENGTH,
  resourceType: 'Link name',
});

/**
 * Link slug schema using global builder with reserved slugs
 * Used in: Create link, update link, slug availability check
 */
export const slugSchema = createSlugSchema({
  minLength: VALIDATION_LIMITS.LINK.SLUG_MIN_LENGTH,
  maxLength: VALIDATION_LIMITS.LINK.SLUG_MAX_LENGTH,
  reservedSlugs: RESERVED_SLUGS,
});

/**
 * Boolean schema for public/private link toggle
 * Used in: Create link, update link
 */
export const isPublicFieldSchema = z.boolean();

/**
 * Array of emails for link access control
 * Used for private links to specify allowed email addresses
 */
export const allowedEmailsFieldSchema = z.array(emailSchema);

/**
 * Boolean schema for password protection toggle
 * Used in: Create link, update link, forms
 */
export const passwordProtectedFieldSchema = z.boolean();

/**
 * Password schema for link access control
 * Uses global password validation limits
 */
export const passwordFieldSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD.MIN_LENGTH, {
    message: `Password must be at least ${VALIDATION_LIMITS.PASSWORD.MIN_LENGTH} characters.`,
  })
  .max(VALIDATION_LIMITS.PASSWORD.MAX_LENGTH, {
    message: `Password must be less than ${VALIDATION_LIMITS.PASSWORD.MAX_LENGTH} characters.`,
  });

/**
 * Link configuration schema
 * Validates the JSON configuration object for links
 */
export const linkConfigSchema = z.object({
  notifyOnUpload: z.boolean().optional(),
  customMessage: z
    .string()
    .max(VALIDATION_LIMITS.LINK.CUSTOM_MESSAGE_MAX_LENGTH, {
      message: `Custom message must be less than ${VALIDATION_LIMITS.LINK.CUSTOM_MESSAGE_MAX_LENGTH} characters.`,
    })
    .nullable()
    .optional(),
  requiresName: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  passwordProtected: z.boolean().optional(),
  password: z.string().nullable().optional(),
});

// =============================================================================
// ACTION INPUT SCHEMAS (5 schemas)
// =============================================================================

/**
 * Schema for creating a new link
 * Validates: name, slug, isPublic, optional config, branding, and permissions
 * Used by: createLinkAction (global)
 */
export const createLinkSchema = z.object({
  name: linkNameSchema,
  slug: slugSchema,
  isPublic: z.boolean().optional().default(false),
  linkConfig: linkConfigSchema.optional(),
  branding: z
    .object({
      enabled: z.boolean(),
      colors: z
        .object({
          accentColor: z.string(),
          backgroundColor: z.string(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  allowedEmails: allowedEmailsFieldSchema.optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

/**
 * Schema for updating an existing link
 * Validates: linkId, optional name, slug, isPublic, isActive
 * Used by: updateLinkAction (global)
 */
export const updateLinkSchema = z.object({
  linkId: uuidSchema,
  name: linkNameSchema.optional(),
  slug: slugSchema.optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;

/**
 * Schema for updating link configuration
 * Validates: linkId, config object
 * Used by: updateLinkConfigAction (global)
 */
export const updateLinkConfigSchema = z.object({
  linkId: uuidSchema,
  config: linkConfigSchema,
});

export type UpdateLinkConfigInput = z.infer<typeof updateLinkConfigSchema>;

/**
 * Schema for deleting a link
 * Validates: linkId
 * Used by: deleteLinkAction (global)
 */
export const deleteLinkSchema = z.object({
  linkId: uuidSchema,
});

export type DeleteLinkInput = z.infer<typeof deleteLinkSchema>;

/**
 * Schema for checking slug availability
 * Validates: slug format
 * Used by: checkSlugAvailabilityAction (global)
 */
export const checkSlugSchema = z.object({
  slug: slugSchema,
});

export type CheckSlugInput = z.infer<typeof checkSlugSchema>;
