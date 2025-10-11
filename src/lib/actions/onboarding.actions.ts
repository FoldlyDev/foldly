// =============================================================================
// ONBOARDING SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 Cross-module onboarding checks used throughout the app

'use server';

import { auth, clerkClient, reverificationError } from '@clerk/nextjs/server';
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

/**
 * Check if a username is available in Clerk
 *
 * Used by:
 * - Onboarding form (validate username before workspace creation)
 *
 * Requires reverification (10 minutes) before checking username availability
 *
 * @param username - Username to check
 * @returns Object with availability status and error message if taken
 */
export async function checkUsernameAvailability(username: string) {
  try {
    // Require reverification for this sensitive action
    const { has } = await auth.protect();

    // Check if user has verified credentials within the past 10 minutes
    const shouldUserRevalidate = !has({ reverification: 'strict' });

    // If user hasn't reverified, return error requiring reverification
    if (shouldUserRevalidate) {
      return reverificationError('strict');
    }

    const client = await clerkClient();

    // Query Clerk for users with this username
    const users = await client.users.getUserList({
      username: [username],
    });

    // If any users found with this username, it's taken
    const isAvailable = users.data.length === 0;

    return {
      success: true as const,
      isAvailable,
      message: isAvailable
        ? 'Username is available'
        : 'Username is already taken',
    };
  } catch (error) {
    console.error('Failed to check username availability:', error);
    return {
      success: false as const,
      isAvailable: false,
      message: 'Failed to check username availability',
    };
  }
}
