// =============================================================================
// BILLING SERVICES INDEX - Simplified and Organized
// =============================================================================
// 🎯 Clean export structure for all billing services

// =============================================================================
// CORE SERVICES - Individual Services for Specific Purposes
// =============================================================================

import { SubscriptionAnalyticsService } from './subscription-analytics-service';
import { BillingErrorRecoveryService } from './billing-error-recovery';
import { ClerkBillingIntegrationService } from './clerk-billing-integration';

export { SubscriptionAnalyticsService };
export { BillingErrorRecoveryService };
export { ClerkBillingIntegrationService };

// Legacy services (maintained for existing functionality)
export {
  SubscriptionPlansService,
  getDefaultPlanConfigurations,
  seedSubscriptionPlans,
} from './subscription-plans-service';

// =============================================================================
// UNIFIED SERVICE - Main Entry Point
// =============================================================================

// Import the unified service from the misplaced file (we'll move logic here)
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { subscriptionPlans, users } from '@/lib/database/schemas';
import type { DatabaseResult } from '@/lib/database/types';

// Unified types (serializable - no functions for client/server boundary)
export interface BillingData {
  currentPlan: 'free' | 'pro' | 'business';
  isSubscribed: boolean;
  subscriptionStatus: string | null;
  features: string[];
  storageLimit: number;
  storageUsed: number;
  storagePercentage: number;
  planName: string;
  monthlyPrice: string;
  yearlyPrice: string;
  canUpgrade: boolean;
  upgradeOptions: string[];
}

export interface SubscriptionEvent {
  id: string;
  userId: string;
  eventType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  fromPlan: string | null;
  toPlan: string | null;
  occurredAt: Date;
}

// =============================================================================
// UNIFIED BILLING SERVICE - Main Service Class
// =============================================================================

