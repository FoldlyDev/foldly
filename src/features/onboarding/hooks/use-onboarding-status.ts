'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { checkOnboardingStatusAction } from '../lib/actions/onboarding-actions';

export function useOnboardingStatus() {
  const { isSignedIn, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['onboarding-status', isSignedIn],
    queryFn: async () => {
      if (!isSignedIn) {
        return { hasWorkspace: false };
      }
      const status = await checkOnboardingStatusAction();
      return { hasWorkspace: status.hasWorkspace };
    },
    enabled: isLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}