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
 * Schema for adding a permission to a resource
 * Validates: linkId, email, role
 */
export const addPermissionSchema = z.object({
  linkId: uuidSchema,
  email: emailSchema,
  role: permissionRoleSchema,
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
