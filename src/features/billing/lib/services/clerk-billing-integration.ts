// =============================================================================
// CLERK BILLING INTEGRATION SERVICE - Complete Clerk + Database Integration
// =============================================================================
// 🎯 Central service for Clerk billing integration with database synchronization

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { subscriptionPlans, type PlanUIMetadata } from '@/lib/database/schemas';
import { SubscriptionAnalyticsService } from './subscription-analytics-service';
import type { DatabaseResult } from '@/lib/database/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ClerkPlanAccess {
  currentPlan: 'free' | 'pro' | 'business';
  hasActiveBilling: boolean;
  subscriptionStatus: string | null;
  planFeatures: string[];
  metadata: Record<string, any>;
}

export interface IntegratedPlanData {
  // From Clerk (source of truth)
  clerkPlan: ClerkPlanAccess;

  // From Database (UI metadata)
  uiMetadata: PlanUIMetadata;

  // Combined features and access
  hasFeatureAccess: (feature: string) => boolean;
  storageLimit: number;
  storageUsed: number;

  // Subscription details
  isSubscribed: boolean;
  canUpgrade: boolean;
  upgradeOptions: string[];
}

export interface PlanChangeRequest {
  userId: string;
  targetPlan: 'pro' | 'business';
  source: 'user_request' | 'admin' | 'webhook';
  metadata?: Record<string, any>;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class ClerkBillingIntegrationService {
  /**
   * Get current user's plan from Clerk (source of truth)
   */
  static async getCurrentUserPlan(): Promise<DatabaseResult<ClerkPlanAccess>> {
    try {
      const { userId, has } = await auth();

      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Use Clerk's has() helper to check plan access
      let currentPlan: 'free' | 'pro' | 'business' = 'free';
      let planFeatures: string[] = [];
      let subscriptionStatus: string | null = null;

      if (has) {
        // Check plans in order of hierarchy
        if (
          has({ plan: 'business' }) ||
          has({ plan: 'Business' }) ||
          has({ plan: 'enterprise' })
        ) {
          currentPlan = 'business';
          planFeatures = [
            'storage_limits',
            'priority_support',
            'custom_branding',
            'password_protected_links',
            'premium_short_links',
            'qr_code_generation',
          ];
        } else if (
          has({ plan: 'pro' }) ||
          has({ plan: 'Pro' }) ||
          has({ plan: 'professional' })
        ) {
          currentPlan = 'pro';
          planFeatures = [
            'custom_branding',
            'password_protected_links',
            'storage_limits',
            'premium_short_links',
            'qr_code_generation',
          ];
        } else {
          // Default to free plan
          currentPlan = 'free';
          planFeatures = [
            'storage_limits',
            'custom_username',
            'unlimited_links',
            'email_notifications',
            'file_preview_thumbnails',
            'cloud_integrations',
          ];
        }

        // Check for additional features
        // Additional features that might be granted separately
        const additionalFeatures = [
          'widgets',
          'custom_domains',
          'bulk_upload',
          'version_control',
        ];

        additionalFeatures.forEach(feature => {
          if (has({ feature })) {
            planFeatures.push(feature);
          }
        });
      }

      // Try to get subscription status from user metadata
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        subscriptionStatus =
          (user.publicMetadata?.subscriptionStatus as string) || null;
      } catch (error) {
        console.warn(
          'Could not fetch user metadata for subscription status:',
          error
        );
      }

      const hasActiveBilling = currentPlan !== 'free';

      return {
        success: true,
        data: {
          currentPlan,
          hasActiveBilling,
          subscriptionStatus,
          planFeatures,
          metadata: {
            userId,
            checkedAt: new Date().toISOString(),
            source: 'clerk_api',
          },
        },
      };
    } catch (error) {
      console.error('Error getting current user plan from Clerk:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integrated plan data (Clerk + Database)
   */
  static async getIntegratedPlanData(): Promise<
    DatabaseResult<IntegratedPlanData>
  > {
    try {
      // Get plan from Clerk (source of truth)
      const clerkPlanResult = await this.getCurrentUserPlan();
      if (!clerkPlanResult.success) {
        return {
          success: false,
          error: clerkPlanResult.error,
        };
      }

      const clerkPlan = clerkPlanResult.data;

      // Get UI metadata from database
      const uiMetadataResult = await this.getPlanUIMetadata(
        clerkPlan.currentPlan
      );
      if (!uiMetadataResult.success) {
        return {
          success: false,
          error: uiMetadataResult.error,
        };
      }

      const uiMetadata = uiMetadataResult.data;

      // Create feature access checker
      const hasFeatureAccess = (feature: string): boolean => {
        // Check if feature is in Clerk's feature list (primary)
        const clerkHasFeature = clerkPlan.planFeatures.includes(feature);

        // Check if feature is in plan's feature descriptions (secondary)
        const dbHasFeature = feature in (uiMetadata.featureDescriptions || {});

        return clerkHasFeature || dbHasFeature;
      };

      // Calculate storage limit
      const storageLimit =
        uiMetadata.storageLimitGb === -1
          ? Infinity
          : uiMetadata.storageLimitGb * 1024 * 1024 * 1024; // Convert GB to bytes

      // Determine upgrade options
      const upgradeOptions = this.getUpgradeOptions(clerkPlan.currentPlan);

      return {
        success: true,
        data: {
          clerkPlan,
          uiMetadata,
          hasFeatureAccess,
          storageLimit,
          storageUsed: 0, // Would be calculated from user's actual usage
          isSubscribed: clerkPlan.currentPlan !== 'free',
          canUpgrade: upgradeOptions.length > 0,
          upgradeOptions,
        },
      };
    } catch (error) {
      console.error('Error getting integrated plan data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get plan UI metadata from database
   */
  static async getPlanUIMetadata(
    planKey: string
  ): Promise<DatabaseResult<PlanUIMetadata>> {
    try {
      const result = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.planKey, planKey))
        .limit(1);

      const plan = result[0];
      if (!plan) {
        console.warn(`Plan ${planKey} not found in database, using defaults`);

        // Return safe defaults for unknown plans
        return {
          success: true,
          data: {
            planKey,
            planName: planKey.charAt(0).toUpperCase() + planKey.slice(1),
            planDescription: null,
            monthlyPrice: '0.00',
            yearlyPrice: '0.00',
            storageLimit:
              planKey === 'free'
                ? '50 GB'
                : planKey === 'pro'
                  ? '500 GB'
                  : '2048 GB',
            storageLimitGb:
              planKey === 'free' ? 50 : planKey === 'pro' ? 500 : 2048,
            maxFileSize:
              planKey === 'free'
                ? '2 GB'
                : planKey === 'pro'
                  ? '10 GB'
                  : '25 GB',
            maxFileSizeMb:
              planKey === 'free' ? 2048 : planKey === 'pro' ? 10240 : 25600,
            highlightFeatures: [],
            featureDescriptions: {},
            isPopular: false,
          },
        };
      }

      return {
        success: true,
        data: {
          planKey: plan.planKey,
          planName: plan.planName,
          planDescription: plan.planDescription || null,
          monthlyPrice: plan.monthlyPriceUsd,
          yearlyPrice: plan.yearlyPriceUsd || '0.00',
          storageLimit:
            plan.storageLimitGb === -1
              ? 'Unlimited'
              : `${plan.storageLimitGb} GB`,
          storageLimitGb: plan.storageLimitGb,
          maxFileSize: plan.maxFileSizeMb 
            ? `${(plan.maxFileSizeMb / 1024).toFixed(0)} GB`
            : '2 GB',
          maxFileSizeMb: plan.maxFileSizeMb || 2048,
          highlightFeatures: (plan.highlightFeatures as string[]) || [],
          featureDescriptions:
            (plan.featureDescriptions as Record<string, string>) || {},
          isPopular: plan.isPopular || false,
        },
      };
    } catch (error) {
      console.error(`Error getting plan UI metadata for ${planKey}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle subscription change from webhook
   */
  static async handleSubscriptionChange(data: {
    userId: string;
    eventType: string;
    fromPlan: string | null;
    toPlan: string | null;
    source: string;
    metadata: Record<string, any>;
    occurredAt: Date;
  }): Promise<DatabaseResult<void>> {
    try {
      console.log(
        `📋 SUBSCRIPTION_CHANGE: Processing ${data.eventType} for user ${data.userId}`,
        {
          fromPlan: data.fromPlan,
          toPlan: data.toPlan,
          source: data.source,
        }
      );

      // Record the event in analytics
      const analyticsResult =
        await SubscriptionAnalyticsService.recordSubscriptionEvent(data);

      if (!analyticsResult.success) {
        console.error(
          'Failed to record subscription analytics:',
          analyticsResult.error
        );
        // Don't fail the whole operation if analytics fails
      }

      // Additional processing based on event type
      switch (data.eventType) {
        case 'upgrade':
          await this.handleUpgradeEvent(data);
          break;
        case 'downgrade':
          await this.handleDowngradeEvent(data);
          break;
        case 'cancel':
          await this.handleCancelEvent(data);
          break;
        case 'reactivate':
          await this.handleReactivateEvent(data);
          break;
        default:
          console.log(`No specific handler for event type: ${data.eventType}`);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error handling subscription change:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(
    feature: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const { has } = await auth();

      if (!has) {
        return false;
      }

      // First check with Clerk's has() helper
      if (has({ feature })) {
        return true;
      }

      // Fallback: check based on plan hierarchy
      const planResult = await this.getCurrentUserPlan();
      if (!planResult.success) {
        return false;
      }

      const plan = planResult.data;
      return plan.planFeatures.includes(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get all available plans for pricing/comparison
   */
  static async getAllPlans(): Promise<DatabaseResult<PlanUIMetadata[]>> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.sortOrder);

      const planData: PlanUIMetadata[] = plans.map(plan => ({
        planKey: plan.planKey,
        planName: plan.planName,
        planDescription: plan.planDescription || null,
        monthlyPrice: plan.monthlyPriceUsd,
        yearlyPrice: plan.yearlyPriceUsd || '0.00',
        storageLimit:
          plan.storageLimitGb === -1
            ? 'Unlimited'
            : `${plan.storageLimitGb} GB`,
        storageLimitGb: plan.storageLimitGb,
        maxFileSize: plan.maxFileSizeMb 
          ? `${(plan.maxFileSizeMb / 1024).toFixed(0)} GB`
          : '2 GB',
        maxFileSizeMb: plan.maxFileSizeMb || 2048,
        highlightFeatures: (plan.highlightFeatures as string[]) || [],
        featureDescriptions:
          (plan.featureDescriptions as Record<string, string>) || {},
        isPopular: plan.isPopular || false,
      }));

      return {
        success: true,
        data: planData,
      };
    } catch (error) {
      console.error('Error getting all plans:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private static getUpgradeOptions(currentPlan: string): string[] {
    switch (currentPlan) {
      case 'free':
        return ['pro', 'business'];
      case 'pro':
        return ['business'];
      case 'business':
        return [];
      default:
        return [];
    }
  }

  private static async handleUpgradeEvent(data: any): Promise<void> {
    console.log(
      `⬆️ UPGRADE_EVENT: User ${data.userId} upgraded from ${data.fromPlan} to ${data.toPlan}`
    );
    // Add any upgrade-specific logic here (e.g., unlock features, send welcome email)
  }

  private static async handleDowngradeEvent(data: any): Promise<void> {
    console.log(
      `⬇️ DOWNGRADE_EVENT: User ${data.userId} downgraded from ${data.fromPlan} to ${data.toPlan}`
    );
    // Add any downgrade-specific logic here (e.g., restrict features, send retention email)
  }

  private static async handleCancelEvent(data: any): Promise<void> {
    console.log(
      `❌ CANCEL_EVENT: User ${data.userId} canceled subscription (${data.fromPlan} -> ${data.toPlan})`
    );
    // Add any cancellation-specific logic here (e.g., schedule data retention, send exit survey)
  }

  private static async handleReactivateEvent(data: any): Promise<void> {
    console.log(
      `🔄 REACTIVATE_EVENT: User ${data.userId} reactivated subscription (${data.fromPlan} -> ${data.toPlan})`
    );
    // Add any reactivation-specific logic here (e.g., restore features, send welcome back email)
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if current user is subscribed
 */
export async function isUserSubscribed(): Promise<boolean> {
  const result = await ClerkBillingIntegrationService.getCurrentUserPlan();
  return result.success && result.data.currentPlan !== 'free';
}

/**
 * Quick check if current user has a specific feature
 */
export async function hasFeature(feature: string): Promise<boolean> {
  return ClerkBillingIntegrationService.hasFeatureAccess(feature);
}

/**
 * Get user's current plan (simplified)
 */
export async function getCurrentPlan(): Promise<'free' | 'pro' | 'business'> {
  const result = await ClerkBillingIntegrationService.getCurrentUserPlan();
  return result.success ? result.data.currentPlan : 'free';
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ClerkBillingIntegrationService;
