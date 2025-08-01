'use server';

import { db } from '@/lib/database/connection';
import { users, subscriptionPlans } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { ActionResult } from '@/types/actions';

interface CheckStorageParams {
  userId: string;
  requiredSpace: number;
}

interface StorageCheckResult {
  hasSpace: boolean;
  currentUsage: number;
  storageLimit: number;
  availableSpace: number;
}

export async function checkStorageAvailableAction({
  userId,
  requiredSpace,
}: CheckStorageParams): Promise<ActionResult<StorageCheckResult>> {
  try {
    // Get user's current storage usage
    const userResult = await db
      .select({
        storage_used: users.storage_used,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const currentUsage = userResult[0].storage_used;

    // Get user's storage limit from subscription
    // TODO: Integrate with actual subscription system
    const planResult = await db
      .select({
        storage_limit_gb: subscriptionPlans.storage_limit_gb,
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.plan_key, 'free'))
      .limit(1);

    const storageLimit = planResult[0]?.storage_limit_gb || 50;
    const storageLimitBytes = storageLimit * 1024 * 1024 * 1024;
    const availableSpace = storageLimitBytes - currentUsage;
    const hasSpace = availableSpace >= requiredSpace;

    return {
      success: true,
      data: {
        hasSpace,
        currentUsage,
        storageLimit: storageLimitBytes,
        availableSpace,
      },
    };
  } catch (error) {
    console.error('Error checking storage availability:', error);
    return {
      success: false,
      error: 'Failed to check storage availability',
    };
  }
}