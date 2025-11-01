// =============================================================================
// PERMISSION ACTIONS - Link Permission Management
// =============================================================================
// Used by: links module, upload module (permission validation)
// Handles email-based access control for shareable links

'use server';

// Import from global utilities
import { withAuthInputAndRateLimit, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyLinkOwnership } from '@/lib/utils/authorization';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  createPermission,
  getLinkPermissions,
  getPermissionByLinkAndEmail,
  updatePermission,
  updatePermissionInvitationTimestamp,
  deletePermission,
} from '@/lib/database/queries';

// Import rate limiting
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Import email actions
import { sendInvitationEmailAction } from './email.actions';

// Import types
import type { Permission } from '@/lib/database/schemas';

// Import global validation schemas
import {
  validateInput,
  addPermissionSchema,
  removePermissionSchema,
  updatePermissionSchema,
  type AddPermissionInput,
  type RemovePermissionInput,
  type UpdatePermissionInput,
} from '@/lib/validation';

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
export const addPermissionAction = withAuthInputAndRateLimit<AddPermissionInput, Permission>(
  'addPermissionAction',
  RateLimitPresets.PERMISSION_MANAGEMENT,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(addPermissionSchema, input);

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

    // Send invitation email if data provided (don't block on failure)
    if (validated.invitationData) {
      // Idempotency check: don't send if invitation was sent recently (within 1 hour)
      const ONE_HOUR_MS = 3600000;
      const now = Date.now();
      const shouldSendEmail =
        !permission.lastInvitationSentAt ||
        (now - new Date(permission.lastInvitationSentAt).getTime()) > ONE_HOUR_MS;

      if (shouldSendEmail) {
        // Fire-and-forget: send email without blocking
        sendInvitationEmailAction({
          recipientEmail: validated.email,
          senderUserId: userId,
          senderName: validated.invitationData.senderName,
          senderEmail: validated.invitationData.senderEmail,
          linkName: validated.invitationData.linkName,
          linkUrl: validated.invitationData.linkUrl,
          customMessage: validated.invitationData.customMessage,
        })
          .then((result) => {
            if (result.success) {
              // Update lastInvitationSentAt timestamp
              updatePermissionInvitationTimestamp(
                permission.id,
                new Date()
              ).catch((err) => {
                logger.warn('Failed to update lastInvitationSentAt', {
                  permissionId: permission.id,
                  error: err,
                });
              });

              logger.info('Invitation email sent successfully', {
                permissionId: permission.id,
                recipientEmail: validated.email,
              });
            } else {
              logger.warn('Failed to send invitation email', {
                permissionId: permission.id,
                recipientEmail: validated.email,
                error: result.error,
              });
            }
          })
          .catch((error) => {
            logger.error('Unexpected error sending invitation email', {
              permissionId: permission.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } else {
        logger.info('Skipped invitation email (sent recently)', {
          permissionId: permission.id,
          lastSentAt: permission.lastInvitationSentAt,
        });
      }
    }

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
export const removePermissionAction = withAuthInputAndRateLimit<
  RemovePermissionInput,
  void
>('removePermissionAction', RateLimitPresets.PERMISSION_MANAGEMENT, async (userId, input) => {
  // Validate input
  const validated = validateInput(removePermissionSchema, input);

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
export const updatePermissionAction = withAuthInputAndRateLimit<
  UpdatePermissionInput,
  Permission
>('updatePermissionAction', RateLimitPresets.PERMISSION_MANAGEMENT, async (userId, input) => {
  // Validate input
  const validated = validateInput(updatePermissionSchema, input);

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
export const getLinkPermissionsAction = withAuthInputAndRateLimit<
  { linkId: string },
  Permission[]
>('getLinkPermissionsAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate linkId (using simple UUID check)
  if (!input.linkId || !/^[0-9a-f-]{36}$/i.test(input.linkId)) {
    throw {
      success: false,
      error: 'Invalid link ID format.',
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
