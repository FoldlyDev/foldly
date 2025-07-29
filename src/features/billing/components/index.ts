// =============================================================================
// BILLING COMPONENTS EXPORTS - Clerk Billing Integration
// =============================================================================
// 🎯 Modern Clerk-based billing system with feature access control

// Access Control Components (NEW - Clerk Integration)
export {
  default as FeatureGate,
  ClerkProtectWrapper,
  useFeatureAccess,
} from './access-control/FeatureGate';
export type {
  FeatureGateProps,
  FeatureKey,
  FeatureTier,
} from './access-control/FeatureGate';

// Modern Billing Pages & Views
export { BillingPageClient } from './views/BillingPageClient';
export { BillingContainer } from './views/BillingContainer';
export { PricingPage } from './pricing/PricingPage';
export { default as ClerkBillingPage } from './pricing/ClerkBillingPage';

// Billing Components
export { BillingHeader } from './sections/BillingHeader';
export { BillingOverviewCards } from './cards/BillingOverviewCards';
