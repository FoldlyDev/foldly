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
