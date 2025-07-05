/**
 * Zod schemas for all Links feature forms
 * Following 2025 best practices with React Hook Form integration
 * Based on Brendonovich's ultimate form abstraction patterns
 */

import { z } from 'zod';
import { validateTopicName } from '../utils';

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

/**
 * Hex color validation schema
 */
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
  .or(z.literal(''));

/**
 * Schema for file types - allow empty array for "all file types"
 */
const fileTypesSchema = z.array(z.string());

/**
 * Enhanced topic validation schema
 */
const topicSchema = z
  .string()
  .min(1, 'Topic is required')
  .max(50, 'Topic must be less than 50 characters')
  .refine(
    topic => validateTopicName(topic).isValid,
    topic => ({
      message: validateTopicName(topic).error || 'Invalid topic format',
    })
  );

// =============================================================================
// CREATE LINK FORM SCHEMAS
// =============================================================================

/**
 * Schema for the main create link form
 * Covers all steps: information, branding, and validation
 */
export const createLinkFormSchema = z
  .object({
    // Basic information
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title must be less than 100 characters'),
    topic: topicSchema,
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional(),
    instructions: z
      .string()
      .max(1000, 'Instructions must be less than 1000 characters')
      .optional(),

    // Security settings
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().optional(),
    isPublic: z.boolean().default(true),

    // Upload settings
    maxFiles: z
      .number()
      .min(1, 'Must allow at least 1 file')
      .max(100, 'Cannot exceed 100 files'),
    maxFileSize: z
      .number()
      .min(1, 'Must be at least 1 MB')
      .max(1000, 'Cannot exceed 1000 MB'),
    allowedFileTypes: fileTypesSchema,
    expiresAt: z.string().optional(),
    autoCreateFolders: z.boolean().default(false),
    allowFolderCreation: z.boolean().default(false),

    // Branding
    brandingEnabled: z.boolean().default(false),
    brandColor: hexColorSchema.optional(),
    accentColor: hexColorSchema.optional(),
    logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    customCss: z.string().optional(),
    welcomeMessage: z
      .string()
      .max(500, 'Welcome message must be less than 500 characters')
      .optional(),
  })
  .refine(
    data => {
      // Custom validation for password requirement
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

/**
 * Schema for link information step
 */
export const linkInformationSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional(),
    requireEmail: z.boolean().default(false),
    maxFiles: z
      .number()
      .min(1, 'Must allow at least 1 file')
      .max(100, 'Cannot exceed 100 files'),
    maxFileSize: z
      .number()
      .min(1, 'Must be at least 1 MB')
      .max(1000, 'Cannot exceed 1000 MB'),
    allowedFileTypes: fileTypesSchema,
    autoCreateFolders: z.boolean().default(false),
    isPublic: z.boolean().default(true),
    requirePassword: z.boolean().default(false),
    password: z.string().optional(),
    isActive: z.boolean().default(true),
    expiresAt: z.date().optional(),
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
  );

/**
 * Schema for link branding step
 */
export const linkBrandingSchema = z.object({
  brandingEnabled: z.boolean().default(false),
  brandColor: hexColorSchema,
  accentColor: hexColorSchema,
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

/**
 * Schema for unified settings modal (includes both general and branding)
 */
export const generalSettingsSchema = z
  .object({
    // General settings
    isPublic: z.boolean().default(true),
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().default(''),
    expiresAt: z.string().optional(),
    maxFiles: z.number().min(1).max(100).optional(),
    maxFileSize: z
      .number()
      .min(1, 'Must be at least 1 MB')
      .max(1000, 'Cannot exceed 1000 MB'),
    allowedFileTypes: fileTypesSchema,
    autoCreateFolders: z.boolean().default(false),
    allowMultiple: z.boolean().default(true),
    customMessage: z
      .string()
      .max(500, 'Custom message must be less than 500 characters')
      .default(''),

    // Branding settings - now included in unified schema
    brandingEnabled: z.boolean().default(false),
    brandColor: hexColorSchema.default(''),
    accentColor: hexColorSchema.default(''),
    logoUrl: z
      .string()
      .url('Must be a valid URL')
      .optional()
      .or(z.literal(''))
      .default(''),
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
  );

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateLinkFormData = z.infer<typeof createLinkFormSchema>;
export type LinkInformationFormData = z.infer<typeof linkInformationSchema>;
export type LinkBrandingFormData = z.infer<typeof linkBrandingSchema>;
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
