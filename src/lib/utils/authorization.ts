// =============================================================================
// AUTHORIZATION UTILITIES - Resource Ownership Verification
// =============================================================================
// Generic patterns for verifying user ownership/access to resources
// Used by actions to enforce authorization before operations

'use server';

import { getUserWorkspace } from '@/lib/database/queries';
import { getLinkById } from '@/lib/database/queries/link.queries';
import { logSecurityEvent, logSecurityIncident } from '@/lib/utils/logger';
import type { Link } from '@/lib/database/schemas';
import type { ActionResponse } from '@/lib/utils/action-helpers';

/**
 * Helper: Fetch authenticated user's workspace
 * Centralizes workspace fetching logic to follow DRY principle
 *
 * @param userId - Authenticated user ID
 * @returns Workspace object
 * @throws ActionResponse if workspace not found
 *
 * @example
 * ```typescript
 * const workspace = await getAuthenticatedWorkspace(userId);
 * // Use workspace.id for ownership checks
 * ```
 */
export async function getAuthenticatedWorkspace(
  userId: string
): Promise<NonNullable<Awaited<ReturnType<typeof getUserWorkspace>>>> {
  const workspace = await getUserWorkspace(userId);

  if (!workspace) {
    logSecurityEvent('workspaceNotFound', { userId });
    throw {
      success: false,
      error: 'Workspace not found. Please complete onboarding.',
    } as const;
  }

  return workspace;
}

/**
 * Generic resource ownership verification parameters
 */
export interface VerifyResourceOwnershipParams<T> {
  resourceId: string;
  resourceType: string; // 'link', 'folder', 'file', 'workspace'
  expectedOwnerId: string; // The ID that should own this resource
  ownerField: keyof T; // Field name containing owner ID (e.g., 'workspaceId', 'userId')
  action: string; // Action name for security logging
  fetchResource: (id: string) => Promise<T | null | undefined>; // Function to fetch the resource
  notFoundError?: string; // Custom error message if not found
  unauthorizedError?: string; // Custom error message if unauthorized
}

/**
 * Verifies resource ownership with security logging
 * Generic function that works for any resource type (link, folder, file, etc.)
 *
 * @param params - Ownership verification parameters
 * @returns Resource object if authorized
 * @throws ActionResponse if resource not found or unauthorized
 *
 * @example
 * ```typescript
 * const link = await verifyResourceOwnership({
 *   resourceId: 'link_123',
 *   resourceType: 'link',
 *   expectedOwnerId: workspace.id,
 *   ownerField: 'workspaceId',
 *   action: 'updateLinkAction',
 *   fetchResource: getLinkById,
 * });
 * ```
 */
export async function verifyResourceOwnership<T extends Record<string, any>>(
  params: VerifyResourceOwnershipParams<T>
): Promise<T> {
  const {
    resourceId,
    resourceType,
    expectedOwnerId,
    ownerField,
    action,
    fetchResource,
    notFoundError = `${resourceType} not found.`,
    unauthorizedError = `You do not have permission to access this ${resourceType}.`,
  } = params;

  // Fetch resource
  const resource = await fetchResource(resourceId);

  if (!resource) {
    logSecurityEvent(`${resourceType}NotFound`, { resourceId, action });
    throw {
      success: false,
      error: notFoundError,
    } as const;
  }

  // Verify ownership
  const actualOwnerId = resource[ownerField];
  if (actualOwnerId !== expectedOwnerId) {
    logSecurityIncident(`unauthorized${resourceType}Access`, {
      resourceId,
      attemptedOwner: expectedOwnerId,
      actualOwner: actualOwnerId,
      action,
    });
    throw {
      success: false,
      error: unauthorizedError,
    } as const;
  }

  return resource;
}

/**
 * Convenience wrapper: Verify link ownership
 *
 * @param linkId - Link ID to verify
 * @param workspaceId - Workspace ID that should own the link
 * @param action - Action name for security logging
 * @returns Link object if authorized
 * @throws ActionResponse if link not found or unauthorized
 *
 * @example
 * ```typescript
 * const link = await verifyLinkOwnership(linkId, workspace.id, 'updateLinkAction');
 * // link.workspaceId === workspace.id is guaranteed
 * ```
 */
export async function verifyLinkOwnership(
  linkId: string,
  workspaceId: string,
  action: string
): Promise<Link> {
  return verifyResourceOwnership({
    resourceId: linkId,
    resourceType: 'link',
    expectedOwnerId: workspaceId,
    ownerField: 'workspaceId',
    action,
    fetchResource: getLinkById,
    notFoundError: 'Link not found.',
    unauthorizedError: 'You do not have permission to access this link.',
  });
}

/**
 * Convenience wrapper: Verify folder ownership
 * TODO: Implement when folder queries are created
 */
export async function verifyFolderOwnership(
  folderId: string,
  workspaceId: string,
  action: string
): Promise<never> {
  throw new Error('Folder ownership verification not implemented yet');
}

/**
 * Convenience wrapper: Verify file ownership
 * TODO: Implement when file queries are created
 */
export async function verifyFileOwnership(
  fileId: string,
  workspaceId: string,
  action: string
): Promise<never> {
  throw new Error('File ownership verification not implemented yet');
}
