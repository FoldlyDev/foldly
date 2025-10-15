// =============================================================================
// PERMISSION ACTIONS - Link Permission Management
// =============================================================================
// Used by: links module, upload module (permission validation)
// Handles email-based access control for shareable links

'use server';

// Import from global utilities
import { withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyLinkOwnership } from '@/lib/utils/authorization';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  createPermission,
  getLinkPermissions,
  getPermissionByLinkAndEmail,
  updatePermission,
  deletePermission,
} from '@/lib/database/queries';

// Import rate limiting
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Permission } from '@/lib/database/schemas';

// Import module-specific validation schemas (Phase 3 will refactor these)
import {
  validateInput,
  type AddPermissionInput,
  type RemovePermissionInput,
  type UpdatePermissionInput,
} from '@/modules/links/lib/validation/link-schemas';

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
export const addPermissionAction = withAuthInput<AddPermissionInput, Permission>(
  'addPermissionAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(
      await import('@/modules/links/lib/validation/link-schemas').then(m => m.addPermissionSchema),
      input
    );

    // Rate limiting: 10 requests/minute (strict to prevent abuse)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'add-permission');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Permission add rate limit exceeded', {
        userId,
        linkId: validated.linkId,
        action: 'addPermissionAction',
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
      'addPermissionAction'
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
export const removePermissionAction = withAuthInput<
  RemovePermissionInput,
  void
>('removePermissionAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(
    await import('@/modules/links/lib/validation/link-schemas').then(m => m.removePermissionSchema),
    input
  );

  // Rate limiting: 10 requests/minute
  const rateLimitKey = RateLimitKeys.userAction(userId, 'remove-permission');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Permission remove rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: 'removePermissionAction',
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
    'removePermissionAction'
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
export const updatePermissionAction = withAuthInput<
  UpdatePermissionInput,
  Permission
>('updatePermissionAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(
    await import('@/modules/links/lib/validation/link-schemas').then(m => m.updatePermissionSchema),
    input
  );

  // Rate limiting: 10 requests/minute
  const rateLimitKey = RateLimitKeys.userAction(userId, 'update-permission');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.PERMISSION_MANAGEMENT);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Permission update rate limit exceeded', {
      userId,
      linkId: validated.linkId,
      action: 'updatePermissionAction',
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
    'updatePermissionAction'
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
export const getLinkPermissionsAction = withAuthInput<
  { linkId: string },
  Permission[]
>('getLinkPermissionsAction', async (userId, input) => {
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
      action: 'getLinkPermissionsAction',
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
    'getLinkPermissionsAction'
  );

  // Get all permissions for the link
  const permissions = await getLinkPermissions(input.linkId);

  return {
    success: true,
    data: permissions,
  } as const;
});
