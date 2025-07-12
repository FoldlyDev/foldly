// =============================================================================
// WORKSPACE QUERY KEYS - React Query key management for workspace data
// =============================================================================

export const workspaceQueryKeys = {
  // Base key for all workspace queries
  all: ['workspace'] as const,

  // Workspace tree data (files and folders)
  tree: () => [...workspaceQueryKeys.all, 'tree'] as const,

  // Workspace settings
  settings: () => [...workspaceQueryKeys.all, 'settings'] as const,

  // Workspace analytics
  analytics: () => [...workspaceQueryKeys.all, 'analytics'] as const,

  // Workspace by user
  byUser: (userId: string) =>
    [...workspaceQueryKeys.all, 'user', userId] as const,

  // Workspace by ID
  byId: (workspaceId: string) =>
    [...workspaceQueryKeys.all, 'id', workspaceId] as const,
} as const;
