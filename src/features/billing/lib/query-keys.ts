// =============================================================================
// BILLING QUERY KEYS - Consistent Query Key Management for React Query
// =============================================================================
// 🎯 Centralized query key definitions following React Query best practices

/**
 * Billing query keys following hierarchical structure
 * Organized by domain for efficient cache invalidation
 */
export const billingQueryKeys = {
  // Top-level billing namespace
  all: ['billing'] as const,

  // User billing data
  userBilling: (userId: string) =>
    [...billingQueryKeys.all, 'user', userId] as const,
  userBillingData: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'data'] as const,
  userStorageUsage: (userId: string, plan: string) =>
    [...billingQueryKeys.userBilling(userId), 'storage', plan] as const,
  userBillingOverview: (userId: string, plan: string) =>
    [...billingQueryKeys.userBilling(userId), 'overview', plan] as const,

  // New Clerk + subscription_plans integration queries
  userPlanDetails: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'plan-details'] as const,
  realTimeStorage: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'real-time-storage'] as const,
  billingIntegration: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'integration'] as const,
  userStorageStatus: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'storage-status'] as const,
  planSync: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'plan-sync'] as const,

  // ✅ NEW: Clean plan configuration query
  planConfig: (userId: string) =>
    [...billingQueryKeys.userBilling(userId), 'plan-config'] as const,

  // Subscription plans
  subscriptionPlans: () => [...billingQueryKeys.all, 'plans'] as const,
  activePlans: () =>
    [...billingQueryKeys.subscriptionPlans(), 'active'] as const,
  mvpPlans: () => [...billingQueryKeys.subscriptionPlans(), 'mvp'] as const,
  planByKey: (planKey: string) =>
    [...billingQueryKeys.subscriptionPlans(), 'by-key', planKey] as const,
  planFeatures: (planKey: string) =>
    [...billingQueryKeys.subscriptionPlans(), 'features', planKey] as const,

  // Analytics and usage
  analytics: () => [...billingQueryKeys.all, 'analytics'] as const,
  userUsageStats: (userId: string) =>
    [...billingQueryKeys.analytics(), 'user', userId] as const,
  systemMetrics: () => [...billingQueryKeys.analytics(), 'system'] as const,
} as const;

/**
 * Helper function to invalidate all billing queries
 */
export const invalidateAllBillingQueries = () => billingQueryKeys.all;

/**
 * Helper function to invalidate user-specific billing queries
 */
export const invalidateUserBillingQueries = (userId: string) =>
  billingQueryKeys.userBilling(userId);

/**
 * Helper function to invalidate subscription plan queries
 */
export const invalidatePlanQueries = () => billingQueryKeys.subscriptionPlans();
