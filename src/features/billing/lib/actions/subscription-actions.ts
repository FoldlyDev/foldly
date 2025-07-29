// =============================================================================
// SUBSCRIPTION SERVER ACTIONS - Next.js App Router Compatible
// =============================================================================
// 🎯 Server actions for billing data that properly separate server/client concerns

'use server';

import { SubscriptionPlansService, billing } from '@/lib/services/billing';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { calculateUserStorageUsage } from '@/lib/services/storage/storage-tracking-service';

// =============================================================================
// SUBSCRIPTION PLAN ACTIONS
// =============================================================================

/**
 * Server action to get all active subscription plans
 */
export async function getActivePlansAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const plans = await SubscriptionPlansService.getActivePlans();
    return { success: true, data: plans };
  } catch (error) {
    console.error('Error fetching active plans:', error);
    return {
      success: false,
      error: 'Failed to fetch subscription plans',
      data: null,
    };
  }
}

/**
 * Server action to get MVP subscription plans
 */
export async function getMvpPlansAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const plans = await SubscriptionPlansService.getMvpPlans();
    return { success: true, data: plans };
  } catch (error) {
    console.error('Error fetching MVP plans:', error);
    return {
      success: false,
      error: 'Failed to fetch subscription plans',
      data: null,
    };
  }
}

/**
 * Server action to get a specific plan by key
 */
export async function getPlanByKeyAction(planKey: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    if (!planKey) {
      return {
        success: false,
        error: 'Plan key is required',
        data: null,
      };
    }

    const plan = await SubscriptionPlansService.getPlanByKey(planKey);
    return { success: true, data: plan };
  } catch (error) {
    console.error(`Error fetching plan ${planKey}:`, error);
    return {
      success: false,
      error: `Failed to fetch plan: ${planKey}`,
      data: null,
    };
  }
}

/**
 * Server action to get plan UI metadata (simplified)
 */
export async function getPlanUIMetadataAction(planKey: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    if (!planKey) {
      return {
        success: false,
        error: 'Plan key is required',
        data: null,
      };
    }

    const metadata = await SubscriptionPlansService.getPlanUIMetadata(planKey);
    return { success: true, data: metadata };
  } catch (error) {
    console.error(`Error fetching UI metadata for plan ${planKey}:`, error);
    return {
      success: false,
      error: `Failed to fetch plan UI metadata: ${planKey}`,
      data: null,
    };
  }
}

// =============================================================================
// CLERK + SUBSCRIPTION PLANS INTEGRATION ACTIONS
// =============================================================================

/**
 * Server action to get user plan details (Clerk + subscription_plans table)
 */
export async function getUserPlanDetailsAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const integratedDataResult =
      await billing.integration.getIntegratedPlanData();
    if (!integratedDataResult.success) {
      return {
        success: false,
        error: integratedDataResult.error,
        data: null,
      };
    }

    return { success: true, data: integratedDataResult.data };
  } catch (error) {
    console.error('Error fetching user plan details:', error);
    return {
      success: false,
      error: 'Failed to fetch user plan details',
      data: null,
    };
  }
}

/**
 * Server action to get current user plan from Clerk
 */
export async function getCurrentUserPlanAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const currentPlanResult = await billing.integration.getCurrentUserPlan();
    if (!currentPlanResult.success) {
      return {
        success: false,
        error: currentPlanResult.error,
        data: null,
      };
    }

    const integratedDataResult =
      await billing.integration.getIntegratedPlanData();
    if (!integratedDataResult.success) {
      return {
        success: false,
        error: integratedDataResult.error,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        currentPlan: currentPlanResult.data.currentPlan,
        planConfig: integratedDataResult.data.uiMetadata,
      },
    };
  } catch (error) {
    console.error('Error fetching current user plan:', error);
    return {
      success: false,
      error: 'Failed to fetch current plan',
      data: null,
    };
  }
}

/**
 * ✅ SIMPLIFIED: Get current user plan configuration using new billing service
 */
export async function getCurrentUserPlanConfigAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const currentPlanResult = await billing.integration.getCurrentUserPlan();
    if (!currentPlanResult.success) {
      return {
        success: false,
        error: currentPlanResult.error,
        data: null,
      };
    }

    const planMetadataResult = await billing.integration.getPlanUIMetadata(
      currentPlanResult.data.currentPlan
    );
    if (!planMetadataResult.success) {
      return {
        success: false,
        error: planMetadataResult.error,
        data: null,
      };
    }

    return {
      success: true,
      data: planMetadataResult.data,
    };
  } catch (error) {
    console.error('Error fetching current user plan config:', error);
    return {
      success: false,
      error: 'Failed to fetch plan configuration',
      data: null,
    };
  }
}

/**
 * Server action to get real-time storage usage
 */
export async function getRealTimeStorageUsageAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    // Get current plan to determine storage limits
    const currentPlanResult = await billing.integration.getCurrentUserPlan();
    if (!currentPlanResult.success) {
      return {
        success: false,
        error: currentPlanResult.error,
        data: null,
      };
    }

    const currentPlan = currentPlanResult.data.currentPlan;

    // Get storage info from storage service
    const { getUserStorageDashboard } = await import(
      '@/lib/services/storage/storage-tracking-service'
    );
    const storageInfo = await getUserStorageDashboard(userId, currentPlan);

    const percentage =
      storageInfo.storageLimitBytes > 0
        ? Math.round(
            (storageInfo.storageUsedBytes / storageInfo.storageLimitBytes) * 100
          )
        : 0;

    return {
      success: true,
      data: {
        storageUsage: storageInfo.storageUsedBytes,
        storageLimit: storageInfo.storageLimitBytes,
        percentage: Math.min(percentage, 100),
        isNearLimit: percentage > 80,
        isOverLimit: percentage > 100,
        filesCount: storageInfo.filesCount,
        remainingBytes: storageInfo.remainingBytes,
        storageInfo,
      },
    };
  } catch (error) {
    console.error('Error fetching real-time storage usage:', error);
    return {
      success: false,
      error: 'Failed to fetch storage usage',
      data: null,
    };
  }
}

