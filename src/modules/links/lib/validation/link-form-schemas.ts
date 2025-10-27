// =============================================================================
// LINK FORM VALIDATION SCHEMAS - Form-Specific Validations
// =============================================================================
// Extends base link schemas with form-specific validation logic
// These schemas are used for form validation with React Hook Form
// Reusable across create, edit, and settings forms

import { z } from 'zod';
import type { FileWithPreview } from '@/hooks/utility/use-file-upload';

// Import base field schemas from global - single source of truth
import {
  linkNameSchema,
  slugSchema,
  isPublicFieldSchema,
  allowedEmailsFieldSchema,
  passwordProtectedFieldSchema,
  passwordFieldSchema,
} from '@/lib/validation/link-schemas';

// Import branding field schemas from branding module
import {
  accentColorFieldSchema,
  backgroundColorFieldSchema,
} from './link-branding-schemas';

// =============================================================================
// FORM-SPECIFIC SCHEMAS
// =============================================================================

/**
 * File upload schema for logo
 * Form-specific: validates FileWithPreview array from file upload hook
 */
export const logoFieldSchema = z.array(z.custom<FileWithPreview>());

/**
 * Advanced Options field schemas
 * Form-specific: UI fields for link configuration
 */
export const customMessageFieldSchema = z.string().max(500).optional();
export const notifyOnUploadFieldSchema = z.boolean();
export const requireNameFieldSchema = z.boolean();
export const expiresAtFieldSchema = z.date().optional().nullable();

/**
 * Create Link Form Schema
 * Used for the link creation form with all fields and conditional validation
 *
 * Conditional Rules:
 * - Password required when passwordProtected is true
 * - At least one email required when isPublic is false
 * - Logo and colors only relevant when brandingEnabled is true
 */
export const createLinkFormSchema = z
  .object({
    name: linkNameSchema,
    slug: slugSchema,
    isPublic: isPublicFieldSchema,
    allowedEmails: allowedEmailsFieldSchema,
    passwordProtected: passwordProtectedFieldSchema,
    password: z.string().optional(),
    brandingEnabled: z.boolean(),
    logo: logoFieldSchema,
    accentColor: accentColorFieldSchema,
    backgroundColor: backgroundColorFieldSchema,
    // Advanced Options
    customMessage: customMessageFieldSchema,
    notifyOnUpload: notifyOnUploadFieldSchema,
    requireName: requireNameFieldSchema,
    expiresAt: expiresAtFieldSchema,
  })
  .superRefine((data, ctx) => {
    // Conditional validation: password required when password protection is enabled
    if (data.passwordProtected && (!data.password || data.password.length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 8 characters when password protection is enabled',
        path: ['password'],
      });
    }

    // Conditional validation: at least one email required for private links
    if (!data.isPublic && data.allowedEmails.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one email is required for private links',
        path: ['allowedEmails'],
      });
    }

    // Conditional validation: emails must be empty for public links
    if (data.isPublic && data.allowedEmails.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email invitations are not allowed for public links',
        path: ['allowedEmails'],
      });
    }
  });

export type CreateLinkFormData = z.infer<typeof createLinkFormSchema>;

/**
 * Edit/Settings Link Form Schema
 * Used for the link management/settings form
 *
 * Differences from create form:
 * - No email validation: Users manage permissions via dedicated Permissions modal
 * - Password validation remains the same
 * - All other fields identical to create form
 */
export const editLinkFormSchema = z
  .object({
    name: linkNameSchema,
    slug: slugSchema,
    isPublic: isPublicFieldSchema,
    allowedEmails: allowedEmailsFieldSchema,
    passwordProtected: passwordProtectedFieldSchema,
    password: z.string().optional(),
    brandingEnabled: z.boolean(),
    logo: logoFieldSchema,
    accentColor: accentColorFieldSchema,
    backgroundColor: backgroundColorFieldSchema,
    // Advanced Options
    customMessage: customMessageFieldSchema,
    notifyOnUpload: notifyOnUploadFieldSchema,
    requireName: requireNameFieldSchema,
    expiresAt: expiresAtFieldSchema,
  })
  .superRefine((data, ctx) => {
    // Conditional validation: password required when password protection is enabled
    if (data.passwordProtected && (!data.password || data.password.length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 8 characters when password protection is enabled',
        path: ['password'],
      });
    }

    // NO email validation for edit form - users manage via Permissions modal
  });

export type EditLinkFormData = z.infer<typeof editLinkFormSchema>;

/**
 * Link Settings Form Schema
 * Alias for edit form schema - used in settings modal/page
 */
export const linkSettingsFormSchema = editLinkFormSchema;

export type LinkSettingsFormData = z.infer<typeof linkSettingsFormSchema>;
