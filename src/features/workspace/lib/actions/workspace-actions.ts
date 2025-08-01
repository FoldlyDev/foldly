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
 * Get workspace by current user ID with automatic creation fallback
 */
export async function getWorkspaceByUserId(): Promise<ActionResult<Workspace>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized workspace fetch attempt');
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    let workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);

    // If workspace doesn't exist, create it (handles race condition during signup)
    if (!workspace) {
      logger.info('Workspace not found, creating for user', { userId: sanitizedUserId });
      
      // Import user workspace service for creation
      const { userWorkspaceService } = await import('@/features/users/services/user-workspace-service');
      
      // Check if user exists first
      const user = await userWorkspaceService.getUserById(sanitizedUserId);
      if (!user) {
        logger.warn('User not found during workspace creation attempt', { userId: sanitizedUserId });
        return createErrorResponse('User not found', ERROR_CODES.NOT_FOUND);
      }
      
      // Create workspace for existing user
      const createResult = await workspaceService.createWorkspace({
        userId: sanitizedUserId,
        name: 'My Workspace',
      });
      
      if (!createResult.success) {
        // Check if workspace was created by another concurrent request
        workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);
        if (!workspace) {
          logger.error('Failed to create workspace', { userId: sanitizedUserId, error: createResult.error });
          return createErrorResponse('Failed to create workspace', ERROR_CODES.INTERNAL_ERROR);
        }
      } else {
        workspace = createResult.data!;
      }
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

/**
 * Check if workspace exists for current user
 */
export async function checkWorkspaceStatusAction(): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized workspace status check attempt');
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    const workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);
    
    logger.debug('Workspace status checked', {
      userId: sanitizedUserId,
      exists: !!workspace
    });

    return createSuccessResponse({ exists: !!workspace });
  } catch (error) {
    logger.error('Failed to check workspace status', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to check workspace status',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

/**
 * Create workspace with backup mechanism (used during setup)
 */
export async function createWorkspaceAction(): Promise<ActionResult<Workspace>> {
  try {
    const { userId, sessionClaims } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized workspace creation attempt');
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // First check if workspace already exists
    let workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);
    if (workspace) {
      logger.info('Workspace already exists', { userId: sanitizedUserId, workspaceId: workspace.id });
      return createSuccessResponse(workspace);
    }

    // Import user workspace service
    const { userWorkspaceService } = await import('@/features/users/services/user-workspace-service');
    
    // Check if user exists in database
    const user = await userWorkspaceService.getUserById(sanitizedUserId);
    
    if (!user) {
      // User doesn't exist yet - webhook hasn't processed
      // Create user and workspace together using session claims
      if (!sessionClaims?.email) {
        logger.warn('User profile incomplete', { userId: sanitizedUserId });
        return createErrorResponse('User profile not complete. Please try again.', ERROR_CODES.BAD_REQUEST);
      }

      const result = await userWorkspaceService.createUserWithWorkspace({
        id: sanitizedUserId,
        email: sessionClaims.email as string,
        username: (sessionClaims.username as string) || sanitizedUserId,
        firstName: (sessionClaims.firstName as string) || null,
        lastName: (sessionClaims.lastName as string) || null,
        avatarUrl: (sessionClaims.imageUrl as string) || null,
      });

      if (!result.success) {
        logger.error('Failed to create user and workspace', { userId: sanitizedUserId, error: result.error });
        return createErrorResponse(result.error || 'Failed to create workspace', ERROR_CODES.INTERNAL_ERROR);
      }

      logger.info('Created user and workspace via backup mechanism', { 
        userId: sanitizedUserId, 
        workspaceId: result.data!.workspace.id 
      });

      return createSuccessResponse(result.data!.workspace);
    }

    // User exists but no workspace - create one
    const createResult = await workspaceService.createWorkspace({
      userId: sanitizedUserId,
      name: 'My Workspace',
    });
    
    if (!createResult.success) {
      // Check if workspace was created by another concurrent request
      workspace = await workspaceService.getWorkspaceByUserId(sanitizedUserId);
      if (workspace) {
        return createSuccessResponse(workspace);
      }
      
      logger.error('Failed to create workspace for existing user', { 
        userId: sanitizedUserId, 
        error: createResult.error 
      });
      return createErrorResponse(createResult.error || 'Failed to create workspace', ERROR_CODES.INTERNAL_ERROR);
    }

    logger.info('Created workspace for existing user', { 
      userId: sanitizedUserId, 
      workspaceId: createResult.data!.id 
    });

    return createSuccessResponse(createResult.data!);
  } catch (error) {
    logger.error('Failed to create workspace', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create workspace',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}
