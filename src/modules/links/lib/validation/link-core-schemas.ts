// =============================================================================
// LINK VALIDATION SCHEMAS - Link-Specific Validations
// =============================================================================
// Extends base schemas from @/lib/validation with link-specific logic
// Imports global validation constants for consistent limits

import { z } from 'zod';

// Import base schemas from global
import {
  uuidSchema,
  emailSchema,
  permissionRoleSchema,
  createSlugSchema,
  createNameSchema,
  validateInput,
} from '@/lib/validation/base-schemas';

// Import constants from global
import { VALIDATION_LIMITS, RESERVED_SLUGS } from '@/lib/constants/validation';

// Re-export base schemas for backward compatibility in links module
export { uuidSchema, emailSchema, permissionRoleSchema, validateInput };

// =============================================================================
// LINK-SPECIFIC SCHEMAS
// =============================================================================

/**
 * Link name schema using global builder
 */
export const linkNameSchema = createNameSchema({
  minLength: VALIDATION_LIMITS.LINK.NAME_MIN_LENGTH,
  maxLength: VALIDATION_LIMITS.LINK.NAME_MAX_LENGTH,
  resourceType: 'Link name',
});

/**
 * Link slug schema using global builder with reserved slugs
 */
export const slugSchema = createSlugSchema({
  minLength: VALIDATION_LIMITS.LINK.SLUG_MIN_LENGTH,
  maxLength: VALIDATION_LIMITS.LINK.SLUG_MAX_LENGTH,
  reservedSlugs: RESERVED_SLUGS,
});

/**
 * Boolean schema for public/private link toggle
 */
export const isPublicFieldSchema = z.boolean();

/**
 * Array of emails for link access control
 * Used for private links to specify allowed email addresses
 */
export const allowedEmailsFieldSchema = z.array(emailSchema);

/**
 * Boolean schema for password protection toggle
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
});

// =============================================================================
// ACTION INPUT SCHEMAS
// =============================================================================

/**
 * Schema for creating a new link
 * Validates: name, slug, isPublic
 */
export const createLinkSchema = z.object({
  name: linkNameSchema,
  slug: slugSchema,
  isPublic: z.boolean().optional().default(false),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

/**
 * Schema for updating an existing link
 * Validates: linkId, optional name, slug, isPublic, isActive
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
 */
export const updateLinkConfigSchema = z.object({
  linkId: uuidSchema,
  config: linkConfigSchema,
});

export type UpdateLinkConfigInput = z.infer<typeof updateLinkConfigSchema>;

/**
 * Schema for deleting a link
 * Validates: linkId
 */
export const deleteLinkSchema = z.object({
  linkId: uuidSchema,
});

export type DeleteLinkInput = z.infer<typeof deleteLinkSchema>;

/**
 * Schema for checking slug availability
 * Validates: slug format
 */
export const checkSlugSchema = z.object({
  slug: slugSchema,
});

export type CheckSlugInput = z.infer<typeof checkSlugSchema>;

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

/**
 * Schema for adding a permission to a link
 * Validates: linkId, email, role
 */
export const addPermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
  role: permissionRoleSchema,
});

export type AddPermissionInput = z.infer<typeof addPermissionSchema>;

/**
 * Schema for removing a permission from a link
 * Validates: linkId, email
 */
export const removePermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
});

export type RemovePermissionInput = z.infer<typeof removePermissionSchema>;

/**
 * Schema for updating a permission role
 * Validates: linkId, email, newRole
 */
export const updatePermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
  role: permissionRoleSchema,
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

/**
 * Schema for verifying link access
 * Validates: linkId, email
 */
export const verifyLinkAccessSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
});

export type VerifyLinkAccessInput = z.infer<typeof verifyLinkAccessSchema>;
