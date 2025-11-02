// =============================================================================
// WORKSPACE SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 Core workspace operations used across multiple modules

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import {
  getUserWorkspace,
  getWorkspaceById,
  createWorkspace,
  updateWorkspaceName,
  createLink,
  createPermission,
  getWorkspaceStats,
  getRecentActivity,
} from '@/lib/database/queries';
import type { Workspace, File } from '@/lib/database/schemas';

// Import utilities for new actions
import { withAuth, withAuthInput, validateInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace } from '@/lib/utils/authorization';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logger, logRateLimitViolation } from '@/lib/utils/logger';
import { ERROR_MESSAGES } from '@/lib/constants';
import {
  createWorkspaceInputSchema,
  updateWorkspaceNameInputSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceNameInput,
} from '@/lib/validation/workspace-schemas';

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load user's workspace)
 * - Links module (associate links with workspace)
 * - Files module (workspace-scoped operations)
 *
 * @returns Action response with user's workspace or null if doesn't exist
 *
 * @example
 * ```typescript
 * const result = await getUserWorkspaceAction();
 * if (result.success) {
 *   console.log(result.data); // Workspace | null
 * }
 * ```
 */
export const getUserWorkspaceAction = withAuth<Workspace | null>(
  'getUserWorkspaceAction',
  async (userId) => {
    const workspace = await getUserWorkspace(userId);

    return {
      success: true,
      data: workspace ?? null,
    } as const;
  }
);

/**
 * Create workspace for user during onboarding
 *
 * Used by:
 * - Onboarding flow (create workspace after username selection)
 *
 * @param input - Workspace creation input containing username
 * @param input.username - User's chosen username (used to generate workspace name: "{username}'s Workspace")
 * @returns Action response with created workspace data
 * @throws Error if workspace already exists for user
 *
 * @example
 * ```typescript
 * const result = await createUserWorkspaceAction({ username: 'john' });
 * if (result.success) {
 *   console.log(result.data.name); // "john's Workspace"
 * }
 * ```
 */
export const createUserWorkspaceAction = withAuthInput<CreateWorkspaceInput, Workspace>(
  'createUserWorkspaceAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createWorkspaceInputSchema, input);

    // Check if workspace already exists (prevent duplicates)
    const existingWorkspace = await getUserWorkspace(userId);
    if (existingWorkspace) {
      throw {
        success: false,
        error: ERROR_MESSAGES.WORKSPACE.ALREADY_EXISTS,
      } as const;
    }

    // Create workspace with user's chosen name
    const workspace = await createWorkspace({
      userId,
      name: `${validated.username}'s Workspace`,
    });

    logger.info('Workspace created successfully', {
      userId,
      workspaceId: workspace.id,
      username: validated.username,
    });

    return {
      success: true,
      data: workspace,
    } as const;
  }
);

/**
 * Update workspace name
 *
 * Used across modules:
 * - Settings module (rename workspace)
 *
 * @param input - Workspace update input
 * @param input.workspaceId - ID of the workspace to update
 * @param input.name - New workspace name (2-50 characters)
 * @returns Action response with updated workspace data
 * @throws Error if workspace not found or user is not the owner
 *
 * @example
 * ```typescript
 * const result = await updateWorkspaceNameAction({
 *   workspaceId: 'ws_abc123',
 *   name: 'My Updated Workspace'
 * });
 * if (result.success) {
 *   console.log(result.data.name); // "My Updated Workspace"
 * }
 * ```
 */
export const updateWorkspaceNameAction = withAuthInput<UpdateWorkspaceNameInput, Workspace>(
  'updateWorkspaceNameAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateWorkspaceNameInputSchema, input);

    // Verify user owns this workspace
    const workspace = await getWorkspaceById(validated.workspaceId);
    if (!workspace || workspace.userId !== userId) {
      throw {
        success: false,
        error: ERROR_MESSAGES.WORKSPACE.NOT_FOUND,
      } as const;
    }

    // Update workspace name
    const updatedWorkspace = await updateWorkspaceName(
      validated.workspaceId,
      validated.name
    );

    logger.info('Workspace name updated successfully', {
      userId,
      workspaceId: validated.workspaceId,
      newName: validated.name,
    });

    return {
      success: true,
      data: updatedWorkspace,
    } as const;
  }
);

