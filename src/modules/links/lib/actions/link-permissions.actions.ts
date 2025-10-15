// =============================================================================
// LINK PERMISSION ACTIONS
// =============================================================================
// Email-based permission management for shareable links
// Uses withLinkAuthInput HOF to eliminate boilerplate
// Includes strict rate limiting for security

'use server';

import {
  createPermission,
  getLinkPermissions,
  getPermissionByLinkAndEmail,
  updatePermission,
  deletePermission,
} from '@/lib/database/queries';
import {
  withLinkAuthInput,
  getAuthenticatedWorkspace,
  verifyLinkOwnership,
  type LinkActionResponse,
} from './action-helpers';
import {
  ACTION_NAMES,
  ERROR_MESSAGES,
} from '../validation/constants';
import {
  addPermissionSchema,
  removePermissionSchema,
  updatePermissionSchema,
  validateInput,
  type AddPermissionInput,
  type RemovePermissionInput,
  type UpdatePermissionInput,
} from '../validation/link-schemas';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logger, logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';
import type { Permission } from '@/lib/database/schemas';

// =============================================================================
// PERMISSION ACTIONS
// =============================================================================

/**
 * Add a permission to a link
 * Validates link ownership and prevents duplicate permissions
 * Rate limited: 10 requests per minute (strict for security)
 *
 * @param data - Permission creation data (linkId, email, role)
 * @returns Created permission
 *
 * @example
 * ```typescript
 * const result = await addPermissionAction({
 *   linkId: 'link_123',
 *   email: 'user@example.com',
 *   role: 'editor'
 * });
 * ```
 */
export const addPermissionAction = withLinkAuthInput<AddPermissionInput, Permission>(
  ACTION_NAMES.ADD_PERMISSION,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(addPermissionSchema, input);

    // Rate limiting: 10 requests/minute (strict to prevent abuse)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'add-permission');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Permission add rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: ACTION_NAMES.ADD_PERMISSION,
        limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
        window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
        attempts: RateLimitPresets.PERMISSION_MANAGEMENT.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify link ownership
    await verifyLinkOwnership(
      validated.linkId,
      workspace.id,
      ACTION_NAMES.ADD_PERMISSION
    );

    // Check if permission already exists
    const existingPermission = await getPermissionByLinkAndEmail(
      validated.linkId,
      validated.email
    );

    if (existingPermission) {
      logSecurityEvent('permissionAlreadyExists', {
        userId,
        linkId: validated.linkId,
        email: validated.email,
      });
      throw {
        success: false,
        error: ERROR_MESSAGES.PERMISSION.ALREADY_EXISTS,
      } as const;
    }

    // Create permission
    const permission = await createPermission({
      linkId: validated.linkId,
      email: validated.email,
      role: validated.role,
    });

    logger.info('Permission added successfully', {
      userId,
      linkId: validated.linkId,
      email: validated.email,
      role: validated.role,
      permissionId: permission.id,
    });

    return {
      success: true,
      data: permission,
    } as const;
  }
);

/**
 * Remove a permission from a link
 * Validates link ownership and prevents removing owner permissions
 * Rate limited: 10 requests per minute
 *
 * @param data - Permission removal data (linkId, email)
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await removePermissionAction({
 *   linkId: 'link_123',
 *   email: 'user@example.com'
 * });
 * ```
 */
export const removePermissionAction = withLinkAuthInput<
  RemovePermissionInput,
  void
