// =============================================================================
// BILLING MUTATIONS - React Query Mutations for Billing Operations
// =============================================================================
// 🎯 Optimistic updates and cache invalidation for billing operations

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingQueryKeys } from '../../lib/query-keys';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface UpdateStorageQuotaInput {
  newLimit: number;
  reason?: string;
}

interface BillingErrorResponse {
  success: false;
  error: string;
  data: null;
}

interface BillingSuccessResponse<T> {
  success: true;
  error: null;
  data: T;
}

type BillingResponse<T> = BillingSuccessResponse<T> | BillingErrorResponse;

/**
 * Hook for updating user storage quota with optimistic updates
 * @deprecated Storage limits are now plan-based, not user-specific
 * Use subscription plan changes instead of direct quota updates
 */
export function useUpdateStorageQuotaMutation() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStorageQuotaInput): Promise<BillingResponse<{ storageLimit: number }>> => {
      // This would call a server action to update storage quota
      // For now, simulating the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        error: null,
        data: { storageLimit: input.newLimit },
      };
    },
    onMutate: async (input) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: billingQueryKeys.userBilling(user.id) 
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        billingQueryKeys.userBillingData(user.id)
      );

      // Optimistically update the cache
      queryClient.setQueryData(
        billingQueryKeys.userBillingData(user.id),
        (old: any) => ({
          ...old,
          storageLimit: input.newLimit,
        })
      );

      // Return the context with the previous value
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback the optimistic update
      if (context?.previousData && user?.id) {
        queryClient.setQueryData(
          billingQueryKeys.userBillingData(user.id),
          context.previousData
        );
      }
      
      toast.error('Failed to update storage quota');
      console.error('Storage quota update error:', error);
    },
    onSuccess: (data) => {
      toast.success('Storage quota updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.userBilling(user.id) 
        });
      }
    },
  });
}

/**
 * Hook for refreshing billing data with error handling
 */
export function useRefreshBillingDataMutation() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Invalidate all billing queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.userBilling(user.id) 
      });
    },
    onSuccess: () => {
      toast.success('Billing data refreshed');
    },
    onError: (error) => {
      toast.error('Failed to refresh billing data');
      console.error('Billing data refresh error:', error);
    },
  });
}

/**
 * Hook for clearing billing cache (useful for debugging)
 */
export function useClearBillingCacheMutation() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Remove all billing queries from cache
      queryClient.removeQueries({ 
        queryKey: billingQueryKeys.userBilling(user.id) 
      });
    },
    onSuccess: () => {
      toast.success('Billing cache cleared');
    },
    onError: (error) => {
      toast.error('Failed to clear billing cache');
      console.error('Cache clear error:', error);
    },
  });
}

/**
 * Hook for batch invalidating billing queries
 */
export function useInvalidateBillingQueriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scope: 'all' | 'user' | 'plans' = 'all'): Promise<void> => {
      switch (scope) {
        case 'all':
          await queryClient.invalidateQueries({ 
            queryKey: billingQueryKeys.all 
          });
          break;
        case 'plans':
          await queryClient.invalidateQueries({ 
            queryKey: billingQueryKeys.subscriptionPlans() 
          });
          break;
        case 'user':
        default:
          // This would require userId parameter in a real implementation
          await queryClient.invalidateQueries({ 
            queryKey: billingQueryKeys.all 
          });
          break;
      }
    },
    onSuccess: (data, variables) => {
      toast.success(`${variables} billing data refreshed`);
    },
    onError: (error) => {
      toast.error('Failed to refresh billing data');
      console.error('Billing invalidation error:', error);
    },
  });
}