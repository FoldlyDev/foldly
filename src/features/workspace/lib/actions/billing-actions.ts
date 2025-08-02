'use server';

import { auth } from '@clerk/nextjs/server';
import { billing } from '@/features/billing/lib/services';
import type { PlanType } from '@/features/billing/lib/feature-registry';
import { logger } from '@/lib/services/logging/logger';

// =============================================================================
// BILLING SERVER ACTIONS
// =============================================================================

interface BillingActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get current user plan
 * Server action to safely access billing service from client components
 */
export async function getCurrentPlanAction(): Promise<BillingActionResult<PlanType>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { 
        success: true, 
        data: 'free' // Return free plan for unauthenticated users
      };
    }

    const plan = await billing.getCurrentPlan();

    return {
      success: true,
      data: plan,
    };
  } catch (error) {
    logger.error('Failed to get current plan', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current plan',
    };
  }
}

/**
 * Check if user has a specific feature
 * Server action to check feature access
 */
export async function hasFeatureAction(feature: string): Promise<BillingActionResult<boolean>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { 
        success: true, 
        data: false // No features for unauthenticated users
      };
    }

    const hasFeature = await billing.hasFeature(feature);

    return {
      success: true,
      data: hasFeature,
    };
  } catch (error) {
    logger.error('Failed to check feature access', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check feature access',
      data: false,
    };
  }
}