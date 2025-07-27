// =============================================================================
// BILLING ANALYTICS SERVICE - Real Database Queries for User Billing Data
// =============================================================================
// 🎯 Service layer for billing analytics with Drizzle ORM integration

import { eq, sql, sum, count } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { 
  links, 
  files, 
  batches, 
  workspaces,
  subscriptionPlans 
} from '@/lib/database/schemas';
import { calculateUserStorageUsage } from '@/lib/services/storage/storage-tracking-service';
import { ClerkBillingIntegrationService } from './clerk-billing-integration';

// =============================================================================
// TYPES
// =============================================================================

export interface UserBillingData {
  // Storage data
  storageUsed: number;
  storageLimit: number;
  storageUsedGB: number;
  
  // File statistics
  filesUploaded: number;
  totalFileSize: number;
  
  // Link statistics
  linksCreated: number;
  activeLinks: number;
  totalUploads: number;
  
  // Usage statistics
  totalBatches: number;
  successfulBatches: number;
  totalDownloads: number;
  
  // Time-based metrics
  accountCreated: Date;
  lastActivity: Date;
  daysActive: number;
  subscriptionStartDate: Date;
  
  // Current plan data (simplified)
  currentPlan: 'free' | 'pro' | 'business';
  planFeatures: {
    highlightFeatures: string[];
    featureDescriptions: Record<string, string>;
    totalFeatures: number;
  };
}

export interface BillingOverviewData {
  currentPlan: string;
  storageUsed: number;
  storageLimit: string;
  featuresActive: number;
  daysRemaining: number | null;
  monthlySpend: number;
  planData: any;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class BillingAnalyticsService {
  /**
   * Get comprehensive billing data for a user
   */
  static async getUserBillingData(userId: string): Promise<UserBillingData> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }

      // Get real-time storage usage and plan details with error handling
      const [planDataResult, storageUsage] = await Promise.allSettled([
        ClerkBillingIntegrationService.getIntegratedPlanData(),
        calculateUserStorageUsage(userId)
      ]);

      const planData = planDataResult.status === 'fulfilled' && planDataResult.value.success
        ? planDataResult.value.data
        : {
            clerkPlan: {
              currentPlan: 'free',
              hasActiveBilling: false,
              subscriptionStatus: null,
              planFeatures: ['basic_sharing', 'limited_storage'],
              metadata: {},
            },
            uiMetadata: {
              planKey: 'free',
              planName: 'Free',
              planDescription: null,
              monthlyPrice: '0.00',
              yearlyPrice: '0.00',
              storageLimit: '50 GB',
              storageLimitGb: 50,
              highlightFeatures: ['File sharing', 'Basic storage'],
              featureDescriptions: {
                'basic_sharing': 'Simple file sharing links',
                'limited_storage': '50GB storage space'
              },
              isPopular: false,
            },
            hasFeatureAccess: (feature: string) => ['basic_sharing', 'limited_storage'].includes(feature),
            storageLimit: 50 * 1024 * 1024 * 1024,
            storageUsed: 0,
            isSubscribed: false,
            canUpgrade: true,
            upgradeOptions: ['pro', 'business'],
          };

      const actualStorageUsage = storageUsage.status === 'fulfilled' 
        ? storageUsage.value 
        : 0;
      
      // For user creation date, we'll need to get it from a different source
      // since we're removing users table dependency
      const accountCreated = new Date(); // Placeholder - get from Clerk or user creation tracking

      // Get workspace for the user
      const workspaceResult = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .limit(1);

      const workspaceId = workspaceResult[0]?.id;

      // Get link statistics
      const linkStats = await db
        .select({
          totalLinks: count(links.id),
          activeLinks: sql<number>`COUNT(CASE WHEN ${links.isActive} = true THEN 1 END)`,
        })
        .from(links)
        .where(eq(links.userId, userId));

      // Get file statistics (using new file schema)
      const fileStats = await db
        .select({
          totalFileSize: sum(files.fileSize),
          fileCount: count(files.id),
        })
        .from(files)
        .where(eq(files.userId, userId));

      // Get batch statistics
      const batchStats = await db
        .select({
          totalBatches: count(batches.id),
          successfulBatches: sql<number>`COUNT(CASE WHEN ${batches.status} = 'completed' THEN 1 END)`,
        })
        .from(batches)
        .where(eq(batches.userId, userId));

