// =============================================================================
// BILLING HOOKS INDEX - Clean Exports for Hook Management (UPDATED 2025)
// =============================================================================
// 🎯 Centralized exports for all billing hooks with modern React Query integration

// Modern React Query billing hooks (RECOMMENDED)
export {
  useBillingDataQuery,
  useStorageMonitorQuery,
  useBillingOverviewQuery,
  useStorageUsageQuery,
} from './react-query';

// Query key utilities
export {
  billingQueryKeys,
  invalidateAllBillingQueries,
  invalidateUserBillingQueries,
  invalidatePlanQueries,
} from './react-query';

// Legacy billing data hooks (maintained for compatibility)
export * from './use-billing-data';

// Modern Clerk billing hooks (UPDATED 2025)
export * from './use-clerk-billing';

// Subscription plans hooks
export * from './use-subscription-plans';