/**
 * Create the first default link during onboarding
 *
 * Used by:
 * - Onboarding flow (create first link after workspace setup)
 *
 * Creates link + owner permission (email-based access control)
 *
 * @param workspaceId - ID of the workspace
 * @param slug - Unique slug for the link (e.g., "my-first-link")
 * @returns Action response with created link data or error
 * @throws Error if user is not authenticated
 * @throws Error if user doesn't own the workspace
 * @throws Error if user has no valid email address
 *
 * @example
 * ```typescript
 * const result = await createDefaultLinkAction('ws_abc123', 'my-first-link');
 * if (result.success) {
 *   console.log(result.link.name); // "My First Link"
 * }
 * ```
 */
export async function createDefaultLinkAction(workspaceId: string, slug: string) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return {
      success: false as const,
      error: 'Unauthorized',
    };
  }

  // Verify user owns this workspace
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace || workspace.userId !== userId) {
    return {
      success: false as const,
      error: 'Workspace not found or unauthorized',
    };
  }

  // Get owner email with defensive fallback handling
  const ownerEmail =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses[0]?.emailAddress;

  if (!ownerEmail) {
    return {
      success: false as const,
      error: 'User account must have a valid email address to create workspace',
    };
  }

  try {
    // Step 1: Create the link (using reusable query function)
    const link = await createLink({
      workspaceId,
      slug,
      name: 'My First Link',
      isPublic: true,
    });

    // Step 2: Create owner permission (auto-created per schema comment)
    // Owner uses their primary email from Clerk
    await createPermission({
      linkId: link.id,
      email: ownerEmail,
      role: 'owner',
    });

    return {
      success: true as const,
      link,
    };
  } catch (error) {
    console.error('Failed to create default link:', error);
    return {
      success: false as const,
      error: 'Failed to create link',
    };
  }
}

// =============================================================================
// WORKSPACE STATISTICS & ACTIVITY ACTIONS (MODERN PATTERN)
// =============================================================================

/**
 * Get workspace statistics
 * Returns aggregate stats: total files, storage used, active links
 * Rate limited: 100 requests per minute
 *
 * @returns Workspace statistics
 *
 * @example
 * ```typescript
 * const result = await getWorkspaceStatsAction();
 * if (result.success) {
 *   console.log('Stats:', result.data);
 *   // { totalFiles: 42, storageUsed: 10485760, activeLinks: 5 }
 * }
 * ```
 */
export const getWorkspaceStatsAction = withAuth<{
  totalFiles: number;
  storageUsed: number;
  activeLinks: number;
}>('getWorkspaceStatsAction', async (userId) => {
  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'workspace-stats');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Workspace stats rate limit exceeded', {
      userId,
      action: 'getWorkspaceStatsAction',
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

  // Get workspace statistics
  const stats = await getWorkspaceStats(workspace.id);

  return {
    success: true,
    data: stats,
  } as const;
});

/**
 * Get recent file activity for workspace
 * Returns most recently uploaded files with uploader info
 * Rate limited: 100 requests per minute
 *
 * @param input - Optional limit parameter (defaults to 10)
 * @returns Array of recent files
 *
 * @example
 * ```typescript
 * const result = await getRecentActivityAction({ limit: 20 });
 * if (result.success) {
 *   console.log('Recent files:', result.data);
 * }
 * ```
 */
export const getRecentActivityAction = withAuthInput<
  { limit?: number },
  File[]
>('getRecentActivityAction', async (userId, input) => {
  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'recent-activity');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Recent activity rate limit exceeded', {
      userId,
      action: 'getRecentActivityAction',
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

  // Get recent activity (default limit: 10)
  const limit = input?.limit ?? 10;
  const recentFiles = await getRecentActivity(workspace.id, limit);

  logger.info('Recent activity fetched', {
    userId,
    workspaceId: workspace.id,
    fileCount: recentFiles.length,
    limit,
  });

  return {
    success: true,
    data: recentFiles,
  } as const;
});