      // Get upload statistics from links
      const uploadStats = await db
        .select({
          totalUploads: sum(links.totalUploads),
          totalDownloads: sql<number>`0`, // No download tracking in current schema
          lastActivity: sql<Date>`MAX(${links.lastUploadAt})`,
        })
        .from(links)
        .where(eq(links.userId, userId));

      // Calculate derived metrics
      const storageLimitStr = planData.uiMetadata.storageLimit;
      const storageLimit = storageLimitStr === 'Unlimited' ? Infinity : 
        parseInt(storageLimitStr.replace(' GB', '')) * 1024 * 1024 * 1024;
      const storageUsedGB = Math.round(actualStorageUsage / (1024 ** 3));
      const daysActive = Math.floor(
        (Date.now() - accountCreated.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        // Storage data (using real-time calculation)
        storageUsed: actualStorageUsage,
        storageLimit: storageLimit,
        storageUsedGB,
        
        // File statistics
        filesUploaded: Number(fileStats[0]?.fileCount) || 0,
        totalFileSize: Number(fileStats[0]?.totalFileSize) || 0,
        
        // Link statistics
        linksCreated: Number(linkStats[0]?.totalLinks) || 0,
        activeLinks: Number(linkStats[0]?.activeLinks) || 0,
        totalUploads: Number(uploadStats[0]?.totalUploads) || 0,
        
        // Usage statistics
        totalBatches: Number(batchStats[0]?.totalBatches) || 0,
        successfulBatches: Number(batchStats[0]?.successfulBatches) || 0,
        totalDownloads: Number(uploadStats[0]?.totalDownloads) || 0,
        
        // Time-based metrics
        accountCreated: accountCreated,
        lastActivity: uploadStats[0]?.lastActivity || accountCreated,
        daysActive,
        subscriptionStartDate: accountCreated, // For now, use account creation date
        
        // Current plan data (simplified)
        currentPlan: planData.clerkPlan.currentPlan as 'free' | 'pro' | 'business',
        planFeatures: {
          highlightFeatures: planData.uiMetadata?.highlightFeatures || [],
          featureDescriptions: planData.uiMetadata?.featureDescriptions || {},
          totalFeatures: Math.max(
            (planData.uiMetadata?.highlightFeatures?.length || 0),
            Object.keys(planData.uiMetadata?.featureDescriptions || {}).length
          ),
        },
      };
    } catch (error) {
      console.error('Error fetching user billing data:', error);
      throw new Error('Failed to fetch billing analytics data');
    }
  }

  /**
   * Get storage usage statistics for a user
   */
  static async getStorageUsage(userId: string, currentPlan: string = 'free'): Promise<{
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
    formattedUsed: string;
    formattedLimit: string;
  }> {
    try {
      // Use real-time storage calculation and plan details
      const [storageUsed, planDataResult] = await Promise.all([
        calculateUserStorageUsage(userId),
        ClerkBillingIntegrationService.getIntegratedPlanData()
      ]);

      if (!planDataResult.success) {
        throw new Error(planDataResult.error || 'Failed to get plan data');
      }

      const planData = planDataResult.data;

      // Parse storage limit from UI metadata
      const storageLimitStr = planData.uiMetadata.storageLimit;
      const actualLimit = storageLimitStr === 'Unlimited' ? Infinity : 
        parseInt(storageLimitStr.replace(' GB', '')) * 1024 ** 3; // Convert GB to bytes
      const percentage = actualLimit === Infinity ? 0 : Math.round((storageUsed / actualLimit) * 100);
      
      return {
        used: storageUsed,
        limit: actualLimit,
        percentage: Math.min(percentage, 100),
        isNearLimit: percentage > 80,
        isOverLimit: percentage > 100,
        formattedUsed: this.formatBytes(storageUsed),
        formattedLimit: actualLimit === Infinity ? 'Unlimited' : this.formatBytes(actualLimit),
      };
    } catch (error) {
      console.error('Error fetching storage usage:', error);
      throw new Error('Failed to fetch storage usage data');
    }
  }

  /**
   * Get billing overview data for dashboard cards
   */
  static async getBillingOverview(userId: string, currentPlan: string = 'free'): Promise<BillingOverviewData> {
    try {
      const [billingData, storageUsage, planData] = await Promise.all([
        this.getUserBillingData(userId),
        this.getStorageUsage(userId, currentPlan),
        db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.planKey, currentPlan))
          .limit(1),
      ]);

      const plan = planData[0];
      
      // Calculate features active from highlight features (simplified approach)
      const featuresActive = plan ? 
        (plan.highlightFeatures as string[])?.length || 0 : 0;
      
      const monthlySpend = plan ? parseFloat(plan.monthlyPriceUsd) : 0;

      return {
        currentPlan: plan?.planName || 'Free',
        storageUsed: billingData.storageUsed,
        storageLimit: `${plan?.storageLimitGb || 50}GB`, // Use real database value
        featuresActive,
        daysRemaining: null, // Will be calculated based on subscription expiry
        monthlySpend,
        planData: plan,
      };
    } catch (error) {
      console.error('Error fetching billing overview:', error);
      throw new Error('Failed to fetch billing overview data');
    }
  }

  /**
   * Get user usage statistics for analytics
   */
  static async getUserUsageStats(userId: string): Promise<{
    uploadsByMonth: Array<{ month: string; uploads: number }>;
    storageGrowth: Array<{ date: string; storage: number }>;
    linkActivity: Array<{ date: string; active: number; total: number }>;
    topFileTypes: Array<{ type: string; count: number; size: number }>;
  }> {
    try {
      // Get workspace for file queries
      const workspaceResult = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .limit(1);

      const workspaceId = workspaceResult[0]?.id;

      // For now, return empty arrays - these would require more complex queries
      // and potentially additional tracking tables for historical data
      return {
        uploadsByMonth: [],
        storageGrowth: [],
        linkActivity: [],
        topFileTypes: [],
      };
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw new Error('Failed to fetch usage statistics');
    }
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    if (bytes === Infinity) return 'Unlimited';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get billing metrics for admin dashboard
   */
  static async getSystemBillingMetrics(): Promise<{
    totalUsers: number;
    totalStorageUsed: number;
    totalRevenue: number;
    planDistribution: Array<{ plan: string; count: number }>;
  }> {
    try {
      // Get total storage used from files table (real-time calculation)
      const totalStorageResult = await db
        .select({ total: sum(files.fileSize) })
        .from(files);

      // Get unique user count from workspaces (since we removed users table dependency)
      const totalUsersResult = await db
        .select({ count: count(workspaces.userId) })
        .from(workspaces);

      // Get plan distribution (this would require user subscription tracking with Clerk)
      const planDistribution = [
        { plan: 'Free', count: 0 },
        { plan: 'Pro', count: 0 },
        { plan: 'Business', count: 0 },
      ];

      return {
        totalUsers: Number(totalUsersResult[0]?.count) || 0,
        totalStorageUsed: Number(totalStorageResult[0]?.total) || 0,
        totalRevenue: 0, // Would require subscription tracking with Clerk billing
        planDistribution,
      };
    } catch (error) {
      console.error('Error fetching system billing metrics:', error);
      throw new Error('Failed to fetch system billing metrics');
    }
  }

  /**
   * Get comprehensive billing data with real-time storage calculation
   * Integrates with the new billing-clerk integration layer
   */
  static async getBillingDataWithIntegration(userId: string): Promise<{
    billingData: UserBillingData;
    storageStatus: {
      used: number;
      limit: number;
      percentage: number;
      isNearLimit: boolean;
      isOverLimit: boolean;
      formattedUsed: string;
      formattedLimit: string;
    };
    planConfig: any;
  }> {
    try {
      const [billingData, storageData, planDataResult] = await Promise.all([
        this.getUserBillingData(userId),
        this.getStorageUsage(userId),
        ClerkBillingIntegrationService.getIntegratedPlanData()
      ]);

      if (!planDataResult.success) {
        throw new Error(planDataResult.error || 'Failed to get plan data');
      }

      const planData = planDataResult.data;

      return {
        billingData,
        storageStatus: storageData,
        planConfig: planData.uiMetadata,
      };
    } catch (error) {
      console.error('Error fetching comprehensive billing data:', error);
      throw new Error('Failed to fetch billing data with integration');
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default BillingAnalyticsService;