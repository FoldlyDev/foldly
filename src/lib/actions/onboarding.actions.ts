// =============================================================================
// ONBOARDING SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 Cross-module onboarding checks used throughout the app

'use server';

import { auth, clerkClient, reverificationError, currentUser } from '@clerk/nextjs/server';
import { getUserWorkspace, getUserById } from '@/lib/database/queries';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { sanitizeUsername } from '@/lib/utils/security';
import { logAuthFailure, logSecurityEvent, logSecurityIncident } from '@/lib/utils/logger';
import { onboardingTransaction } from '@/lib/database/transactions';
import { randomUUID } from 'crypto';

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
 * Rate limited to 5 requests per minute per user (SEC-002)
 *
 * @param username - Username to check (will be sanitized)
 * @returns Object with availability status and error message if taken
 */
export async function checkUsernameAvailability(username: string) {
  try {
    // Get authenticated user
    const { userId, has } = await auth.protect();

    if (!userId) {
      logAuthFailure('Username check failed - not authenticated', {
        reason: 'no_user_id',
        action: 'username_check'
      });
      return {
        success: false as const,
        isAvailable: false,
        message: 'Authentication required',
      };
    }

    // Rate limiting check (SEC-002: Prevent username enumeration and DoS)
    const rateLimitKey = RateLimitKeys.usernameCheck(userId);
    const rateLimit = await checkRateLimit(rateLimitKey, RateLimitPresets.STRICT);

    if (!rateLimit.allowed) {
      logAuthFailure('Username check rate limit exceeded', {
        reason: 'rate_limit',
        userId,
        action: 'username_check',
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      });
      return {
        success: false as const,
        isAvailable: false,
        message: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
      };
    }

    // Input sanitization (SEC-004: Prevent injection attacks)
    const sanitized = sanitizeUsername(username);
    if (!sanitized || sanitized.length < 4) {
      logAuthFailure('Username check failed - invalid format', {
        reason: 'invalid_format',
        userId,
        action: 'username_check'
      });
      return {
        success: false as const,
        isAvailable: false,
        message: 'Username must be at least 4 characters and contain only letters, numbers, hyphens, and underscores',
      };
    }

    // Check if user has verified credentials within the past 10 minutes
    const shouldUserRevalidate = !has({ reverification: 'strict' });

    // If user hasn't reverified, return error requiring reverification
    if (shouldUserRevalidate) {
      logSecurityEvent('Username check requires reverification', {
        action: 'reverification_required',
        userId
      });
      return reverificationError('strict');
    }

    const client = await clerkClient();

    // Query Clerk for users with this username (using sanitized version)
    const users = await client.users.getUserList({
      username: [sanitized],
    });

    // If any users found with this username, it's taken
    const isAvailable = users.data.length === 0;

    // Log successful check
    logSecurityEvent('Username availability checked', {
      action: 'username_check_success',
      userId,
      isAvailable
    });

    return {
      success: true as const,
      isAvailable,
      message: isAvailable
        ? 'Username is available'
        : 'Username is already taken',
    };
  } catch (error) {
    logAuthFailure('Username check failed with error', {
      reason: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'username_check'
    });
    return {
      success: false as const,
      isAvailable: false,
      message: 'Failed to check username availability. Please try again.',
    };
  }
}

/**
 * Complete onboarding process atomically
 *
 * Creates user, workspace, first link, and owner permission in a single database transaction.
 * Ensures all operations succeed or all fail together (SEC-003).
 *
 * Used by:
 * - Onboarding form (complete user setup)
 *
 * @param username - Sanitized username from client
 * @returns Success status with created resources or error
 */
