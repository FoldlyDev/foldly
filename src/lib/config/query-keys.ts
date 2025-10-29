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
} as const;

/**
 * Folder-related query keys
 */
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  roots: (workspaceId: string) => [...folderKeys.lists(), 'roots', workspaceId] as const,
  subfolders: (parentId: string) => [...folderKeys.lists(), 'subfolders', parentId] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
  hierarchy: (id: string) => [...folderKeys.all, 'hierarchy', id] as const,
} as const;

/**
 * File-related query keys
 */
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  workspace: (workspaceId: string) => [...fileKeys.lists(), 'workspace', workspaceId] as const,
  folder: (folderId: string) => [...fileKeys.lists(), 'folder', folderId] as const,
  byEmail: (workspaceId: string, email: string) => [...fileKeys.lists(), 'by-email', workspaceId, email] as const,
  byDate: (workspaceId: string, startDate: string, endDate?: string) =>
    [...fileKeys.lists(), 'by-date', workspaceId, { startDate, endDate }] as const,
  search: (workspaceId: string, query: string) => [...fileKeys.all, 'search', workspaceId, query] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
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
 * Legacy compatibility keys
 * These maintain backward compatibility with existing cache invalidations
 */
export const legacyKeys = {
  /** @deprecated Use userKeys.workspace() instead */
  userWorkspace: ['user-workspace'] as const,
  /** @deprecated Use onboardingKeys.status() instead */
  onboardingStatus: ['onboarding-status'] as const,
} as const;
