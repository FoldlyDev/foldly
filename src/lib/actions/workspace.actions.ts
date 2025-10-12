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
} from '@/lib/database/queries';
import type { Workspace } from '@/lib/database/schemas';

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
