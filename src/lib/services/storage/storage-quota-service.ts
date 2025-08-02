import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { ClerkBillingIntegrationService } from '@/features/billing/lib/services/clerk-billing-integration';
import { storageBackgroundService } from './storage-background-service';
import { UPLOAD_CONFIG, getFileSizeLimit } from '@/features/workspace/lib/config/upload-config';
import { formatBytes } from './utils';

interface QuotaCheckResult {
  allowed: boolean;
  error?: string | undefined;
  message?: string | undefined;
  storageUsed: number;
  storageLimit: number;
  availableSpace: number;
  usagePercentage: number;
  maxFileSize: number;
  currentFileSize: number;
  securityChecks: {
    rateLimitPassed: boolean;
    planVerified: boolean;
    quotaEnforced: boolean;
  };
}

interface QuotaAuditLog {
  userId: string;
  action: 'quota_check' | 'storage_update';
  fileSize: number;
  result: 'allowed' | 'denied';
  reason?: string;
  planType: string;
  timestamp: Date;
  ip?: string | undefined;
}

export class StorageQuotaService {
  private static uploadAttempts = new Map<string, number[]>();
  private static readonly RATE_LIMIT_WINDOW = UPLOAD_CONFIG.rateLimit.windowDuration;
  private static readonly MAX_UPLOADS_PER_MINUTE = UPLOAD_CONFIG.rateLimit.maxUploadsPerMinute;

  /**
   * Check if user can upload a file based on their storage quota
   * Enterprise-level security with Clerk integration
   */
  async checkUserQuota(
    userId: string,
    fileSize: number,
    clientIp?: string
  ): Promise<DatabaseResult<QuotaCheckResult>> {
    const auditLog: QuotaAuditLog = {
      userId,
      action: 'quota_check',
      fileSize,
      result: 'denied',
      planType: 'unknown',
      timestamp: new Date(),
      ip: clientIp
    };
    try {
      // Rate limiting check
      const rateLimitPassed = this.checkRateLimit(userId);
      if (!rateLimitPassed) {
        auditLog.reason = 'rate_limit_exceeded';
        await this.logQuotaAudit(auditLog);
        return { 
          success: false, 
          error: UPLOAD_CONFIG.messages.errors.rateLimitExceeded 
        };
      }

      // Get user data with proper error handling
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        auditLog.reason = 'user_not_found';
        await this.logQuotaAudit(auditLog);
        return { success: false, error: 'User not found' };
      }

      // Get user's plan from Clerk (source of truth for subscriptions)
      const planDataResult = await ClerkBillingIntegrationService.getIntegratedPlanData();
      
      if (!planDataResult.success) {
        console.error('Failed to get plan data from Clerk:', planDataResult.error);
        // Fail closed - deny upload if we can't verify plan
        return { 
          success: false, 
          error: 'Unable to verify subscription plan' 
        };
      }

      const planData = planDataResult.data!;
      const storageLimit = planData.storageLimit;
      auditLog.planType = planData.clerkPlan.currentPlan;
      
      // Get max file size based on plan from config
      const maxFileSize = getFileSizeLimit(planData.clerkPlan.currentPlan);

      // Additional security check for file size
      if (fileSize < 0 || fileSize > UPLOAD_CONFIG.security.maxTotalFileSize) {
        auditLog.reason = 'invalid_file_size';
        await this.logQuotaAudit(auditLog);
        return { 
          success: false, 
          error: 'Invalid file size' 
        };
      }

      const currentUsage = user[0]!.storageUsed || 0;
      const newUsage = currentUsage + fileSize;
      const remainingSpace = storageLimit - currentUsage;
      const usagePercentage = (currentUsage / storageLimit) * 100;

      // Check if upload is allowed with proper validation
      const allowed = newUsage <= storageLimit && fileSize <= maxFileSize && fileSize > 0;

      let error: string | undefined;
      let message: string | undefined;

      if (!allowed) {
        if (newUsage > storageLimit) {
          error = 'quota_exceeded';
          message = `Storage limit reached. You've used ${formatBytes(currentUsage)} of ${formatBytes(storageLimit)}.`;
          auditLog.reason = 'quota_exceeded';
        } else if (fileSize > maxFileSize) {
          error = 'file_too_large';
          message = `File too large. Maximum file size is ${formatBytes(maxFileSize)}.`;
          auditLog.reason = 'file_too_large';
        } else {
          error = 'invalid_request';
          message = 'Invalid upload request.';
          auditLog.reason = 'invalid_request';
        }
      } else {
        auditLog.result = 'allowed';
      }

      // Log the audit trail
      await this.logQuotaAudit(auditLog);

      return {
        success: true,
        data: {
          allowed,
          error,
          message,
          storageUsed: currentUsage,
          storageLimit,
          availableSpace: remainingSpace,
          usagePercentage,
          maxFileSize,
          currentFileSize: fileSize,
          securityChecks: {
            rateLimitPassed: true,
            planVerified: true,
            quotaEnforced: true
          }
        },
      };
    } catch (error) {
      console.error('Failed to check user quota:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check quota' 
      };
    }
  }

  /**
   * Update user's storage usage after successful upload
   * Uses background service for better performance
   */
  async updateUserStorageUsage(
    userId: string,
    bytesAdded: number,
    useBackground = true
  ): Promise<DatabaseResult<void>> {
    try {
      if (useBackground) {
        // Queue for background processing
        storageBackgroundService.queueStorageUpdate(userId, bytesAdded);
        return { success: true, data: undefined };
      }
      
      // Immediate update (for critical operations)
      await db
        .update(users)
        .set({
          storageUsed: sql`COALESCE(storage_used, 0) + ${bytesAdded}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to update storage usage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update storage usage' 
      };
    }
  }


  /**
   * Check rate limit for upload attempts
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const attempts = StorageQuotaService.uploadAttempts.get(userId) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < StorageQuotaService.RATE_LIMIT_WINDOW
    );
    
    // Check if under the limit
    if (recentAttempts.length >= StorageQuotaService.MAX_UPLOADS_PER_MINUTE) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    StorageQuotaService.uploadAttempts.set(userId, recentAttempts);
    
    return true;
  }

  /**
   * Log quota check audit trail
   */
  private async logQuotaAudit(audit: QuotaAuditLog): Promise<void> {
    try {
      // In production, this would log to a proper audit system
      console.log('📋 QUOTA_AUDIT:', {
        userId: audit.userId,
        action: audit.action,
        fileSize: formatBytes(audit.fileSize),
        result: audit.result,
        reason: audit.reason,
        planType: audit.planType,
        timestamp: audit.timestamp.toISOString(),
        ip: audit.ip || 'unknown'
      });
    } catch (error) {
      console.error('Failed to log quota audit:', error);
    }
  }
}

export const storageQuotaService = new StorageQuotaService();