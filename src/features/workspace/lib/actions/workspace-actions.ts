'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { workspaceService } from '@/lib/services/workspace';
import type { Workspace, WorkspaceUpdate } from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// WORKSPACE MANAGEMENT ACTIONS
// =============================================================================

/**
 * Get workspace by current user ID
 */
export async function getWorkspaceByUserId(): Promise<ActionResult<Workspace>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const workspace = await workspaceService.getWorkspaceByUserId(userId);

    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    return {
      success: true,
      data: workspace,
    };
  } catch (error) {
    console.error('Failed to fetch workspace:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch workspace',
    };
  }
}

/**
 * Update workspace
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  updates: WorkspaceUpdate
): Promise<ActionResult<Workspace>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify workspace ownership
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace || workspace.id !== workspaceId) {
      return { success: false, error: 'Workspace not found or unauthorized' };
    }

    const result = await workspaceService.updateWorkspace(workspaceId, updates);

    if (result.success) {
      // Revalidate cache for any pages that depend on workspace data
      revalidatePath('/dashboard/workspace');
      revalidatePath('/dashboard');

      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update workspace',
    };
  }
}
