/**
 * Link Storage Service - Handles storage quota and validation
 */

import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { BillingService } from '@/features/billing/lib/services';

interface StorageCheckResult {
  hasSpace: boolean;
  currentUsage: number;
  storageLimit: number;
  availableSpace: number;
}

export class LinkStorageService {
  /**
   * Check if user has enough storage space available
   */
  async checkStorageAvailable(
    userId: string,
    requiredSpace: number
  ): Promise<DatabaseResult<StorageCheckResult>> {
    try {
      // Get user's current storage usage
      const userResult = await db
        .select({
          storageUsed: users.storageUsed,
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

      const currentUsage = userResult[0]?.storageUsed ?? 0;

      // Get user's storage limit from subscription
      const billingResult = await BillingService.getUserBillingData(userId);
      
      if (!billingResult.success) {
        return {
          success: false,
          error: billingResult.error || 'Failed to get user billing data',
        };
      }

      const storageLimitBytes = billingResult.data.storageLimit;
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
}

// Export singleton instance
export const linkStorageService = new LinkStorageService();