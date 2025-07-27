// =============================================================================
// BILLING DATA HOOKS - Modern React Query Integration (UPDATED 2025)
// =============================================================================
// 🎯 Updated to use modern React Query patterns and real database integration

'use client';

import { useBillingDataQuery, useStorageMonitorQuery } from './react-query/use-billing-data-query';
import { useBillingOverviewQuery } from './react-query/use-billing-overview-query';
import { useClerkSubscription } from './use-clerk-billing';
import { useStorageDashboard } from '@/lib/hooks/use-storage-tracking';
import { useMemo } from 'react';

/**
 * Legacy hook maintained for backward compatibility
 * @deprecated Use useBillingDataQuery instead
 */
export function useBillingData() {
  const { data, isLoading, error, refetch, derivedData } = useBillingDataQuery();

  return {
    data: derivedData ? { ...data, ...derivedData } : data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get storage usage percentage based on subscription tier
 * FIXED: Now uses corrected plan detection
 * @deprecated Use useStorageDashboard from storage-tracking hooks instead
 */
export function useStorageUsage() {
  const { currentPlan } = useClerkSubscription();
  const { data: storageData } = useStorageDashboard(currentPlan || 'free');
  
  return storageData ? {
    used: storageData.storageUsedBytes,
    limit: storageData.storageLimitBytes,
    percentage: storageData.usagePercentage,
    isNearLimit: storageData.usagePercentage > 80,
    isOverLimit: storageData.usagePercentage > 100,
  } : null;
}

/**
 * Hook to get billing statistics for overview cards
 * FIXED: Now uses corrected plan detection
 * @deprecated Use useBillingOverviewQuery and useStorageDashboard instead
 */
export function useBillingStats() {
  const { data: overviewData } = useBillingOverviewQuery();
  const { currentPlan } = useClerkSubscription();
  const { data: storageData } = useStorageDashboard(currentPlan || 'free');

  return useMemo(() => {
    if (!overviewData || !storageData) {
      return {
        storageUsed: 0,
        storageLimit: '50GB', // Default free tier limit
        filesUploaded: 0,
        linksCreated: 0,
        totalUploads: 0,
        daysActive: 0,
        storagePercentage: 0,
      };
    }

    return {
      storageUsed: storageData.storageUsedBytes,
      storageLimit: `${Math.round(storageData.storageLimitBytes / (1024 * 1024 * 1024))}GB`,
      filesUploaded: storageData.filesCount,
      linksCreated: 0, // Would come from links data
      totalUploads: storageData.filesCount, // Same as files uploaded
      daysActive: 0, // Would come from analytics data
      storagePercentage: storageData.usagePercentage,
    };
  }, [overviewData, currentPlan, storageData]);
}