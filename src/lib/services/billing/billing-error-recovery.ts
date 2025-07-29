// =============================================================================
// BILLING ERROR RECOVERY SERVICE - Robust Fallback Mechanisms
// =============================================================================
// 🎯 Comprehensive error handling and recovery for Clerk billing integration

import { ClerkBillingIntegrationService } from './clerk-billing-integration';
import type { PlanUIMetadata } from '@/lib/database/schemas';
import type { DatabaseResult } from '@/lib/database/types';

// =============================================================================
// TYPES
// =============================================================================

export interface BillingErrorContext {
  operation: string;
  userId?: string;
  planKey?: string;
  error: Error;
  timestamp: Date;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface FallbackPlanData {
  currentPlan: 'free' | 'pro' | 'business';
  uiMetadata: PlanUIMetadata;
  isSubscribed: boolean;
  hasFeatureAccess: (feature: string) => boolean;
  storageLimit: number;
  source: 'clerk' | 'fallback' | 'cache';
  reliability: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelayMs: number;
  enableFallbacks: boolean;
  cacheTimeoutMs: number;
  logErrors: boolean;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class BillingErrorRecoveryService {
  private static config: ErrorRecoveryConfig = {
    maxRetries: 3,
    retryDelayMs: 1000,
    enableFallbacks: true,
    cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
    logErrors: true,
  };

  private static cache = new Map<string, { data: any; timestamp: Date }>();

  /**
   * Get user plan data with comprehensive error recovery
   */
  static async getUserPlanDataWithFallback(
    userId?: string
  ): Promise<DatabaseResult<FallbackPlanData>> {
    const cacheKey = `plan_data_${userId || 'current'}`;

    try {
      // Try primary source (Clerk integration)
      const primaryResult = await this.withRetry(
        async () => ClerkBillingIntegrationService.getIntegratedPlanData(),
        'getIntegratedPlanData',
        userId
      );

      if (primaryResult.success) {
        const data = primaryResult.data;
        const fallbackData: FallbackPlanData = {
          currentPlan: data.clerkPlan.currentPlan,
          uiMetadata: data.uiMetadata,
          isSubscribed: data.isSubscribed,
          hasFeatureAccess: data.hasFeatureAccess,
          storageLimit: data.storageLimit,
          source: 'clerk',
          reliability: 'high',
          lastUpdated: new Date(),
        };

        // Cache successful result
        this.setCache(cacheKey, fallbackData);
        return { success: true, data: fallbackData };
      }

      throw new Error(primaryResult.error);
    } catch (error) {
      console.warn(
        'Primary plan data source failed, attempting fallback...',
        error
      );
      return this.getFallbackPlanData(userId, cacheKey, error as Error);
    }
  }

  /**
   * Check feature access with fallback mechanisms
   */
  static async hasFeatureAccessWithFallback(
    feature: string,
    userId?: string
  ): Promise<boolean> {
    const cacheKey = `feature_${feature}_${userId || 'current'}`;

    try {
      // Try Clerk first
      const hasAccess = await this.withRetry(
        async () =>
          ClerkBillingIntegrationService.hasFeatureAccess(feature, userId),
        'hasFeatureAccess',
        userId
      );

      // Cache successful result
      this.setCache(cacheKey, hasAccess);
      return hasAccess;
    } catch (error) {
      console.warn(
        `Feature access check failed for ${feature}, using fallback...`,
        error
      );

      // Try cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log(`Using cached feature access for ${feature}`);
        return cached as boolean;
      }

      // Ultimate fallback: conservative approach based on plan hierarchy
      return this.getFallbackFeatureAccess(feature, userId);
    }
  }

  /**
   * Get current plan with fallback mechanisms
   */
  static async getCurrentPlanWithFallback(
    userId?: string
  ): Promise<'free' | 'pro' | 'business'> {
    const cacheKey = `current_plan_${userId || 'current'}`;

    try {
      const result = await this.withRetry(
        async () => ClerkBillingIntegrationService.getCurrentUserPlan(),
        'getCurrentUserPlan',
        userId
      );

      if (result.success) {
        const plan = result.data.currentPlan;
        this.setCache(cacheKey, plan);
        return plan;
      }

      throw new Error(result.error);
    } catch (error) {
      console.warn('Current plan check failed, using fallback...', error);

      // Try cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('Using cached current plan');
        return cached as 'free' | 'pro' | 'business';
      }

      // Ultimate fallback: assume free plan for safety
      console.warn('No cached plan data available, defaulting to free plan');
      return 'free';
    }
  }

