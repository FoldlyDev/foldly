// =============================================================================
// REACT QUERY HELPERS - Shared Utilities for React Query Operations
// =============================================================================
// 🎯 Reusable helpers for React Query hooks to reduce code duplication
// Following three-layer architecture: Component → Hook → Action → Query

import type { ActionResponse } from '@/lib/utils/action-helpers';
import type { QueryClient } from '@tanstack/react-query';
import { linkKeys, folderKeys, fileKeys, permissionKeys, workspaceKeys } from '@/lib/config/query-keys';

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

// =============================================================================
// CACHE INVALIDATION HELPERS
// =============================================================================
// 🎯 Centralized cache invalidation to reduce duplication in mutation hooks
// Each helper invalidates the appropriate queries for a specific entity

/**
 * Invalidate link-related queries (atomic operation)
 *
 * Uses Promise.all to ensure all invalidations succeed or fail together,
 * preventing inconsistent cache states. If any invalidation fails, all
 * invalidations are rolled back by React Query.
 *
 * @param queryClient - React Query client instance
 * @param linkId - Optional specific link ID to invalidate detail query
 * @returns Promise that resolves when all invalidations complete
 *
 * @example
 * ```typescript
 * export function useCreateLink() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (input) => { ... },
 *     onSuccess: async (link) => {
 *       await invalidateLinks(queryClient, link.id);
 *     }
 *   });
 * }
 * ```
 */
export async function invalidateLinks(
  queryClient: QueryClient,
  linkId?: string
): Promise<void> {
  const invalidations = [
    // Invalidate all link lists
    queryClient.invalidateQueries({ queryKey: linkKeys.lists() }),
  ];

  // Invalidate specific link detail if provided
  if (linkId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(linkId) })
    );
  }

  // Execute all invalidations atomically
  await Promise.all(invalidations);
}

/**
 * Invalidate folder-related queries (atomic operation)
 *
 * Uses Promise.all to ensure all invalidations succeed or fail together,
 * preventing inconsistent cache states. If any invalidation fails, all
 * invalidations are rolled back by React Query.
 *
 * @param queryClient - React Query client instance
 * @param folderId - Optional specific folder ID to invalidate detail/hierarchy queries
 * @param options - Optional configuration
 * @param options.invalidateFiles - Whether to also invalidate file queries (default: false)
 * @returns Promise that resolves when all invalidations complete
 *
 * @example
 * ```typescript
 * export function useDeleteFolder() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (folderId) => { ... },
 *     onSuccess: async () => {
 *       // Folder deletion affects files, so invalidate both
 *       await invalidateFolders(queryClient, undefined, { invalidateFiles: true });
 *     }
 *   });
 * }
 * ```
 */
export async function invalidateFolders(
  queryClient: QueryClient,
  folderId?: string,
  options?: { invalidateFiles?: boolean }
): Promise<void> {
  const invalidations = [
    // Invalidate all folder queries (lists, roots, subfolders)
    queryClient.invalidateQueries({ queryKey: folderKeys.all }),
  ];

  // Invalidate specific folder detail and hierarchy if provided
  if (folderId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(folderId) }),
      queryClient.invalidateQueries({ queryKey: folderKeys.hierarchy(folderId) })
    );
  }

  // Optionally invalidate files (e.g., when folder deletion affects file structure)
  if (options?.invalidateFiles) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
    );
  }

  // Execute all invalidations atomically
  await Promise.all(invalidations);
}

/**
 * Invalidate file-related queries (atomic operation)
 *
 * Uses Promise.all to ensure all invalidations succeed or fail together,
 * preventing inconsistent cache states. If any invalidation fails, all
 * invalidations are rolled back by React Query.
 *
 * @param queryClient - React Query client instance
 * @param fileId - Optional specific file ID to invalidate detail query
 * @param folderId - Optional folder ID to invalidate folder file lists
 * @returns Promise that resolves when all invalidations complete
 *
 * @example
 * ```typescript
 * export function useDeleteFile() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (file) => { ... },
 *     onSuccess: async (file) => {
 *       // Invalidate file queries for the file and its folder
 *       await invalidateFiles(queryClient, file.id, file.folderId);
 *     }
 *   });
 * }
 * ```
 */
export async function invalidateFiles(
  queryClient: QueryClient,
  fileId?: string,
  folderId?: string
): Promise<void> {
  const invalidations = [
    // Invalidate all file queries (workspace, byEmail, search, etc.)
    queryClient.invalidateQueries({ queryKey: fileKeys.all }),
  ];

  // Invalidate specific file detail if provided
  if (fileId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: fileKeys.detail(fileId) })
    );
  }

  // Invalidate folder file list if folder ID provided
  if (folderId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: fileKeys.folder(folderId) })
    );
  }

  // Execute all invalidations atomically
  await Promise.all(invalidations);
}

/**
 * Invalidate permission-related queries (atomic operation)
 *
 * Uses Promise.all to ensure all invalidations succeed or fail together,
 * preventing inconsistent cache states. If any invalidation fails, all
 * invalidations are rolled back by React Query.
 *
 * @param queryClient - React Query client instance
 * @param linkId - The link ID whose permissions changed
 * @param options - Optional configuration
 * @param options.invalidateLink - Whether to also invalidate the link query (default: true)
 * @returns Promise that resolves when all invalidations complete
 *
 * @example
 * ```typescript
 * export function useAddPermission() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (input) => { ... },
 *     onSuccess: async (_, variables) => {
 *       // Permissions changed for this link
 *       await invalidatePermissions(queryClient, variables.linkId);
 *     }
 *   });
 * }
 * ```
 */
export async function invalidatePermissions(
  queryClient: QueryClient,
  linkId: string,
  options?: { invalidateLink?: boolean }
): Promise<void> {
  const invalidations = [
    // Invalidate permissions for this link
    queryClient.invalidateQueries({ queryKey: permissionKeys.byLink(linkId) }),
  ];

  // By default, also invalidate the link itself (permissions are part of link data)
  if (options?.invalidateLink !== false) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(linkId) })
    );
  }

  // Execute all invalidations atomically
  await Promise.all(invalidations);
}

/**
 * Invalidate workspace-related queries (atomic operation)
 *
 * Uses Promise.all to ensure all invalidations succeed or fail together,
 * preventing inconsistent cache states. If any invalidation fails, all
 * invalidations are rolled back by React Query.
 *
 * @param queryClient - React Query client instance
 * @param options - Optional configuration
 * @param options.includeStats - Whether to invalidate stats query (default: true)
 * @param options.includeActivity - Whether to invalidate recent activity query (default: true)
 * @returns Promise that resolves when all invalidations complete
 *
 * @example
 * ```typescript
 * export function useUpdateWorkspaceName() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (name) => { ... },
 *     onSuccess: async () => {
 *       // Workspace name changed, but stats/activity unchanged
 *       await invalidateWorkspace(queryClient, { includeStats: false, includeActivity: false });
 *     }
 *   });
 * }
 * ```
 */
export async function invalidateWorkspace(
  queryClient: QueryClient,
  options?: { includeStats?: boolean; includeActivity?: boolean }
): Promise<void> {
  const invalidations = [
    // Always invalidate main workspace detail
    queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() }),
  ];

  // Optionally invalidate stats (default: true)
  if (options?.includeStats !== false) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: workspaceKeys.stats() })
    );
  }

  // Optionally invalidate recent activity (default: true)
  if (options?.includeActivity !== false) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
    );
  }

  // Execute all invalidations atomically
  await Promise.all(invalidations);
}