// =============================================================================
// USER BILLING DATA ACTIONS
// =============================================================================

/**
 * Server action to get user billing statistics
 * Uses real database queries via BillingAnalyticsService
 */
export async function getUserBillingDataAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const { BillingAnalyticsService } = await import(
      '@/lib/services/billing/billing-analytics-service'
    );
    const billingData =
      await BillingAnalyticsService.getUserBillingData(userId);

    return { success: true, data: billingData };
  } catch (error) {
    console.error('Error fetching user billing data:', error);
    return {
      success: false,
      error: 'Failed to fetch billing data',
      data: null,
    };
  }
}

/**
 * Server action to get billing overview data for dashboard cards
 */
export async function getBillingOverviewAction(currentPlan: string = 'free') {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const { BillingAnalyticsService } = await import(
      '@/lib/services/billing/billing-analytics-service'
    );
    const overviewData = await BillingAnalyticsService.getBillingOverview(
      userId,
      currentPlan
    );

    return { success: true, data: overviewData };
  } catch (error) {
    console.error('Error fetching billing overview:', error);
    return {
      success: false,
      error: 'Failed to fetch billing overview',
      data: null,
    };
  }
}

/**
 * Server action to get storage usage data
 */
export async function getStorageUsageAction(currentPlan: string = 'free') {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const { BillingAnalyticsService } = await import(
      '@/lib/services/billing/billing-analytics-service'
    );
    const storageData = await BillingAnalyticsService.getStorageUsage(
      userId,
      currentPlan
    );

    return { success: true, data: storageData };
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return {
      success: false,
      error: 'Failed to fetch storage usage',
      data: null,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Server action to get simplified billing integration status
 */
export async function getBillingIntegrationStatusAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const integratedDataResult =
      await billing.integration.getIntegratedPlanData();
    if (!integratedDataResult.success) {
      return {
        success: false,
        error: integratedDataResult.error,
        data: null,
      };
    }

    const userData = integratedDataResult.data;
    const { getUserStorageDashboard } = await import(
      '@/lib/services/storage/storage-tracking-service'
    );
    const storageInfo = await getUserStorageDashboard(
      userId,
      userData.clerkPlan.currentPlan
    );

    return {
      success: true,
      data: {
        isHealthy: true,
        clerkConnected: true,
        databaseConnected: true,
        userPlan: userData,
        storageInfo,
        canUpgrade: userData.clerkPlan.currentPlan !== 'business',
      },
    };
  } catch (error) {
    console.error('Error fetching billing integration status:', error);
    return {
      success: false,
      error: 'Failed to fetch billing integration status',
      data: null,
    };
  }
}

/**
 * Server action to sync user plan data (simplified)
 */
export async function syncUserPlanDataAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const integratedDataResult =
      await billing.integration.getIntegratedPlanData();
    if (!integratedDataResult.success) {
      return {
        success: false,
        error: integratedDataResult.error,
        data: null,
      };
    }

    return { success: true, data: integratedDataResult.data };
  } catch (error) {
    console.error('Error syncing user plan data:', error);
    return {
      success: false,
      error: 'Failed to sync plan data',
      data: null,
    };
  }
}

/**
 * Server action to get user storage status (simplified)
 */
export async function getUserStorageStatusAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    // Get current plan to determine storage limits
    const currentPlanResult = await billing.integration.getCurrentUserPlan();
    if (!currentPlanResult.success) {
      return {
        success: false,
        error: currentPlanResult.error,
        data: null,
      };
    }

    const currentPlan = currentPlanResult.data.currentPlan;

    // Get storage info from storage service
    const { getUserStorageDashboard, formatBytes } = await import(
      '@/lib/services/storage/storage-tracking-service'
    );
    const storageInfo = await getUserStorageDashboard(userId, currentPlan);

    const percentage =
      storageInfo.storageLimitBytes > 0
        ? Math.round(
            (storageInfo.storageUsedBytes / storageInfo.storageLimitBytes) * 100
          )
        : 0;

    const isUnlimited = storageInfo.storageLimitBytes === Infinity;

    return {
      success: true,
      data: {
        usage: storageInfo.storageUsedBytes,
        limit: storageInfo.storageLimitBytes,
        limitFormatted: isUnlimited
          ? 'Unlimited'
          : formatBytes(storageInfo.storageLimitBytes),
        percentage: Math.min(percentage, 100),
        isNearLimit: percentage > 80,
        isOverLimit: percentage > 100,
        canUpload: percentage <= 100,
        isUnlimited,
        filesCount: storageInfo.filesCount,
        remainingBytes: storageInfo.remainingBytes,
      },
    };
  } catch (error) {
    console.error('Error fetching user storage status:', error);
    return {
      success: false,
      error: 'Failed to fetch storage status',
      data: null,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  SubscriptionPlan,
  CreatePlanInput,
  UpdatePlanInput,
  ClerkPlanAccess,
  IntegratedPlanData,
  PlanChangeRequest,
} from '@/lib/services/billing';
