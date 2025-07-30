import { db } from '@/lib/database/connection';
import { subscriptionPlans } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { PLAN_CONFIGURATION } from '@/lib/config/plan-configuration';

export interface PlanLimits {
  storageLimitGb: number;
  maxFileSizeMb: number;
  maxFileSize: number; // in bytes
  storageLimit: number; // in bytes
}

/**
 * Get plan limits from database
 * This is the source of truth for plan-based limits
 */
export async function getPlanLimits(planKey: string): Promise<DatabaseResult<PlanLimits>> {
  try {
    const plan = await db
      .select({
        storageLimitGb: subscriptionPlans.storageLimitGb,
        maxFileSizeMb: subscriptionPlans.maxFileSizeMb,
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planKey, planKey))
      .limit(1);

    if (!plan.length) {
      // Use centralized configuration as fallback
      const configPlan = PLAN_CONFIGURATION.plans[planKey as keyof typeof PLAN_CONFIGURATION.plans] 
        || PLAN_CONFIGURATION.plans.free;
      
      return {
        success: true,
        data: {
          storageLimitGb: configPlan.storage_limit_gb,
          maxFileSizeMb: configPlan.max_file_size_mb,
          maxFileSize: configPlan.max_file_size_mb * 1024 * 1024,
          storageLimit: configPlan.storage_limit_gb * 1024 * 1024 * 1024,
        }
      };
    }

    const limits = plan[0];
    return {
      success: true,
      data: {
        storageLimitGb: limits.storageLimitGb,
        maxFileSizeMb: limits.maxFileSizeMb || 2048, // Default 2GB if null
        maxFileSize: (limits.maxFileSizeMb || 2048) * 1024 * 1024,
        storageLimit: limits.storageLimitGb === -1 
          ? Number.MAX_SAFE_INTEGER 
          : limits.storageLimitGb * 1024 * 1024 * 1024,
      }
    };
  } catch (error) {
    console.error('Failed to get plan limits:', error);
    return {
      success: false,
      error: 'Failed to fetch plan limits'
    };
  }
}

/**
 * Get all plan limits for comparison
 */
export async function getAllPlanLimits(): Promise<DatabaseResult<Record<string, PlanLimits>>> {
  try {
    const plans = await db
      .select({
        planKey: subscriptionPlans.planKey,
        storageLimitGb: subscriptionPlans.storageLimitGb,
        maxFileSizeMb: subscriptionPlans.maxFileSizeMb,
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));

    const limitsMap: Record<string, PlanLimits> = {};
    
    for (const plan of plans) {
      limitsMap[plan.planKey] = {
        storageLimitGb: plan.storageLimitGb,
        maxFileSizeMb: plan.maxFileSizeMb || 2048,
        maxFileSize: (plan.maxFileSizeMb || 2048) * 1024 * 1024,
        storageLimit: plan.storageLimitGb === -1 
          ? Number.MAX_SAFE_INTEGER 
          : plan.storageLimitGb * 1024 * 1024 * 1024,
      };
    }

    return {
      success: true,
      data: limitsMap
    };
  } catch (error) {
    console.error('Failed to get all plan limits:', error);
    return {
      success: false,
      error: 'Failed to fetch plan limits'
    };
  }
}