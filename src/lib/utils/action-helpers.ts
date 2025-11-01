// =============================================================================
// ACTION HELPERS - Generic Higher-Order Functions
// =============================================================================
// Reusable HOFs for wrapping server actions with auth, error handling, and logging
// Used by all global actions (link, permission, folder, file, etc.)
// Note: This file does NOT have 'use server' because it exports utility functions.
// The actual server actions that use these helpers have their own 'use server' directives.

import { auth } from '@clerk/nextjs/server';
import { logger, logAuthFailure } from '@/lib/utils/logger';
import { checkRateLimit, RateLimitKeys, type RateLimitConfig } from '@/lib/middleware/rate-limit';
import { ERROR_MESSAGES } from '@/lib/constants';
import { z } from 'zod';

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

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates data against a Zod schema and returns typed result
 * Throws ActionResponse if validation fails (to be caught by HOF)
 *
 * Centralizes validation error handling for all server actions.
 * Extracts the first validation error and formats it as an ActionResponse.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ActionResponse if validation fails
 *
 * @example
 * ```typescript
 * const validated = validateInput(createLinkSchema, input);
 * // validated has inferred type from schema
 * // If validation fails, throws ActionResponse with first error message
 * ```
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    const errorMessage = firstError?.message || 'Validation failed';

    throw {
      success: false,
      error: errorMessage,
    } as const;
  }

  return result.data;
}

// =============================================================================
// AUTHENTICATION HOFs
// =============================================================================

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

/**
 * Higher-order function that wraps actions with authentication and rate limiting
 * Combines auth + rate limit checking in a single composable HOF
 * Eliminates ~70 lines of boilerplate per action (auth + rate limiting)
 *
 * @param actionName - Name of the action for logging and rate limit key
 * @param rateLimitConfig - Rate limit configuration (use RateLimitPresets for common cases)
 * @param handler - Async function that receives userId and returns an ActionResponse
 * @returns Wrapped action with auth and rate limiting
 *
 * @example
 * ```typescript
 * export const createLinkAction = withAuthAndRateLimit(
 *   'createLinkAction',
 *   RateLimitPresets.MODERATE,
 *   async (userId) => {
 *     const workspace = await getUserWorkspace(userId);
 *     const link = await createLink({ workspaceId: workspace.id });
 *     return { success: true, data: link };
 *   }
 * );
 * ```
 */
export function withAuthAndRateLimit<TOutput>(
  actionName: string,
  rateLimitConfig: RateLimitConfig,
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

      // Check rate limit (Redis already logs violations internally)
      const rateLimitKey = RateLimitKeys.userAction(userId, actionName);
      const rateLimitResult = await checkRateLimit(rateLimitKey, rateLimitConfig);

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded - throw with metadata
        throw {
          success: false,
          error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
          blocked: true,
          resetAt: rateLimitResult.resetAt,
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
 * Higher-order function that wraps actions with authentication, rate limiting, and input handling
 * Combines auth + rate limit checking for actions that accept input parameters
 * Eliminates ~70 lines of boilerplate per action
 *
 * @param actionName - Name of the action for logging and rate limit key
 * @param rateLimitConfig - Rate limit configuration (use RateLimitPresets for common cases)
 * @param handler - Async function that receives userId and input, returns ActionResponse
 * @returns Wrapped action with auth, rate limiting, and input handling
 *
 * @example
 * ```typescript
 * export const updateLinkAction = withAuthInputAndRateLimit(
 *   'updateLinkAction',
 *   RateLimitPresets.MODERATE,
 *   async (userId, input: UpdateLinkInput) => {
 *     const validated = validateInput(updateLinkSchema, input);
 *     await verifyLinkOwnership(userId, validated.linkId);
 *     const link = await updateLink(validated.linkId, validated);
 *     return { success: true, data: link };
 *   }
 * );
 * ```
 */
export function withAuthInputAndRateLimit<TInput, TOutput>(
  actionName: string,
  rateLimitConfig: RateLimitConfig,
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

      // Check rate limit (Redis already logs violations internally)
      const rateLimitKey = RateLimitKeys.userAction(userId, actionName);
      const rateLimitResult = await checkRateLimit(rateLimitKey, rateLimitConfig);

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded - throw with metadata
        throw {
          success: false,
          error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
          blocked: true,
          resetAt: rateLimitResult.resetAt,
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
