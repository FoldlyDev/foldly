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
import { withAuth, withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace } from '@/lib/utils/authorization';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logger, logRateLimitViolation } from '@/lib/utils/logger';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load user's workspace)
 * - Links module (associate links with workspace)
 * - Files module (workspace-scoped operations)
 *
 * @returns User's workspace or null if doesn't exist
 */
export async function getUserWorkspaceAction(): Promise<Workspace | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const workspace = await getUserWorkspace(userId);
  return workspace ?? null;
}

/**
 * Create workspace for user during onboarding
 *
 * Used by:
 * - Onboarding flow (create workspace after username selection)
 *
 * @param username - User's chosen username
 * @returns Success status with workspace data or error
 */
export async function createUserWorkspaceAction(username: string) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return {
      success: false as const,
      error: 'Unauthorized - user not authenticated',
    };
  }

  // Check if workspace already exists (prevent duplicates)
  const existingWorkspace = await getUserWorkspace(userId);
  if (existingWorkspace) {
    return {
      success: false as const,
      error: 'Workspace already exists for this user',
    };
  }

  try {
    // Create workspace with user's chosen name
    const workspace = await createWorkspace({
      userId,
      name: `${username}'s Workspace`,
    });

    return {
      success: true as const,
      workspace,
    };
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return {
      success: false as const,
      error: 'Failed to create workspace',
    };
  }
}

/**
 * Update workspace name
 *
 * Used across modules:
 * - Settings module (rename workspace)
 *
 * @param workspaceId - ID of workspace to update
 * @param name - New workspace name
 * @returns Success status with updated workspace or error
 */
export async function updateWorkspaceNameAction(
  workspaceId: string,
  name: string
) {
  const { userId } = await auth();

  if (!userId) {
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

  try {
    const updatedWorkspace = await updateWorkspaceName(workspaceId, name);

    return {
      success: true as const,
      workspace: updatedWorkspace,
    };
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return {
      success: false as const,
      error: 'Failed to update workspace',
    };
  }
}

/**
 * Create the first default link during onboarding
 *
 * Used by:
 * - Onboarding flow (create first link after workspace setup)
 *
 * Creates link + owner permission (email-based access control)
 *
 * @param workspaceId - ID of the workspace
 * @param slug - Unique slug for the link
 * @returns Success status with link data
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
