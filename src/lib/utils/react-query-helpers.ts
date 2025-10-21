// =============================================================================
// REACT QUERY HELPERS - Shared Utilities for React Query Operations
// =============================================================================
// 🎯 Reusable helpers for React Query hooks to reduce code duplication
// Following three-layer architecture: Component → Hook → Action → Query

import type { ActionResponse } from '@/lib/utils/action-helpers';

/**
 * Transform ActionResponse from server actions into React Query mutation result
 *
 * Converts unsuccessful ActionResponse into thrown errors with metadata,
 * allowing React Query to properly handle errors through onError callback.
 *
 * @param result - ActionResponse from server action
 * @param defaultMessage - Default error message if result.error is undefined
 * @returns Unwrapped data from successful response
 * @throws Error with blocked/resetAt metadata if action failed
 *
 * @example
 * ```typescript
 * export function useCreateLink() {
 *   return useMutation({
 *     mutationFn: async (input: CreateLinkInput) => {
 *       const result = await createLinkAction(input);
 *       return transformActionError(result, 'Failed to create link');
 *     },
 *     onSuccess: (data) => {
 *       // data is Link, not ActionResponse<Link>
 *     },
 *     onError: (error: Error & { blocked?: boolean; resetAt?: Date }) => {
 *       // error.blocked and error.resetAt available for rate limit handling
 *     }
 *   });
 * }
 * ```
 */
export function transformActionError<T>(
  result: ActionResponse<T>,
  defaultMessage: string
): T {
  if (!result.success) {
    const error = new Error(result.error || defaultMessage) as Error & {
      blocked?: boolean;
      resetAt?: number;
    };
    error.blocked = result.blocked;
    error.resetAt = result.resetAt;
    throw error;
  }
  return result.data!;
}

/**
 * Transform ActionResponse from server actions into React Query query result
 *
 * Similar to transformActionError but supports fallback values for queries
 * that should return empty arrays/objects instead of throwing on missing data.
 *
 * @param result - ActionResponse from server action
 * @param defaultMessage - Default error message if result.error is undefined
 * @param fallback - Optional fallback value when result.data is undefined (e.g., empty array)
 * @returns Unwrapped data from successful response or fallback
 * @throws Error with blocked/resetAt metadata if action failed
 *
 * @example
 * ```typescript
 * export function useUserLinks() {
 *   return useQuery({
 *     queryFn: async () => {
 *       const result = await getUserLinksAction();
 *       return transformQueryResult(result, 'Failed to fetch links', []);
 *     }
 *   });
 * }
 * ```
 */
export function transformQueryResult<T>(
  result: ActionResponse<T>,
  defaultMessage: string,
  fallback?: T
): T {
  if (!result.success) {
    const error = new Error(result.error || defaultMessage) as Error & {
      blocked?: boolean;
      resetAt?: number;
    };
    error.blocked = result.blocked;
    error.resetAt = result.resetAt;
    throw error;
  }
  return result.data ?? (fallback as T);
}

/**
 * Factory function to create consistent error handlers for mutations
 *
 * Reduces duplication across mutation hooks by creating standardized error handlers
 * that check for rate limiting and log appropriately. When the notification system
 * is implemented, only this function needs updating.
 *
 * @param operationName - Human-readable name of the operation (e.g., "Link creation")
 * @returns Error handler function for useMutation onError callback
 *
 * @example
 * ```typescript
 * export function useCreateLink() {
 *   return useMutation({
 *     mutationFn: async (input) => { ... },
 *     onSuccess: (data) => { ... },
 *     onError: createMutationErrorHandler('Link creation')
 *   });
 * }
 * ```
 */
export function createMutationErrorHandler(operationName: string) {
  return (error: Error & { blocked?: boolean; resetAt?: number }) => {
    // TODO: Add error notification when notification system is implemented
    if (error.blocked) {
      console.error(`${operationName} rate limit exceeded`);
    } else {
      console.error(`${operationName} failed:`, error.message);
    }
  };
}