export async function completeOnboardingAction(username: string) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      logAuthFailure('Onboarding failed - not authenticated', {
        reason: 'no_user_id',
        action: 'complete_onboarding'
      });
      return {
        success: false as const,
        error: 'Authentication required',
      };
    }

    // Sanitize username (defense in depth - client should have already done this)
    const sanitized = sanitizeUsername(username);
    if (!sanitized || sanitized.length < 4) {
      logAuthFailure('Onboarding failed - invalid username', {
        reason: 'invalid_username',
        userId,
        action: 'complete_onboarding'
      });
      return {
        success: false as const,
        error: 'Invalid username format',
      };
    }

    // Check if user already exists (resume detection)
    const existingUser = await getUserById(userId);
    if (existingUser) {
      // User already onboarded, check if they have a workspace
      const workspace = await getUserWorkspace(userId);

      logSecurityEvent('Onboarding attempted for existing user', {
        action: 'onboarding_duplicate',
        userId,
        hasWorkspace: !!workspace
      });

      return {
        success: false as const,
        error: 'User already onboarded',
        isAlreadyOnboarded: true,
      };
    }

    // Get primary email from Clerk
    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      logAuthFailure('Onboarding failed - no email', {
        reason: 'no_email',
        userId,
        action: 'complete_onboarding'
      });
      return {
        success: false as const,
        error: 'User must have a valid email address',
      };
    }

    // Generate IDs for all resources
    const workspaceId = randomUUID();
    const linkId = randomUUID();
    const permissionId = randomUUID();

    // Prepare data for transaction
    const userData = {
      id: userId,
      email: primaryEmail,
      username: sanitized,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    };

    const workspaceData = {
      id: workspaceId,
      userId: userId,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}'s Workspace`
        : `${sanitized}'s Workspace`,
    };

    const linkData = {
      id: linkId,
      workspaceId: workspaceId,
      slug: `${sanitized}-first-link`,
      name: `${sanitized}-first-link`,
      isPublic: false,
      isActive: true,
    };

    const permissionData = {
      id: permissionId,
      linkId: linkId,
      email: primaryEmail,
      role: 'owner' as const,
      isVerified: 'true' as const,
      verifiedAt: new Date(),
    };

    // Execute atomic transaction (SEC-003: All operations succeed or all fail)
    logSecurityEvent('Starting onboarding transaction', {
      action: 'onboarding_start',
      userId,
      username: sanitized
    });

    const transactionResult = await onboardingTransaction({
      userId,
      userData,
      workspaceData,
      linkData,
      permissionData,
    });

    // Check transaction result
    if (!transactionResult.success) {
      logSecurityIncident('Onboarding transaction failed', {
        action: 'onboarding_transaction_failed',
        userId,
        error: transactionResult.error,
        retries: transactionResult.retries
      });
      return {
        success: false as const,
        error: transactionResult.error || 'Failed to complete onboarding',
      };
    }

    // Transaction succeeded! Now update Clerk username (external API, not part of transaction)
    // This is the LAST step for rollback safety
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, { username: sanitized });

      logSecurityEvent('Onboarding completed successfully', {
        action: 'onboarding_complete',
        userId,
        username: sanitized,
        workspaceId,
        linkId
      });

      return {
        success: true as const,
        data: {
          user: transactionResult.data!.user,
          workspace: transactionResult.data!.workspace,
          link: transactionResult.data!.link,
          permission: transactionResult.data!.permission,
        },
      };
    } catch (clerkError) {
      // Database transaction succeeded but Clerk update failed
      // This is a critical state mismatch - log as incident
      logSecurityIncident('Onboarding DB succeeded but Clerk update failed', {
        action: 'onboarding_clerk_mismatch',
        userId,
        username: sanitized,
        error: clerkError instanceof Error ? clerkError.message : 'Unknown error',
        workspaceId,
      });

      // User is technically onboarded in our system, return success
      // They can fix username later in settings if needed
      return {
        success: true as const,
        data: {
          user: transactionResult.data!.user,
          workspace: transactionResult.data!.workspace,
          link: transactionResult.data!.link,
          permission: transactionResult.data!.permission,
        },
        warning: 'Onboarding completed but username sync failed. You can update it in settings.',
      };
    }

  } catch (error) {
    logSecurityIncident('Onboarding failed with exception', {
      action: 'onboarding_exception',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false as const,
      error: 'An unexpected error occurred during onboarding. Please try again.',
    };
  }
}