export class BillingService {
  /**
   * Get complete billing data for current user
   */
  static async getUserBillingData(userId?: string): Promise<DatabaseResult<BillingData>> {
    try {
      const { userId: currentUserId, has } = await auth();
      const targetUserId = userId || currentUserId;

      if (!targetUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current plan from Clerk
      let currentPlan: 'free' | 'pro' | 'business' = 'free';
      let features: string[] = [];

      if (has) {
        if (has({ plan: 'business' }) || has({ plan: 'Business' })) {
          currentPlan = 'business';
          features = ['unlimited_storage', 'advanced_branding', 'priority_support', 'team_collaboration'];
        } else if (has({ plan: 'pro' }) || has({ plan: 'Pro' })) {
          currentPlan = 'pro';
          features = ['custom_branding', 'password_protection', 'extended_storage', 'analytics'];
        } else {
          currentPlan = 'free';
          features = ['basic_sharing', 'limited_storage'];
        }

        // Check additional features
        const additionalFeatures = ['widgets', 'advanced_analytics', 'custom_domains', 'api_access'];
        additionalFeatures.forEach(feature => {
          if (has({ feature })) features.push(feature);
        });
      }

      // Get plan metadata and user storage
      const planMetadata = await this.getPlanMetadata(currentPlan);
      const userStorage = await this.getUserStorageInfo(targetUserId);
      
      const storageLimit = planMetadata.storageLimitGb === -1 
        ? Infinity 
        : planMetadata.storageLimitGb * 1024 * 1024 * 1024;
      const storageUsed = userStorage.storageUsed;
      const storagePercentage = storageLimit === Infinity ? 0 : (storageUsed / storageLimit) * 100;

      const upgradeOptions = this.getUpgradeOptions(currentPlan);

      return {
        success: true,
        data: {
          currentPlan,
          isSubscribed: currentPlan !== 'free',
          subscriptionStatus: null,
          features,
          storageLimit,
          storageUsed,
          storagePercentage,
          planName: planMetadata.planName,
          monthlyPrice: planMetadata.monthlyPrice,
          yearlyPrice: planMetadata.yearlyPrice,
          canUpgrade: upgradeOptions.length > 0,
          upgradeOptions,
        },
      };
    } catch (error) {
      console.error('Error getting user billing data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async hasFeatureAccess(feature: string, userId?: string): Promise<boolean> {
    try {
      const result = await this.getUserBillingData(userId);
      return result.success ? result.data.features.includes(feature) : false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  static async getAllPlans() {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.sortOrder);

      return {
        success: true,
        data: plans.map(plan => ({
          planKey: plan.planKey,
          planName: plan.planName,
          monthlyPrice: plan.monthlyPriceUsd,
          yearlyPrice: plan.yearlyPriceUsd || '0.00',
          storageLimit: plan.storageLimitGb === -1 ? 'Unlimited' : `${plan.storageLimitGb} GB`,
          features: (plan.highlightFeatures as string[]) || [],
          isPopular: plan.isPopular || false,
        })),
      };
    } catch (error) {
      console.error('Error getting all plans:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async recordSubscriptionEvent(data: {
    userId: string;
    eventType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
    fromPlan: string | null;
    toPlan: string | null;
    source: string;
    metadata?: Record<string, any>;
  }) {
    return await SubscriptionAnalyticsService.recordSubscriptionEvent({
      ...data,
      metadata: data.metadata || {},
      occurredAt: new Date(),
    });
  }

  static async getUserSubscriptionHistory(userId: string): Promise<DatabaseResult<SubscriptionEvent[]>> {
    try {
      const result = await SubscriptionAnalyticsService.getUserSubscriptionHistory(userId);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      const eventData: SubscriptionEvent[] = result.data.events.map(event => ({
        id: event.id,
        userId: event.userId,
        eventType: event.eventType as 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
        fromPlan: event.fromPlan,
        toPlan: event.toPlan,
        occurredAt: event.occurredAt,
      }));

      return {
        success: true,
        data: eventData,
      };
    } catch (error) {
      console.error('Error getting subscription history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helpers
  private static async getUserStorageInfo(userId: string) {
    try {
      const user = await db
        .select({ storageUsed: users.storageUsed })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return { storageUsed: user[0]?.storageUsed || 0 };
    } catch (error) {
      console.warn('Error getting user storage info:', error);
      return { storageUsed: 0 };
    }
  }

  private static async getPlanMetadata(planKey: string) {
    try {
      const result = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.planKey, planKey))
        .limit(1);

      const plan = result[0];
      if (plan) {
        return {
          planName: plan.planName,
          monthlyPrice: plan.monthlyPriceUsd,
          yearlyPrice: plan.yearlyPriceUsd || '0.00',
          storageLimitGb: plan.storageLimitGb,
        };
      }

      return {
        planName: planKey.charAt(0).toUpperCase() + planKey.slice(1),
        monthlyPrice: '0.00',
        yearlyPrice: '0.00',
        storageLimitGb: planKey === 'free' ? 50 : planKey === 'pro' ? 500 : -1,
      };
    } catch (error) {
      console.warn('Error getting plan metadata, using defaults:', error);
      return {
        planName: planKey.charAt(0).toUpperCase() + planKey.slice(1),
        monthlyPrice: '0.00',
        yearlyPrice: '0.00',
        storageLimitGb: 50,
      };
    }
  }

  private static getUpgradeOptions(currentPlan: string): string[] {
    switch (currentPlan) {
      case 'free': return ['pro', 'business'];
      case 'pro': return ['business'];
      case 'business': return [];
      default: return [];
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function isUserSubscribed(): Promise<boolean> {
  const result = await BillingService.getUserBillingData();
  return result.success && result.data.isSubscribed;
}

export async function hasFeature(feature: string): Promise<boolean> {
  return BillingService.hasFeatureAccess(feature);
}

export async function getCurrentPlan(): Promise<'free' | 'pro' | 'business'> {
  const result = await BillingService.getUserBillingData();
  return result.success ? result.data.currentPlan : 'free';
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create a unified billing object for backward compatibility
export const billing = {
  getUserBillingData: BillingService.getUserBillingData,
  hasFeatureAccess: BillingService.hasFeatureAccess,
  getAllPlans: BillingService.getAllPlans,
  recordSubscriptionEvent: BillingService.recordSubscriptionEvent,
  getUserSubscriptionHistory: BillingService.getUserSubscriptionHistory,
  
  // Convenience methods
  isUserSubscribed,
  hasFeature,
  getCurrentPlan,
  
  // Sub-services
  errorRecovery: new BillingErrorRecoveryService(),
  integration: new ClerkBillingIntegrationService(),
  analytics: SubscriptionAnalyticsService,
};

export default BillingService;
