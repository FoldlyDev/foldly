/**
 * Base validation schemas and utilities for the Links feature
 * Shared across forms, actions, and database validations
 *
 * @module links/lib/validations/base
 */

import { z } from 'zod';
import { validateTopicName } from '../utils';

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Action result type for consistent error handling
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  meta?: {
    isCascadeUpdate?: boolean;
    affectedLinksCount?: number;
    affectedLinkIds?: string[];
  };
}

/**
 * Helper function to handle Zod field errors
 */
export function handleFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  const flattened = error.flatten();

  Object.entries(flattened.fieldErrors).forEach(([key, errors]) => {
    if (errors) {
      fieldErrors[key] = errors;
    }
  });

  return fieldErrors;
}

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Hex color validation schema
 */
export const hexColorSchema = z
  .string()
  .regex(
    /^#[A-Fa-f0-9]{6}$/,
    'Must be a valid 6-digit hex color (e.g., #FF5733)'
  )
  .or(z.literal(''));

/**
 * Schema for file types - allow empty array for "all file types"
 */
export const fileTypesSchema = z.array(z.string());

/**
 * Enhanced topic validation schema with custom validation
 */
export const topicSchema = z
  .string()
  .min(1, 'Topic is required')
  .max(100, 'Topic must be less than 100 characters')
  .refine(
    topic => validateTopicName(topic).isValid,
    topic => ({
      message: validateTopicName(topic).error || 'Invalid topic format',
    })
  );

/**
 * Basic title validation schema
 */
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(255, 'Title must be less than 255 characters');

/**
 * Slug validation schema for base links
 */
export const slugSchema = z
  .string()
  .max(100, 'Slug must be less than 100 characters')
  .refine(
    slug => {
      if (!slug) return true; // Empty slug is allowed (will use username)
      return /^[a-zA-Z0-9_-]+$/.test(slug);
    },
    {
      message:
        'Slug can only contain letters, numbers, hyphens, and underscores',
    }
  )
  .optional();

/**
 * Description validation schema
 */
export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .optional();

/**
 * File limits validation schemas
 */
export const maxFilesSchema = z
  .number()
  .min(1, 'Must allow at least 1 file')
  .max(100, 'Cannot exceed 100 files');

export const maxFileSizeSchema = z
  .number()
  .min(1, 'Must be at least 1 MB')
  .max(1000, 'Cannot exceed 1000 MB');

/**
 * URL validation schema with empty string support
 */
export const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal(''));

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

// =============================================================================
// COMMON REFINEMENTS
// =============================================================================

/**
 * Password requirement refinement
 * Use this to add conditional password validation to any schema
 */
export function withPasswordRequirement<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return schema.refine(
    (data: any) => {
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
  );
}

/**
 * Branding object schema - matches database schema
 */
export const brandingSchema = z.object({
  enabled: z.boolean(),
  color: hexColorSchema.optional(),
  image: z.string().optional(), // Legacy: base64 image data (deprecated)
  imagePath: z.string().optional(), // Storage path in branding-images bucket
  imageUrl: z.string().optional(), // Public URL for the branding image
});

/**
 * Branding validation refinement
 * Use this to add conditional branding validation to any schema
 */
export function withBrandingValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return schema.refine(
    (data: any) => {
      if (data.branding?.enabled) {
        // If branding is enabled, brand color must be provided
        return !!data.branding?.color;
      }
      return true;
    },
    {
      message: 'Brand color must be configured when branding is enabled',
      path: ['branding', 'color'],
    }
  );
}
