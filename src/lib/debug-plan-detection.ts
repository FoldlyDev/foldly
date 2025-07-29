// =============================================================================
// DEBUG PLAN DETECTION - Utilities for Testing Billing Integration
// =============================================================================
// 🎯 Debug utilities for testing the billing plan detection system

import { auth } from '@clerk/nextjs/server';
import { billing } from '@/lib/services/billing';

// =============================================================================
// TYPES
// =============================================================================

export interface PlanDetectionDebugInfo {
  clerkAuthStatus: {
    isAuthenticated: boolean;
    userId: string | null;
    hasHasMethod: boolean;
    authError: string | null;
  };
  planDetection: {
    detectedPlan: 'free' | 'pro' | 'business';
    planFeatures: string[];
    planDetectionError: string | null;
    metadata: Record<string, any>;
  };
  recommendations: string[];
}

export interface ProPlanCheckResult {
  isPro: boolean;
  planType: 'free' | 'pro' | 'business';
  hasActiveSubscription: boolean;
  error: string | null;
}

// =============================================================================
// DEBUG FUNCTIONS
// =============================================================================

/**
 * Comprehensive debug information for plan detection
 */
export async function debugPlanDetection(): Promise<PlanDetectionDebugInfo> {
  const debugInfo: PlanDetectionDebugInfo = {
    clerkAuthStatus: {
      isAuthenticated: false,
      userId: null,
      hasHasMethod: false,
      authError: null,
    },
    planDetection: {
      detectedPlan: 'free',
      planFeatures: [],
      planDetectionError: null,
      metadata: {},
    },
    recommendations: [],
  };

  try {
    // Test Clerk authentication
    const { userId, has } = await auth();

    debugInfo.clerkAuthStatus = {
      isAuthenticated: !!userId,
      userId: userId || null,
      hasHasMethod: typeof has === 'function',
      authError: null,
    };

    if (!userId) {
      debugInfo.recommendations.push(
        'User is not authenticated - sign in required'
      );
      return debugInfo;
    }

    if (!has) {
      debugInfo.recommendations.push(
        'Clerk has() method not available - check Clerk configuration'
      );
      return debugInfo;
    }

    // Test plan detection using new billing service
    const planResult = await billing.getCurrentPlan();
    const integratedDataResult =
      await billing.integration.getIntegratedPlanData();

    if (integratedDataResult.success) {
      const data = integratedDataResult.data;
      debugInfo.planDetection = {
        detectedPlan: data.clerkPlan.currentPlan,
        planFeatures: data.clerkPlan.planFeatures,
        planDetectionError: null,
        metadata: {
          hasActiveBilling: data.clerkPlan.hasActiveBilling,
          subscriptionStatus: data.clerkPlan.subscriptionStatus,
          storageLimit: data.storageLimit,
          isSubscribed: data.isSubscribed,
          canUpgrade: data.canUpgrade,
          upgradeOptions: data.upgradeOptions,
        },
      };

      // Add recommendations based on plan status
      if (data.clerkPlan.currentPlan === 'free') {
        debugInfo.recommendations.push(
          'User is on free plan - consider upgrade options'
        );
      } else {
        debugInfo.recommendations.push(
          `User is on ${data.clerkPlan.currentPlan} plan - billing integration working correctly`
        );
      }

      if (
        !data.clerkPlan.hasActiveBilling &&
        data.clerkPlan.currentPlan !== 'free'
      ) {
        debugInfo.recommendations.push(
          'Plan detected but no active billing found - check Clerk billing configuration'
        );
      }
    } else {
      debugInfo.planDetection.planDetectionError =
        integratedDataResult.error || 'Unknown error getting plan data';
      debugInfo.recommendations.push(
        'Plan detection failed - check billing service configuration'
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    debugInfo.clerkAuthStatus.authError = errorMessage;
    debugInfo.planDetection.planDetectionError = errorMessage;
    debugInfo.recommendations.push(`Critical error: ${errorMessage}`);
  }

  return debugInfo;
}

/**
 * Quick check if user is on Pro plan
 */
export async function isUserOnProPlan(): Promise<ProPlanCheckResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        isPro: false,
        planType: 'free',
        hasActiveSubscription: false,
        error: 'User not authenticated',
      };
    }

    const currentPlan = await billing.getCurrentPlan();
    const isSubscribed = await billing.isUserSubscribed();

    return {
      isPro: currentPlan === 'pro',
      planType: currentPlan,
      hasActiveSubscription: isSubscribed,
      error: null,
    };
  } catch (error) {
    return {
      isPro: false,
      planType: 'free',
      hasActiveSubscription: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test feature access for common features
 */
export async function testFeatureAccess(): Promise<Record<string, boolean>> {
  const commonFeatures = [
    'custom_branding',
    'password_protection',
    'analytics',
    'unlimited_storage',
    'priority_support',
    'team_collaboration',
  ];

  const results: Record<string, boolean> = {};

  for (const feature of commonFeatures) {
    try {
      results[feature] = await billing.hasFeature(feature);
    } catch (error) {
      console.error(`Error checking feature ${feature}:`, error);
      results[feature] = false;
    }
  }

  return results;
}

/**
 * Health check for the entire billing system
 */
export async function billingSystemHealthCheck(): Promise<{
  isHealthy: boolean;
  issues: string[];
  services: Record<string, boolean>;
}> {
  const issues: string[] = [];
  const services: Record<string, boolean> = {};

  try {
    // Test Clerk authentication
    const { userId } = await auth();
    services.clerkAuth = !!userId;

    if (!userId) {
      issues.push('Clerk authentication failed');
    }

    // Test billing service
    try {
      await billing.errorRecovery.healthCheck();
      services.billingService = true;
    } catch (error) {
      services.billingService = false;
      issues.push('Billing service health check failed');
    }

    // Test plan detection
    try {
      const plan = await billing.getCurrentPlan();
      services.planDetection = true;
    } catch (error) {
      services.planDetection = false;
      issues.push('Plan detection failed');
    }

    // Test feature access
    try {
      await billing.hasFeature('custom_branding');
      services.featureAccess = true;
    } catch (error) {
      services.featureAccess = false;
      issues.push('Feature access check failed');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      services,
    };
  } catch (error) {
    return {
      isHealthy: false,
      issues: [
        'Critical system error: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      ],
      services,
    };
  }
}
