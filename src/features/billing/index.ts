// =============================================================================
// BILLING FEATURE EXPORTS - Clerk Integration
// =============================================================================
// 🎯 Modern Clerk-based billing system exports

// Billing components (Clerk-based)
export * from './components';

// Billing hooks (Clerk integration)
export * from './hooks';

// Server actions
export * from './lib/actions';

// Types (for external usage)
export type { 
  FeatureKey, 
  FeatureTier, 
  FeatureGateProps 
} from './components/access-control/FeatureGate';

export type {
  ClerkBillingFeatures,
  ClerkSubscriptionStatus
} from './hooks/use-clerk-billing';

// Integration utilities (database types)
export type {
  PlanUIMetadata,
  SubscriptionPlan,
  InsertSubscriptionPlan,
} from '@/lib/database/schemas';