// =============================================================================
// BASE VALIDATION SCHEMAS - Reusable Across All Modules
// =============================================================================
// Core Zod schemas that can be composed and extended by module-specific schemas
// Includes sanitization integration and validation helpers

import { z } from 'zod';
import { sanitizeEmail, sanitizeSlug, sanitizeUsername } from '@/lib/utils/security';

/**
 * UUID validation schema
 * Used for validating all resource IDs (links, folders, files, workspaces, etc.)
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid ID format. Must be a valid UUID.',
});

/**
 * Email validation schema with sanitization
 * Converts to lowercase and validates format
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format.' })
  .transform((val) => sanitizeEmail(val))
  .refine((val) => val !== '', {
    message: 'Invalid email format after sanitization.',
  });

/**
 * Username validation schema with sanitization
 * Allows alphanumeric, hyphens, and underscores (preserves case for display)
 */
export const usernameSchema = z
  .string()
  .min(3, { message: 'Username must be at least 3 characters.' })
  .max(50, { message: 'Username must be less than 50 characters.' })
  .transform((val) => sanitizeUsername(val))
  .refine((val) => val !== '', {
    message: 'Invalid username format after sanitization.',
  });

/**
 * Permission role schema
 * Three roles: owner (full control), editor (manage content), uploader (upload only)
 */
export const permissionRoleSchema = z.enum(['owner', 'editor', 'uploader'], {
  message: 'Role must be owner, editor, or uploader.',
});

/**
 * Slug validation schema builder with sanitization
 * Creates a slug schema with configurable length and reserved slugs
 *
 * @param options - Configuration options
 * @returns Zod schema for slug validation
 *
 * @example
 * ```typescript
 * const linkSlugSchema = createSlugSchema({
 *   minLength: 3,
 *   maxLength: 100,
 *   reservedSlugs: ['dashboard', 'api', 'admin']
 * });
 * ```
 */
export function createSlugSchema(options?: {
  minLength?: number;
  maxLength?: number;
  reservedSlugs?: readonly string[];
}) {
  const { minLength = 3, maxLength = 100, reservedSlugs = [] } = options || {};

  return z
    .string()
    .min(1, { message: 'Slug is required.' })
    .transform((val) => sanitizeSlug(val))
    .refine((val) => val && val.length >= minLength, {
      message: `Slug must be at least ${minLength} characters after sanitization.`,
    })
    .refine((val) => val && val.length <= maxLength, {
      message: `Slug must be less than ${maxLength} characters.`,
    })
    .refine((val) => !reservedSlugs.includes(val), {
      message: 'This slug is reserved and cannot be used.',
    });
}

/**
 * Generic name validation schema builder
 * Creates a name schema with configurable length and resource type
 *
 * @param options - Configuration options
 * @returns Zod schema for name validation
 *
 * @example
 * ```typescript
 * const linkNameSchema = createNameSchema({
 *   minLength: 1,
 *   maxLength: 255,
 *   resourceType: 'Link name'
 * });
 * ```
 */
export function createNameSchema(options?: {
  minLength?: number;
  maxLength?: number;
  resourceType?: string;
}) {
  const { minLength = 1, maxLength = 255, resourceType = 'Name' } = options || {};

  return z
    .string()
    .min(minLength, {
      message: `${resourceType} must be at least ${minLength} characters.`,
    })
    .max(maxLength, {
      message: `${resourceType} must be less than ${maxLength} characters.`,
    })
    .trim();
}

/**
 * Generic description validation schema builder
 *
 * @param options - Configuration options
 * @returns Zod schema for description validation
 */
export function createDescriptionSchema(options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): z.ZodString | z.ZodOptional<z.ZodString> {
  const { minLength = 0, maxLength = 1000, required = false } = options || {};

  let schema: z.ZodString = z.string().max(maxLength, {
    message: `Description must be less than ${maxLength} characters.`,
  });

  if (required && minLength > 0) {
    schema = schema.min(minLength, {
      message: `Description must be at least ${minLength} characters.`,
    });
  }

  if (!required) {
    return schema.optional();
  }

  return schema;
}

/**
 * Validates data against a schema and returns typed result
 * Throws ActionResponse if validation fails (to be caught by HOF)
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ActionResponse if validation fails
 *
 * @example
 * ```typescript
 * const validated = validateInput(createLinkSchema, input);
 * // validated has inferred type from schema
 * ```
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    const errorMessage = firstError?.message || 'Validation failed';

    throw {
      success: false,
      error: errorMessage,
    } as const;
  }

  return result.data;
}
