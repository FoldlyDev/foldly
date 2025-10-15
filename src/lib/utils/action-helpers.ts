// =============================================================================
// ACTION HELPERS - Generic Higher-Order Functions
// =============================================================================
// Reusable HOFs for wrapping server actions with auth, error handling, and logging
// Used by all global actions (link, permission, folder, file, etc.)

'use server';

import { auth } from '@clerk/nextjs/server';
import { logger, logAuthFailure } from '@/lib/utils/logger';

/**
 * Standard response type for all server actions
 * Supports success/failure states with optional data, error messages, and rate limit info
 */
export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  blocked?: boolean; // Rate limit blocked
  resetAt?: number;  // Timestamp when rate limit resets
};

/**
 * Higher-order function that wraps actions with authentication and error handling
 * Eliminates ~50 lines of boilerplate per action
 *
 * @param actionName - Name of the action for logging purposes
 * @param handler - Async function that receives userId and returns an ActionResponse
 * @returns Wrapped action with auth and error handling
 *
 * @example
 * ```typescript
 * export const getUserLinksAction = withAuth(
 *   'getUserLinksAction',
 *   async (userId) => {
 *     const workspace = await getUserWorkspace(userId);
 *     const links = await getWorkspaceLinks(workspace.id);
 *     return { success: true, data: links };
 *   }
 * );
 * ```
 */
export function withAuth<TOutput>(
  actionName: string,
  handler: (userId: string) => Promise<ActionResponse<TOutput>>
): () => Promise<ActionResponse<TOutput>> {
  return async (): Promise<ActionResponse<TOutput>> => {
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
      // If error is already an ActionResponse (thrown by helper), return it
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ActionResponse<TOutput>;
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
 * @param handler - Async function that receives userId and input, returns ActionResponse
 * @returns Wrapped action with auth and error handling
 *
 * @example
 * ```typescript
 * export const createLinkAction = withAuthInput(
 *   'createLinkAction',
 *   async (userId, data: CreateLinkInput) => {
 *     // ... implementation
 *     return { success: true, data: link };
 *   }
 * );
 * ```
 */
export function withAuthInput<TInput, TOutput>(
  actionName: string,
  handler: (userId: string, input: TInput) => Promise<ActionResponse<TOutput>>
): (input: TInput) => Promise<ActionResponse<TOutput>> {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
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
      // If error is already an ActionResponse (thrown by helper), return it
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ActionResponse<TOutput>;
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

/**
 * Formats an error into an ActionResponse
 * Handles different error types (ActionResponse, Error, unknown)
 *
 * @param error - The error to format
 * @param fallbackMessage - Default message if error is unknown
 * @returns Formatted ActionResponse
 */
export function formatActionError<T>(
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred.'
): ActionResponse<T> {
  // If error is already an ActionResponse, return it
  if (error && typeof error === 'object' && 'success' in error) {
    return error as ActionResponse<T>;
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
