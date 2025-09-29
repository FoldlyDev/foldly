/**
 * Query Invalidation Service
 * Centralized service for managing cross-feature query invalidations
 * Prevents tight coupling between features while ensuring data consistency
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidation patterns for workspace-related data
 * These patterns match query keys that should be invalidated together
 */
const WORKSPACE_DATA_PATTERNS = [
  ['workspace', 'data'],           // Main workspace feature
  ['files', 'workspace'],           // Files feature workspace view
  ['workspace'],                    // Any workspace-related queries
] as const;

/**
 * Invalidation patterns for link-related data
 */
const LINK_DATA_PATTERNS = [
  ['files', 'links'],               // All links
  ['files', 'linkContent'],         // Link content with files/folders
  ['files', 'filesByLink'],         // Files by link
] as const;

/**
 * Service for managing query invalidations across features
 */
export class QueryInvalidationService {
  /**
   * Invalidate all workspace-related queries across features
   * Use this when workspace data changes (create, update, delete operations)
   */
  static async invalidateWorkspaceData(queryClient: QueryClient): Promise<void> {
    console.log('[QueryInvalidation] Invalidating workspace data with patterns:', WORKSPACE_DATA_PATTERNS);
    const promises = WORKSPACE_DATA_PATTERNS.map(pattern =>
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Check if query key starts with the pattern
          const matches = pattern.every((part, index) => queryKey[index] === part);
          if (matches) {
            console.log('[QueryInvalidation] Invalidating query key:', queryKey);
          }
          return matches;
        },
      })
    );
    
    await Promise.all(promises);
    console.log('[QueryInvalidation] Workspace data invalidation complete');
  }

  /**
   * Invalidate all link-related queries
   * Use this when link data changes
   */
  static async invalidateLinkData(
    queryClient: QueryClient,
    linkId?: string
  ): Promise<void> {
    if (linkId) {
      // Invalidate specific link queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.includes(linkId);
        },
      });
    } else {
      // Invalidate all link queries
      const promises = LINK_DATA_PATTERNS.map(pattern =>
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return pattern.every((part, index) => queryKey[index] === part);
          },
        })
      );
      
      await Promise.all(promises);
    }
  }

  /**
   * Invalidate storage-related queries
   */
  static async invalidateStorageData(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return queryKey.includes('storage');
      },
    });
  }

  /**
   * Invalidate all data (use sparingly, e.g., after major operations)
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries();
  }

  /**
   * Register global mutation observers for automatic invalidation
   * This can be called in the QueryClient configuration
   */
  static configureMutationCache(queryClient: QueryClient): void {
    // This would be called in the QueryProvider setup
    // Currently not implemented as it requires modifying the provider
    // but provides a pattern for future enhancement
  }
}

/**
 * Hook for using the query invalidation service
 * Provides a convenient way to access invalidation methods in components
 */
export function useQueryInvalidation() {
  // This would be implemented as a custom hook if needed
  // For now, the static methods can be used directly
  return QueryInvalidationService;
}