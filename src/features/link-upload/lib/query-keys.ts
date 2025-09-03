// =============================================================================
// LINK UPLOAD QUERY KEYS - React Query key management for link upload data
// =============================================================================

export const linkUploadQueryKeys = {
  // Base key for all link upload queries
  all: ['link-upload'] as const,

  // Link data by slug (includes files, folders, and link metadata)
  bySlug: (slug: string, topic?: string) => 
    [...linkUploadQueryKeys.all, 'slug', slug, ...(topic ? ['topic', topic] : [])] as const,

  // Link files and folders tree data
  tree: (linkId: string) => 
    [...linkUploadQueryKeys.all, 'tree', linkId] as const,

  // Link statistics
  stats: (linkId: string) =>
    [...linkUploadQueryKeys.all, 'stats', linkId] as const,

  // Link access validation
  access: (slug: string | undefined, topic?: string | undefined) =>
    [...linkUploadQueryKeys.all, 'access', ...(slug ? [slug] : []), ...(topic ? ['topic', topic] : [])] as const,

  // Link by ID
  byId: (linkId: string) =>
    [...linkUploadQueryKeys.all, 'id', linkId] as const,
} as const;