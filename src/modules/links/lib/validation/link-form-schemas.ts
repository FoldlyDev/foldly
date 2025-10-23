// =============================================================================
// LINK FORM VALIDATION SCHEMAS - Form-Specific Validations
// =============================================================================
// Extends base link schemas with form-specific validation logic
// These schemas are used for form validation with React Hook Form
// Reusable across create, edit, and settings forms

import { z } from 'zod';
import type { FileWithPreview } from '@/hooks/utility/use-file-upload';

// Import base field schemas - single source of truth
import {
  linkNameSchema,
  slugSchema,
  isPublicFieldSchema,
  allowedEmailsFieldSchema,
  passwordProtectedFieldSchema,
  passwordFieldSchema,
} from './link-core-schemas';

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
 * Create Link Form Schema
 * Used for the link creation form with all fields and conditional validation
 *
 * Conditional Rules:
 * - Password required when passwordProtected is true
 * - At least one email required when isPublic is false
 */
export const createLinkFormSchema = z
  .object({
    name: linkNameSchema,
    slug: slugSchema,
    isPublic: isPublicFieldSchema,
    allowedEmails: allowedEmailsFieldSchema,
    passwordProtected: passwordProtectedFieldSchema,
    password: passwordFieldSchema,
    logo: logoFieldSchema,
    accentColor: accentColorFieldSchema,
    backgroundColor: backgroundColorFieldSchema,
  })
  .superRefine((data, ctx) => {
    // Conditional validation: password required when password protection is enabled
    if (data.passwordProtected && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is required when password protection is enabled',
        path: ['password'],
      });
    }

    // Conditional validation: password must be empty when password protection is disabled
    if (!data.passwordProtected && data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be empty when password protection is disabled',
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
 * Edit Link Form Schema
 * Reuses the same schema as create form since they have identical fields
 * This ensures consistency across create and edit operations
 */
export const editLinkFormSchema = createLinkFormSchema;

export type EditLinkFormData = z.infer<typeof editLinkFormSchema>;

/**
 * Link Settings Form Schema
 * Alias for edit form schema - used in settings modal/page
 * All three forms (create, edit, settings) use the same validation
 */
export const linkSettingsFormSchema = createLinkFormSchema;

export type LinkSettingsFormData = z.infer<typeof linkSettingsFormSchema>;
