// =============================================================================
// FILES FEATURE QUERY KEYS - React Query key management for files/links data
// =============================================================================

export const filesQueryKeys = {
  // Base key for all files queries
  all: ['files'] as const,

  // All user links data (base, custom/topic, generated)
  links: () => [...filesQueryKeys.all, 'links'] as const,

  // Links by type
  linksByType: (type: 'base' | 'custom' | 'generated') =>
    [...filesQueryKeys.links(), type] as const,

  // Specific link data with files
  linkWithFiles: (linkId: string) =>
    [...filesQueryKeys.links(), 'withFiles', linkId] as const,

  // Files shared through a specific link
  filesByLink: (linkId: string) =>
    [...filesQueryKeys.all, 'filesByLink', linkId] as const,
  
  // Link files (alias for filesByLink for clarity)
  linkFiles: (linkId: string) =>
    [...filesQueryKeys.all, 'filesByLink', linkId] as const,

  // Full link content (files and folders)
  linkContent: (linkId: string) =>
    [...filesQueryKeys.all, 'linkContent', linkId] as const,

  // Workspace data for read-only view
  workspaceView: () => [...filesQueryKeys.all, 'workspace'] as const,

  // Storage info
  storage: () => [...filesQueryKeys.all, 'storage'] as const,

  // Statistics
  stats: () => [...filesQueryKeys.all, 'stats'] as const,
} as const;
