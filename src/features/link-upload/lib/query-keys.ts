// =============================================================================
// LINK QUERY KEYS - React Query key management for link upload feature
// =============================================================================

/**
 * Query key factory for link upload feature
 * Following React Query best practices for key organization
 */
export const linkQueryKeys = {
  // Base key for all link queries
  all: ['links'] as const,
  
  // Link tree data
  trees: () => [...linkQueryKeys.all, 'trees'] as const,
  tree: (linkId: string) => [...linkQueryKeys.trees(), linkId] as const,
  
  // Link files
  files: () => [...linkQueryKeys.all, 'files'] as const,
  file: (linkId: string, fileId: string) => [...linkQueryKeys.files(), linkId, fileId] as const,
  
  // Link folders
  folders: () => [...linkQueryKeys.all, 'folders'] as const,
  folder: (linkId: string, folderId: string) => [...linkQueryKeys.folders(), linkId, folderId] as const,
  
  // Link validation and access
  validation: () => [...linkQueryKeys.all, 'validation'] as const,
  access: (linkId: string) => [...linkQueryKeys.validation(), 'access', linkId] as const,
  
  // Link upload progress
  uploads: () => [...linkQueryKeys.all, 'uploads'] as const,
  upload: (linkId: string, batchId: string) => [...linkQueryKeys.uploads(), linkId, batchId] as const,
} as const;