// =============================================================================
// COORDINATED BILLING LOADING HOOK - Clerk + React Query Coordination
// =============================================================================
// 🎯 Centralized loading state coordination to prevent UI conflicts and lag

'use client';

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  usePlanConfig,
  useUserStorageStatusQuery,
} from './react-query/use-billing-data-query';

interface CoordinatedLoadingState {
  // Loading states
  isInitializing: boolean;
  isClerkLoading: boolean;
  isDataLoading: boolean;
  isFullyLoaded: boolean;

  // Error states
  hasErrors: boolean;
  errors: Array<{ source: string; message: string }>;

  // Loading phases
  loadingPhase: 'clerk' | 'data' | 'complete' | 'error';
  loadingMessage: string;

  // Ready states for components
  isReadyForOverview: boolean;
  isReadyForPricingTable: boolean;
  isReadyForTabSwitching: boolean;
}

/**
 * Coordinated loading hook that properly sequences Clerk and React Query loading
 * Prevents UI conflicts and ensures smooth tab switching
 */
export function useCoordinatedBillingLoading(): CoordinatedLoadingState {
  const { isLoaded: isClerkLoaded, user } = useUser();
  const {
    data: planConfig,
    isLoading: planLoading,
    error: planError,
  } = usePlanConfig({
    enabled: isClerkLoaded && !!user?.id,
  });
  const {
    data: storageStatus,
    isLoading: storageLoading,
    error: storageError,
  } = useUserStorageStatusQuery({
    enabled: isClerkLoaded && !!user?.id,
  });

  const coordinatedState = useMemo<CoordinatedLoadingState>(() => {
    // Phase 1: Clerk authentication loading
    if (!isClerkLoaded) {
      return {
        isInitializing: true,
        isClerkLoading: true,
        isDataLoading: false,
        isFullyLoaded: false,
        hasErrors: false,
        errors: [],
        loadingPhase: 'clerk',
        loadingMessage: 'Initializing authentication...',
        isReadyForOverview: false,
        isReadyForPricingTable: false,
        isReadyForTabSwitching: false,
      };
    }

    // Phase 2: Data loading (after Clerk is ready)
    const isAnyDataLoading = planLoading || storageLoading;
    if (isAnyDataLoading) {
      return {
        isInitializing: false,
        isClerkLoading: false,
        isDataLoading: true,
        isFullyLoaded: false,
        hasErrors: false,
        errors: [],
        loadingPhase: 'data',
        loadingMessage: 'Loading subscription data...',
        isReadyForOverview: false,
        isReadyForPricingTable: false,
        isReadyForTabSwitching: false,
      };
    }

    // Check for errors
    const errors: Array<{ source: string; message: string }> = [];
    if (planError)
      errors.push({ source: 'Plan Config', message: planError.message });
    if (storageError)
      errors.push({ source: 'Storage Status', message: storageError.message });

    if (errors.length > 0) {
      return {
        isInitializing: false,
        isClerkLoading: false,
        isDataLoading: false,
        isFullyLoaded: false,
        hasErrors: true,
        errors,
        loadingPhase: 'error',
        loadingMessage: 'Failed to load billing data',
        isReadyForOverview: false,
        isReadyForPricingTable: false,
        isReadyForTabSwitching: false,
      };
    }

    // Phase 3: All data loaded and ready
    const hasRequiredData = !!planConfig && !!storageStatus;
    if (hasRequiredData) {
      return {
        isInitializing: false,
        isClerkLoading: false,
        isDataLoading: false,
        isFullyLoaded: true,
        hasErrors: false,
        errors: [],
        loadingPhase: 'complete',
        loadingMessage: 'Ready',
        isReadyForOverview: true,
        isReadyForPricingTable: true,
        isReadyForTabSwitching: true,
      };
    }

    // Fallback: Still loading
    return {
      isInitializing: false,
      isClerkLoading: false,
      isDataLoading: true,
      isFullyLoaded: false,
      hasErrors: false,
      errors: [],
      loadingPhase: 'data',
      loadingMessage: 'Finalizing data...',
      isReadyForOverview: false,
      isReadyForPricingTable: false,
      isReadyForTabSwitching: false,
    };
  }, [
    isClerkLoaded,
    user?.id,
    planLoading,
    storageLoading,
    planError,
    storageError,
    planConfig,
    storageStatus,
  ]);

  return coordinatedState;
}

/**
 * Lightweight hook for tab switching readiness
 * Optimized for performance during navigation
 */
export function useTabSwitchingReadiness() {
  const { isReadyForTabSwitching, loadingPhase } =
    useCoordinatedBillingLoading();

  return {
    isReady: isReadyForTabSwitching,
    canSwitchTabs: isReadyForTabSwitching,
    shouldShowTabLoading: loadingPhase === 'clerk' || loadingPhase === 'data',
  };
}

/**
 * Hook for PricingTable readiness
 * Ensures Clerk components only render when ready
 */
export function usePricingTableReadiness() {
  const { isReadyForPricingTable, isClerkLoading, loadingPhase } =
    useCoordinatedBillingLoading();

  return {
    isReady: isReadyForPricingTable,
    shouldShowClerkLoading: isClerkLoading,
    shouldShowDataLoading: loadingPhase === 'data',
    canRenderPricingTable: isReadyForPricingTable,
  };
}

export type { CoordinatedLoadingState };
