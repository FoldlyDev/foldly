// =============================================================================
// BILLING SERVICES INDEX - Centralized Export for Clerk Billing Integration
// =============================================================================
// 🎯 Single point of import for all billing-related services (2025)

// =============================================================================
// CORE SERVICES
// =============================================================================

export { ClerkBillingIntegrationService } from './clerk-billing-integration';
export { SubscriptionAnalyticsService } from './subscription-analytics-service';
export { BillingAnalyticsService } from './billing-analytics-service';
export { BillingErrorRecoveryService } from './billing-error-recovery';

// Import for the billing object
import { ClerkBillingIntegrationService, 
  isUserSubscribed,
  hasFeature,
  getCurrentPlan 
} from './clerk-billing-integration';
import { SubscriptionAnalyticsService } from './subscription-analytics-service';
import { BillingAnalyticsService } from './billing-analytics-service';
import { BillingErrorRecoveryService } from './billing-error-recovery';

// Legacy services (for backward compatibility)
export {
  SubscriptionPlansService,
  getDefaultPlanConfigurations,
  seedSubscriptionPlans,
} from './subscription-plans-service';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export {
  isUserSubscribed,
  hasFeature,
  getCurrentPlan,
} from './clerk-billing-integration';

// =============================================================================
// TYPES
// =============================================================================

export type {
  ClerkPlanAccess,
  IntegratedPlanData,
  PlanChangeRequest,
} from './clerk-billing-integration';

export type {
  SubscriptionAnalyticsData,
  SubscriptionMetrics,
  UserSubscriptionHistory,
} from './subscription-analytics-service';

export type {
  UserBillingData,
  BillingOverviewData,
} from './billing-analytics-service';

export type {
  BillingErrorContext,
  FallbackPlanData,
  ErrorRecoveryConfig,
} from './billing-error-recovery';

// Schema types (primary source)
export type {
  SubscriptionPlan,
  InsertSubscriptionPlan,
  PlanUIMetadata,
} from '@/lib/database/schemas';

// Service types
export type {
  CreatePlanInput,
  UpdatePlanInput,
} from './subscription-plans-service';

// =============================================================================
// QUICK ACCESS PATTERNS
// =============================================================================

/**
 * Quick access to most commonly used billing functions
 * 
 * @example
 * ```typescript
 * import { billing } from '@/lib/services/billing';
 * 
 * const currentPlan = await billing.getCurrentPlan();
 * const hasCustomBranding = await billing.hasFeature('custom_branding');
 * const isSubscribed = await billing.isSubscribed();
 * ```
 */
export const billing = {
  // Plan access
  getCurrentPlan,
  hasFeature,
  isUserSubscribed,
  
  // Core services
  integration: ClerkBillingIntegrationService,
  analytics: SubscriptionAnalyticsService,
  billingData: BillingAnalyticsService,
  errorRecovery: BillingErrorRecoveryService,
} as const;

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * @deprecated Use ClerkBillingIntegrationService.getCurrentUserPlan() instead
 * Kept for backward compatibility during migration
 */
export const getUserPlan = getCurrentPlan;

/**
 * @deprecated Use ClerkBillingIntegrationService.hasFeatureAccess() instead
 * Kept for backward compatibility during migration
 */
export const checkFeatureAccess = hasFeature;

/**
 * @deprecated Use ClerkBillingIntegrationService.getIntegratedPlanData() instead
 * Kept for backward compatibility during migration
 */
export const getPlanData = ClerkBillingIntegrationService.getIntegratedPlanData;

// =============================================================================
// VERSION INFO
// =============================================================================

export const BILLING_INTEGRATION_VERSION = '1.0.0';
export const CLERK_BILLING_SUPPORT = true;
export const LAST_UPDATED = '2025-01-27';

/**
 * Integration health check
 */
export const healthCheck = BillingErrorRecoveryService.healthCheck;