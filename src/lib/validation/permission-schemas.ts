// =============================================================================
// PERMISSION VALIDATION SCHEMAS - Cross-Module Permission Management
// =============================================================================
// Used by: links module, uploads module, folders module (permission validation)
// Handles email-based access control for shareable resources

import { z } from 'zod';
import { uuidSchema, emailSchema, permissionRoleSchema } from './base-schemas';

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

/**
 * Schema for invitation data (optional when adding permission)
 * Contains all data needed to send invitation email without additional queries
 */
export const invitationDataSchema = z.object({
  senderName: z.string().min(1, 'Sender name is required'),
  senderEmail: emailSchema,
  linkName: z.string().min(1, 'Link name is required'),
  linkUrl: z.string().url('Invalid link URL'),
  customMessage: z.string().max(500).optional(),
}).optional();

export type InvitationData = z.infer<typeof invitationDataSchema>;

/**
 * Schema for adding a permission to a resource
 * Validates: linkId, email, role
 * Optional: invitationData (to send invitation email atomically)
 */
export const addPermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
  role: permissionRoleSchema,
  invitationData: invitationDataSchema,
});

export type AddPermissionInput = z.infer<typeof addPermissionSchema>;

/**
 * Schema for removing a permission from a resource
 * Validates: linkId, email
 */
export const removePermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
});

export type RemovePermissionInput = z.infer<typeof removePermissionSchema>;

/**
 * Schema for updating a permission role
 * Validates: linkId, email, role
 */
export const updatePermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
  role: permissionRoleSchema,
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

/**
 * Schema for verifying resource access
 * Validates: linkId, email
 */
export const verifyLinkAccessSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
});

export type VerifyLinkAccessInput = z.infer<typeof verifyLinkAccessSchema>;
