'use server';

import { auth } from '@clerk/nextjs/server';
import { checkWorkspaceStatusAction } from '@/features/workspace/lib/actions/workspace-actions';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStatusResult {
  authenticated: boolean;
  hasWorkspace: boolean;
}

// =============================================================================
// ONBOARDING ACTIONS
// =============================================================================

/**
 * Check onboarding status - determines if user needs onboarding
 */
export async function checkOnboardingStatusAction(): Promise<OnboardingStatusResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      authenticated: false,
      hasWorkspace: false,
    };
  }

  // Use existing workspace check action
  const workspaceResult = await checkWorkspaceStatusAction();
  
  return {
    authenticated: true,
    hasWorkspace: workspaceResult.success && workspaceResult.data?.exists === true,
  };
}