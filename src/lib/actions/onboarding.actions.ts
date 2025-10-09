// =============================================================================
// ONBOARDING SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 Cross-module onboarding checks used throughout the app

'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserWorkspace } from '@/lib/database/queries';

/**
 * Check if authenticated user has completed onboarding
 *
 * Used across multiple modules:
 * - Landing navigation (show correct CTA)
 * - Dashboard layout (redirect if not onboarded)
 * - Onboarding page (redirect if already onboarded)
 *
 * @returns Object with onboarding status and workspace ID if exists
 */
export async function checkOnboardingStatus() {
  const { userId } = await auth();

  // Not authenticated
  if (!userId) {
    return {
      hasWorkspace: false,
      workspaceId: null,
    };
  }

  // Check if user has workspace (onboarding complete = workspace exists)
  const workspace = await getUserWorkspace(userId);

  return {
    hasWorkspace: !!workspace,
    workspaceId: workspace?.id ?? null,
  };
}