  /**
   * Record error for monitoring and debugging
   */
  static recordError(context: BillingErrorContext): void {
    if (!this.config.logErrors) return;

    const errorInfo = {
      operation: context.operation,
      userId: context.userId || 'unknown',
      planKey: context.planKey,
      error: {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      },
      timestamp: context.timestamp.toISOString(),
      retryCount: context.retryCount,
      metadata: context.metadata,
    };

    console.error('🚨 BILLING_ERROR_RECORDED:', errorInfo);

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or DataDog
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(context.error, { extra: errorInfo });
    }
  }

  /**
   * Health check for billing system
   */
  static async healthCheck(): Promise<{
    clerk: 'healthy' | 'degraded' | 'failed';
    database: 'healthy' | 'degraded' | 'failed';
    cache: 'healthy' | 'degraded' | 'failed';
    overall: 'healthy' | 'degraded' | 'failed';
  }> {
    const results: {
      clerk: 'healthy' | 'degraded' | 'failed';
      database: 'healthy' | 'degraded' | 'failed';
      cache: 'healthy' | 'degraded' | 'failed';
      overall: 'healthy' | 'degraded' | 'failed';
    } = {
      clerk: 'failed',
      database: 'failed',
      cache: 'healthy',
      overall: 'failed',
    };

    // Test Clerk integration
    try {
      const clerkResult =
        await ClerkBillingIntegrationService.getCurrentUserPlan();
      results.clerk = clerkResult.success ? 'healthy' : 'degraded';
    } catch (error) {
      console.error('Clerk health check failed:', error);
      results.clerk = 'failed';
    }

    // Test database connection
    try {
      const planResult =
        await ClerkBillingIntegrationService.getPlanUIMetadata('free');
      results.database = planResult.success ? 'healthy' : 'degraded';
    } catch (error) {
      console.error('Database health check failed:', error);
      results.database = 'failed';
    }

    // Cache is always healthy (in-memory)
    results.cache = 'healthy';

    // Overall health
    if (results.clerk === 'healthy' && results.database === 'healthy') {
      results.overall = 'healthy';
    } else if (results.clerk !== 'failed' || results.database !== 'failed') {
      results.overall = 'degraded';
    } else {
      results.overall = 'failed';
    }

    return results;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('📋 Billing cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([, value]) => value.timestamp);

    return {
      size: this.cache.size,
      keys: entries.map(([key]) => key),
      oldestEntry:
        timestamps.length > 0
          ? new Date(Math.min(...timestamps.map(t => t.getTime())))
          : null,
      newestEntry:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map(t => t.getTime())))
          : null,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    userId?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Record error context
        this.recordError({
          operation: operationName,
          userId: userId || '',
          error: lastError,
          timestamp: new Date(),
          retryCount: attempt + 1,
        });

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private static async getFallbackPlanData(
    userId?: string,
    cacheKey?: string,
    error?: Error
  ): Promise<DatabaseResult<FallbackPlanData>> {
    // Try cache first
    if (cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('Using cached plan data as fallback');
        return { success: true, data: cached as FallbackPlanData };
      }
    }

    // Try database-only fallback
    try {
      const freePlanResult =
        await ClerkBillingIntegrationService.getPlanUIMetadata('free');

      if (!freePlanResult.success) {
        throw new Error(freePlanResult.error);
      }

      const fallbackData: FallbackPlanData = {
        currentPlan: 'free',
        uiMetadata: freePlanResult.data,
        isSubscribed: false,
        hasFeatureAccess: (feature: string) => {
          // Conservative fallback: only basic features for free plan
          const freeFeatures = ['basic_sharing', 'limited_storage'];
          return freeFeatures.includes(feature);
        },
        storageLimit: 50 * 1024 * 1024 * 1024, // 50GB in bytes
        source: 'fallback',
        reliability: 'low',
        lastUpdated: new Date(),
      };

      return { success: true, data: fallbackData };
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError);

      // Absolute fallback with hardcoded values
      const emergencyFallback: FallbackPlanData = {
        currentPlan: 'free',
        uiMetadata: {
          planKey: 'free',
          planName: 'Free',
          planDescription: 'Basic plan with limited features',
          monthlyPrice: '0.00',
          yearlyPrice: '0.00',
          storageLimit: '50 GB',
          storageLimitGb: 50,
          highlightFeatures: ['Basic sharing', 'Limited storage'],
          featureDescriptions: {
            basic_sharing: 'Create and share simple file links',
            limited_storage: '50GB of storage space',
          },
          isPopular: false,
        },
        isSubscribed: false,
        hasFeatureAccess: () => false, // Ultra-conservative
        storageLimit: 50 * 1024 * 1024 * 1024,
        source: 'fallback',
        reliability: 'low',
        lastUpdated: new Date(),
      };

      return { success: true, data: emergencyFallback };
    }
  }

  private static async getFallbackFeatureAccess(
    feature: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Try to get current plan using fallback mechanisms
      const currentPlan = await this.getCurrentPlanWithFallback(userId);

      // Conservative feature mapping based on plan hierarchy
      const featureMap: Record<string, string[]> = {
        free: ['basic_sharing', 'limited_storage'],
        pro: [
          'basic_sharing',
          'limited_storage',
          'custom_branding',
          'password_protection',
          'extended_storage',
        ],
        business: [
          'basic_sharing',
          'limited_storage',
          'custom_branding',
          'password_protection',
          'extended_storage',
          'unlimited_storage',
          'advanced_branding',
          'priority_support',
        ],
      };

      const planFeatures = featureMap[currentPlan] || featureMap.free || [];
      return planFeatures.includes(feature);
    } catch (error) {
      console.error('Fallback feature access check failed:', error);
      // Ultra-conservative: deny access if we can't determine anything
      return false;
    }
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });

    // Clean up old cache entries
    this.cleanupCache();
  }

  private static getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid
    const age = Date.now() - entry.timestamp.getTime();
    if (age > this.config.cacheTimeoutMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private static cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp.getTime();
      if (age > this.config.cacheTimeoutMs) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default BillingErrorRecoveryService;
