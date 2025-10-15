// =============================================================================
// LINK ACTION HELPERS
// =============================================================================
// Reusable helper functions for link actions to follow DRY principle
// Includes authentication wrapper, error formatting, and common validation

'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserWorkspace } from '@/lib/database/queries';
import { getLinkById } from '@/lib/database/queries/link.queries';
import {
  logger,
  logAuthFailure,
  logSecurityEvent,
  logSecurityIncident,
} from '@/lib/utils/logger';
import type { Link } from '@/lib/database/schemas';

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Standard response type for all link actions
 * Supports success/failure states with optional data, error messages, and rate limit info
 */
export type LinkActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  blocked?: boolean;
  resetAt?: number;
};

// =============================================================================
// HIGHER-ORDER FUNCTION: AUTH WRAPPER
// =============================================================================

/**
 * Higher-order function that wraps link actions with authentication and error handling
 * Eliminates ~50 lines of boilerplate per action
 *
 * @param actionName - Name of the action for logging purposes
 * @param handler - Async function that receives userId and returns a LinkActionResponse
 * @returns Wrapped action with auth and error handling
 *
 * @example
 * ```typescript
 * export const getUserLinksAction = withLinkAuth(
 *   'getUserLinksAction',
 *   async (userId) => {
 *     const workspace = await getAuthenticatedWorkspace(userId);
 *     const links = await getWorkspaceLinks(workspace.id);
 *     return { success: true, data: links } as const;
 *   }
 * );
 * ```
 */
export function withLinkAuth<TOutput>(
  actionName: string,
  handler: (userId: string) => Promise<LinkActionResponse<TOutput>>
): () => Promise<LinkActionResponse<TOutput>> {
  return async (): Promise<LinkActionResponse<TOutput>> => {
    let userId: string | null = null;

    try {
      // Authenticate user
      const authResult = await auth();
      userId = authResult.userId;

      // Check if user is authenticated
      if (!userId) {
        logAuthFailure(actionName, { reason: 'No userId' });
        return {
          success: false,
          error: 'Unauthorized. Please sign in.',
        } as const;
      }

      // Execute the actual action logic
      return await handler(userId);
    } catch (error) {
      // If error is already a LinkActionResponse (thrown by helper), return it
      if (error && typeof error === 'object' && 'success' in error) {
        return error as LinkActionResponse<TOutput>;
      }

      // Log unexpected errors
      logger.error(`${actionName} failed`, {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return generic error response
      return {
        success: false,
        error: `Failed to execute ${actionName}.`,
      } as const;
    }
  };
}

/**
 * Overload for actions that accept input parameters
 *
 * @param actionName - Name of the action for logging purposes
 * @param handler - Async function that receives userId and input, returns LinkActionResponse
 * @returns Wrapped action with auth and error handling
 *
 * @example
 * ```typescript
 * export const createLinkAction = withLinkAuth(
 *   'createLinkAction',
 *   async (userId, data: CreateLinkInput) => {
 *     // ... implementation
 *     return { success: true, data: link } as const;
 *   }
 * );
 * ```
 */
export function withLinkAuthInput<TInput, TOutput>(
  actionName: string,
  handler: (userId: string, input: TInput) => Promise<LinkActionResponse<TOutput>>
): (input: TInput) => Promise<LinkActionResponse<TOutput>> {
  return async (input: TInput): Promise<LinkActionResponse<TOutput>> => {
    let userId: string | null = null;

    try {
      // Authenticate user
      const authResult = await auth();
      userId = authResult.userId;

      // Check if user is authenticated
      if (!userId) {
        logAuthFailure(actionName, { reason: 'No userId' });
        return {
          success: false,
          error: 'Unauthorized. Please sign in.',
        } as const;
      }

      // Execute the actual action logic
      return await handler(userId, input);
    } catch (error) {
      // If error is already a LinkActionResponse (thrown by helper), return it
      if (error && typeof error === 'object' && 'success' in error) {
        return error as LinkActionResponse<TOutput>;
      }

      // Log unexpected errors
      logger.error(`${actionName} failed`, {
        userId,
        input,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return generic error response
      return {
        success: false,
        error: `Failed to execute ${actionName}.`,
      } as const;
    }
  };
}

// =============================================================================
// ERROR FORMATTING
// =============================================================================

/**
 * Formats an error into a LinkActionResponse
 * Handles different error types (LinkActionResponse, Error, unknown)
 *
 * @param error - The error to format
 * @param fallbackMessage - Default message if error is unknown
 * @returns Formatted LinkActionResponse
 */
export function formatActionError<T>(
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred.'
): LinkActionResponse<T> {
  // If error is already a LinkActionResponse, return it
  if (error && typeof error === 'object' && 'success' in error) {
    return error as LinkActionResponse<T>;
  }

  // If error is an Error object, use its message
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message || fallbackMessage,
    } as const;
  }

  // Unknown error type
  return {
    success: false,
    error: fallbackMessage,
  } as const;
}

// =============================================================================
// WORKSPACE & OWNERSHIP HELPERS
// =============================================================================

/**
 * Helper: Fetch authenticated user's workspace
 * Centralizes workspace fetching logic to follow DRY principle
 *
 * @param userId - Authenticated user ID
 * @returns Workspace object
 * @throws LinkActionResponse if workspace not found
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
 * Helper: Verify link ownership
 * Centralizes ownership verification to follow DRY principle
 *
 * @param linkId - Link ID to verify
 * @param workspaceId - Workspace ID that should own the link
 * @param action - Action name for security logging
 * @returns Link object if authorized
 * @throws LinkActionResponse if link not found or unauthorized
 */
export async function verifyLinkOwnership(
  linkId: string,
  workspaceId: string,
  action: string
): Promise<Link> {
  const link = await getLinkById(linkId);

  if (!link) {
    logSecurityEvent('linkNotFound', { linkId, action });
    throw {
      success: false,
      error: 'Link not found.',
    } as const;
  }

  if (link.workspaceId !== workspaceId) {
    logSecurityIncident('unauthorizedLinkAccess', {
      linkId,
      attemptedWorkspace: workspaceId,
      actualWorkspace: link.workspaceId,
      action,
    });
    throw {
      success: false,
      error: 'You do not have permission to access this link.',
    } as const;
  }

  return link;
}
