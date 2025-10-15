// =============================================================================
// LINK VALIDATION SCHEMAS
// =============================================================================
// Zod schemas for validating link action inputs
// Replaces ad-hoc validation with consistent, reusable schemas

import { z } from 'zod';
import { sanitizeSlug } from '@/lib/utils/security';
import {
  LINK_NAME_MIN_LENGTH,
  LINK_NAME_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  CUSTOM_MESSAGE_MAX_LENGTH,
  RESERVED_SLUGS,
} from './constants';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * UUID validation schema
 * Used for validating link IDs, workspace IDs, etc.
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid ID format. Must be a valid UUID.',
});

/**
 * Link name validation schema
 * Ensures name is between 3-255 characters
 */
export const linkNameSchema = z
  .string()
  .min(LINK_NAME_MIN_LENGTH, {
    message: `Link name must be at least ${LINK_NAME_MIN_LENGTH} characters.`,
  })
  .max(LINK_NAME_MAX_LENGTH, {
    message: `Link name must be less than ${LINK_NAME_MAX_LENGTH} characters.`,
  })
  .trim();

/**
 * Slug validation schema
 * Sanitizes slug and validates it meets requirements
 * - Uses global sanitizeSlug() for consistency
 * - Checks for reserved slugs
 * - Validates length requirements
 */
export const slugSchema = z
  .string()
  .min(1, { message: 'Slug is required.' })
  .transform((val) => sanitizeSlug(val))
  .refine((val) => val && val.length >= SLUG_MIN_LENGTH, {
    message: `Slug must be at least ${SLUG_MIN_LENGTH} characters after sanitization.`,
  })
  .refine((val) => val && val.length <= SLUG_MAX_LENGTH, {
    message: `Slug must be less than ${SLUG_MAX_LENGTH} characters.`,
  })
  .refine((val) => !RESERVED_SLUGS.includes(val as any), {
    message: 'This slug is reserved and cannot be used.',
  });

/**
 * Link configuration schema
 * Validates the JSON configuration object for links
 */
export const linkConfigSchema = z.object({
  notifyOnUpload: z.boolean().optional(),
  customMessage: z
    .string()
    .max(CUSTOM_MESSAGE_MAX_LENGTH, {
      message: `Custom message must be less than ${CUSTOM_MESSAGE_MAX_LENGTH} characters.`,
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
// PERMISSION SCHEMAS (for Phase 3)
// =============================================================================

/**
 * Email validation schema
 * Validates email format
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format.' })
  .toLowerCase()
  .trim();

/**
 * Permission role schema
 * Validates that role is one of the allowed values
 */
export const permissionRoleSchema = z.enum(['owner', 'editor', 'uploader'], {
  message: 'Role must be owner, editor, or uploader.',
});

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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates data against a schema and returns typed result
 * Throws LinkActionResponse if validation fails (to be caught by HOF)
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws LinkActionResponse with validation message if invalid
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Extract first error message for user-friendly feedback
    const firstError = result.error.issues[0];
    const errorMessage = firstError?.message || 'Validation failed';

    // Throw as LinkActionResponse so HOF preserves the validation error message
    throw {
      success: false,
      error: errorMessage,
    } as const;
  }

  return result.data;
}
