// =============================================================================
// WORKSPACE QUERY KEYS - React Query key management for workspace data
// =============================================================================

export const workspaceQueryKeys = {
  // Base key for all workspace queries
  all: ['workspace'] as const,

  // Workspace data (files, folders, and stats)
  data: () => [...workspaceQueryKeys.all, 'data'] as const,
  
  // Legacy tree key for backwards compatibility (deprecated)
  tree: () => [...workspaceQueryKeys.all, 'tree'] as const,

  // Workspace settings
  settings: () => [...workspaceQueryKeys.all, 'settings'] as const,

  // Workspace statistics
  stats: () => [...workspaceQueryKeys.all, 'stats'] as const,

  // Workspace analytics
  analytics: () => [...workspaceQueryKeys.all, 'analytics'] as const,

  // Workspace by user
  byUser: (userId: string) =>
    [...workspaceQueryKeys.all, 'user', userId] as const,

  // Workspace by ID
  byId: (workspaceId: string) =>
    [...workspaceQueryKeys.all, 'id', workspaceId] as const,
} as const;