>(ACTION_NAMES.REMOVE_PERMISSION, async (userId, input) => {
  // Validate input
  const validated = validateInput(removePermissionSchema, input);

  // Rate limiting: 10 requests/minute
  const rateLimitKey = RateLimitKeys.userAction(userId, 'remove-permission');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Permission remove rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: ACTION_NAMES.REMOVE_PERMISSION,
      limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
      window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
      attempts: RateLimitPresets.PERMISSION_MANAGEMENT.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify link ownership
  await verifyLinkOwnership(
    validated.linkId,
    workspace.id,
    ACTION_NAMES.REMOVE_PERMISSION
  );

  // Get permission
  const permission = await getPermissionByLinkAndEmail(
    validated.linkId,
    validated.email
  );

  if (!permission) {
    logSecurityEvent('permissionNotFound', {
      userId,
      linkId: validated.linkId,
      email: validated.email,
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.PERMISSION.NOT_FOUND,
    } as const;
  }

  // Prevent removing owner permissions
  if (permission.role === 'owner') {
    logSecurityEvent('attemptedRemoveOwner', {
      userId,
      linkId: validated.linkId,
      email: validated.email,
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.PERMISSION.CANNOT_REMOVE_OWNER,
    } as const;
  }

  // Delete permission
  await deletePermission(permission.id);

  logger.info('Permission removed successfully', {
    userId,
    linkId: validated.linkId,
    email: validated.email,
    permissionId: permission.id,
  });

  return {
    success: true,
  } as const;
});

/**
 * Update a permission role
 * Validates link ownership and prevents modifying owner permissions
 * Rate limited: 10 requests per minute
 *
 * @param data - Permission update data (linkId, email, role)
 * @returns Updated permission
 *
 * @example
 * ```typescript
 * const result = await updatePermissionAction({
 *   linkId: 'link_123',
 *   email: 'user@example.com',
 *   role: 'viewer'
 * });
 * ```
 */
export const updatePermissionAction = withLinkAuthInput<
  UpdatePermissionInput,
  Permission
>(ACTION_NAMES.UPDATE_PERMISSION, async (userId, input) => {
  // Validate input
  const validated = validateInput(updatePermissionSchema, input);

  // Rate limiting: 10 requests/minute
  const rateLimitKey = RateLimitKeys.userAction(userId, 'update-permission');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Permission update rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: ACTION_NAMES.UPDATE_PERMISSION,
      limit: RateLimitPresets.PERMISSION_MANAGEMENT.limit,
      window: RateLimitPresets.PERMISSION_MANAGEMENT.windowMs,
      attempts: RateLimitPresets.PERMISSION_MANAGEMENT.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify link ownership
  await verifyLinkOwnership(
    validated.linkId,
    workspace.id,
    ACTION_NAMES.UPDATE_PERMISSION
  );

  // Get permission
  const permission = await getPermissionByLinkAndEmail(
    validated.linkId,
    validated.email
  );

  if (!permission) {
    logSecurityEvent('permissionNotFound', {
      userId,
      linkId: validated.linkId,
      email: validated.email,
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.PERMISSION.NOT_FOUND,
    } as const;
  }

  // Prevent modifying owner permissions
  if (permission.role === 'owner') {
    logSecurityEvent('attemptedModifyOwner', {
      userId,
      linkId: validated.linkId,
      email: validated.email,
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.PERMISSION.CANNOT_REMOVE_OWNER,
    } as const;
  }

  // Update permission
  const updatedPermission = await updatePermission(permission.id, validated.role);

  logger.info('Permission updated successfully', {
    userId,
    linkId: validated.linkId,
    email: validated.email,
    oldRole: permission.role,
    newRole: validated.role,
    permissionId: permission.id,
  });

  return {
    success: true,
    data: updatedPermission,
  } as const;
});

/**
 * Get all permissions for a link
 * Validates link ownership before returning permissions
 * Rate limited: 100 requests per minute (read operation)
 *
 * @param data - Object containing linkId
 * @returns Array of permissions for the link
 *
 * @example
 * ```typescript
 * const result = await getLinkPermissionsAction({ linkId: 'link_123' });
 * if (result.success) {
 *   console.log('Permissions:', result.data);
 * }
 * ```
 */
export const getLinkPermissionsAction = withLinkAuthInput<
  { linkId: string },
  Permission[]
>(ACTION_NAMES.GET_LINK_PERMISSIONS, async (userId, input) => {
  // Validate linkId (using simple UUID check)
  if (!input.linkId || !/^[0-9a-f-]{36}$/i.test(input.linkId)) {
    throw {
      success: false,
      error: 'Invalid link ID format.',
    } as const;
  }

  // Rate limiting: 100 requests/minute (read operation, using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'get-permissions');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Get permissions rate limit exceeded', {
      userId,
      linkId: input.linkId,
      action: ACTION_NAMES.GET_LINK_PERMISSIONS,
      limit: RateLimitPresets.GENEROUS.limit,
      window: RateLimitPresets.GENEROUS.windowMs,
      attempts: RateLimitPresets.GENEROUS.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify link ownership
  await verifyLinkOwnership(
    input.linkId,
    workspace.id,
    ACTION_NAMES.GET_LINK_PERMISSIONS
  );

  // Get all permissions for the link
  const permissions = await getLinkPermissions(input.linkId);

  return {
    success: true,
    data: permissions,
  } as const;
});
