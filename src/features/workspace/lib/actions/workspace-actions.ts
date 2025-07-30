'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { workspaceService } from '@/lib/services/workspace';
import type { Workspace, WorkspaceUpdate } from '@/lib/database/types';
import { logger } from '@/lib/services/logging/logger';
import { sanitizeUserId } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
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
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized workspace fetch attempt');
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    const workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);

    if (!workspace) {
      logger.info('Workspace not found for user', { userId: sanitizedUserId });
      return createErrorResponse('Workspace not found', ERROR_CODES.NOT_FOUND);
    }

    logger.debug('Workspace fetched successfully', {
      userId: sanitizedUserId,
      workspaceId: workspace.id
    });

    return createSuccessResponse(workspace);
  } catch (error) {
    logger.error('Failed to fetch workspace', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch workspace',
      ERROR_CODES.INTERNAL_ERROR
    );
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
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized workspace update attempt', { workspaceId });
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // Verify workspace ownership
    const workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);
    if (!workspace || workspace.id !== workspaceId) {
      logger.logSecurityEvent(
        'Workspace update attempt with invalid ownership',
        'medium',
        { workspaceId, userId: sanitizedUserId, foundWorkspaceId: workspace?.id }
      );
      return createErrorResponse('Workspace not found or unauthorized', ERROR_CODES.FORBIDDEN);
    }

    const result = await workspaceService.updateWorkspace(workspaceId, updates, sanitizedUserId);

    if (result.success) {
      // Revalidate cache for any pages that depend on workspace data
      revalidatePath('/dashboard/workspace');

      logger.info('Workspace updated successfully', {
        userId: sanitizedUserId,
        workspaceId,
        updates: Object.keys(updates)
      });

      return createSuccessResponse(result.data!);
    } else {
      logger.error('Workspace update failed', undefined, {
        userId: sanitizedUserId,
        workspaceId,
        error: result.error
      });
      return createErrorResponse(result.error || 'Update failed', result.code);
    }
  } catch (error) {
    logger.error('Failed to update workspace', error, { workspaceId });
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update workspace',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}
