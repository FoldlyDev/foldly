/**
 * Server action validation schemas for the Links feature
 * Used with Next.js Server Actions for API validation
 *
 * @module links/lib/validations/actions
 */

import { z } from 'zod';
import {
  titleSchema,
  topicSchema,
  slugSchema,
  descriptionSchema,
  uuidSchema,
  maxFilesSchema,
  maxFileSizeSchema,
  fileTypesSchema,
  hexColorSchema,
  withPasswordRequirement,
} from './base';

// =============================================================================
// SERVER ACTION SCHEMAS
// =============================================================================

/**
 * Schema for create link server action
 * Only includes fields that are actually saved to the database
 */
export const createLinkActionSchema = withPasswordRequirement(
  z.object({
    // Required fields
    title: titleSchema,
    // workspaceId removed - will be resolved internally in server action

    // Optional fields (with database defaults)
    slug: slugSchema,
    topic: z.string().nullable().optional(), // null for base links, string for custom links
    description: descriptionSchema.optional(),
    requireEmail: z.boolean().default(false),
    requirePassword: z.boolean().default(false),
    password: z.string().optional(),
    isActive: z.boolean().default(true),

    // Upload constraints - aligned with database fields
    maxFiles: maxFilesSchema.default(100),
    maxFileSize: maxFileSizeSchema.default(100), // 100MB (will be converted to bytes in action)
    allowedFileTypes: fileTypesSchema.optional(),

    // Expiration
    expiresAt: z.string().optional(),

    // Branding - aligned with database field names
    brandEnabled: z.boolean().default(false),
    brandColor: hexColorSchema.optional(),
  })
);

/**
 * Schema for update link server action
 */
export const updateLinkActionSchema = withPasswordRequirement(
  z.object({
    id: uuidSchema,
    slug: slugSchema,
    title: titleSchema.optional(),
    topic: topicSchema.optional(),
    description: descriptionSchema.optional(),
    requireEmail: z.boolean().optional(),
    requirePassword: z.boolean().optional(),
    password: z.string().optional(),
    isActive: z.boolean().optional(),

    // Upload constraints
    maxFiles: maxFilesSchema.optional(),
    maxFileSize: maxFileSizeSchema.optional(),
    allowedFileTypes: fileTypesSchema.optional(),

    // Expiration
    expiresAt: z.string().optional(),

    // Branding - aligned with database field names
    brandEnabled: z.boolean().optional(),
    brandColor: hexColorSchema.optional(),
  })
);

/**
 * Schema for delete link server action
 */
export const deleteLinkActionSchema = z.object({
  id: uuidSchema,
});

/**
 * Schema for bulk delete server action
 */
export const bulkDeleteActionSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'At least one ID is required'),
});

/**
 * Schema for toggle link active status server action
 */
export const toggleLinkActionSchema = z.object({
  id: uuidSchema,
  isActive: z.boolean(),
});

/**
 * Schema for duplicate link server action
 */
export const duplicateLinkActionSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  workspaceId: uuidSchema.optional(),
});

/**
 * Schema for update settings server action
 */
export const updateSettingsActionSchema = withPasswordRequirement(
  z.object({
    id: uuidSchema,
    requireEmail: z.boolean().optional(),
    requirePassword: z.boolean().optional(),
    password: z.string().optional(),

    // Upload constraints
    maxFiles: maxFilesSchema.optional(),
    maxFileSize: maxFileSizeSchema.optional(),
    allowedFileTypes: fileTypesSchema.optional(),

    // Expiration
    expiresAt: z.string().optional(),

    // Branding - aligned with database field names
    brandEnabled: z.boolean().optional(),
    brandColor: hexColorSchema.optional(),
  })
);

// =============================================================================
// FLEXIBLE UPDATE TYPE
// =============================================================================

/**
 * Flexible link update type for server actions
 * Allows partial updates with type safety - aligned with database schema
 */
export type FlexibleLinkUpdate = Partial<{
  slug: string;
  title: string;
  topic: string;
  description: string | null;
  requireEmail: boolean;
  requirePassword: boolean;
  password: string | null;
  isActive: boolean;
  maxFiles: number;
  maxFileSize: number;
  allowedFileTypes: string[] | null;
  expiresAt: string | null;
  brandEnabled: boolean;
  brandColor: string | null;
}>;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateLinkActionData = z.infer<typeof createLinkActionSchema>;
export type UpdateLinkActionData = z.infer<typeof updateLinkActionSchema>;
export type DeleteLinkActionData = z.infer<typeof deleteLinkActionSchema>;
export type BulkDeleteActionData = z.infer<typeof bulkDeleteActionSchema>;
export type ToggleLinkActionData = z.infer<typeof toggleLinkActionSchema>;
export type DuplicateLinkActionData = z.infer<typeof duplicateLinkActionSchema>;
export type UpdateSettingsActionData = z.infer<
  typeof updateSettingsActionSchema
>;
