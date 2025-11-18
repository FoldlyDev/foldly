// =============================================================================
// REACT QUERY KEYS - Centralized Query Key Factory
// =============================================================================
// 🎯 Single source of truth for all React Query cache keys
// Following React Query best practices for key structure and organization
//
// Key Structure Pattern:
// - ['entity'] - all entities
// - ['entity', 'list'] - list of entities
// - ['entity', 'detail', id] - specific entity
// - ['entity', 'operation', params] - specific operation

/**
 * Context keys for client-side placeholders
 * Used when workspace ID is not available in client components
 * The actual workspace ID is resolved server-side via auth
 */
export const contextKeys = {
  /**
   * Placeholder for current authenticated user's workspace
   * Used in client hooks where workspace ID is fetched server-side
   */
  currentWorkspace: () => ['current-workspace'] as const,
} as const;

/**
 * User-related query keys
 */
export const userKeys = {
  all: ['user'] as const,
  workspace: () => [...userKeys.all, 'workspace'] as const,
} as const;

/**
 * Workspace-related query keys
 */
export const workspaceKeys = {
  all: ['workspace'] as const,
  detail: () => [...workspaceKeys.all, 'detail'] as const,
  stats: () => [...workspaceKeys.all, 'stats'] as const,
  recentActivity: (limit?: number) => [...workspaceKeys.all, 'recent-activity', { limit }] as const,
} as const;

/**
 * Onboarding-related query keys
 */
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
} as const;

/**
 * Link-related query keys
 */
export const linkKeys = {
  all: ['links'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (filters?: string) => [...linkKeys.lists(), { filters }] as const,
  details: () => [...linkKeys.all, 'detail'] as const,
  detail: (id: string) => [...linkKeys.details(), id] as const,
  slugCheck: (slug: string) => [...linkKeys.all, 'slug-check', slug] as const,
  available: () => [...linkKeys.all, 'available'] as const,
} as const;

/**
 * Folder-related query keys
 * Note: workspaceId removed from roots key due to 1:1 user-workspace relationship
 */
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  roots: () => [...folderKeys.lists(), 'roots'] as const,
  subfolders: (parentId: string) => [...folderKeys.lists(), 'subfolders', parentId] as const,
  byParent: (parentFolderId: string | null) => [...folderKeys.lists(), 'by-parent', parentFolderId ?? 'root'] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
  hierarchy: (id: string) => [...folderKeys.all, 'hierarchy', id] as const,
} as const;

/**
 * File-related query keys
 * Note: workspaceId removed from keys due to 1:1 user-workspace relationship
 * Auth context always resolves to current user's workspace
 */
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  workspace: () => [...fileKeys.lists(), 'workspace'] as const,
  folder: (folderId: string) => [...fileKeys.lists(), 'folder', folderId] as const,
  byFolder: (parentFolderId: string | null) => [...fileKeys.lists(), 'by-folder', parentFolderId ?? 'root'] as const,
  byEmail: (email: string) => [...fileKeys.lists(), 'by-email', email] as const,
  byDate: (startDate: string, endDate?: string) =>
    [...fileKeys.lists(), 'by-date', { startDate, endDate }] as const,
  search: (query: string) => [...fileKeys.all, 'search', query] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
  signedUrl: (fileId: string) => [...fileKeys.all, 'signed-url', fileId] as const,
} as const;

/**
 * Permission-related query keys
 */
export const permissionKeys = {
  all: ['permissions'] as const,
  byLink: (linkId: string) => [...permissionKeys.all, 'link', linkId] as const,
} as const;

/**
 * Email-related query keys
 * Note: Email operations are mutations-only (no queries), so keys are minimal
 */
export const emailKeys = {
  all: ['email'] as const,
} as const;

/**
 * File-Folder mixed operations query keys
 * For operations that work with both files and folders together
 */
export const fileFolderKeys = {
  all: ['file-folder'] as const,
  bulkDownload: (fileIds: string[], folderIds: string[]) =>
    [...fileFolderKeys.all, 'bulk-download', { fileIds, folderIds }] as const,
  bulkMove: (fileIds: string[], folderIds: string[], targetFolderId: string | null) =>
    [...fileFolderKeys.all, 'bulk-move', { fileIds, folderIds, targetFolderId }] as const,
  bulkDelete: (fileIds: string[], folderIds: string[]) =>
    [...fileFolderKeys.all, 'bulk-delete', { fileIds, folderIds }] as const,
} as const;

/**
 * Legacy compatibility keys
 * These maintain backward compatibility with existing cache invalidations
 */
export const legacyKeys = {
  /** @deprecated Use userKeys.workspace() instead */
  userWorkspace: ['user-workspace'] as const,
  /** @deprecated Use onboardingKeys.status() instead */
  onboardingStatus: ['onboarding-status'] as const,
} as const;
