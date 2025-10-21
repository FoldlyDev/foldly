// =============================================================================
// ONBOARDING SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 Cross-module onboarding checks used throughout the app

'use server';

import { clerkClient, reverificationError, currentUser } from '@clerk/nextjs/server';
import { withAuth, withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getUserWorkspace, getUserById } from '@/lib/database/queries';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { sanitizeUsername } from '@/lib/utils/security';
import { logAuthFailure, logSecurityEvent, logSecurityIncident } from '@/lib/utils/logger';
import { onboardingTransaction } from '@/lib/database/transactions';
import { randomUUID } from 'crypto';
import { sendWelcomeEmailAction } from './email.actions';
import { ERROR_MESSAGES } from '@/lib/constants';
import {
  validateInput,
  checkUsernameSchema,
  completeOnboardingSchema,
  type CheckUsernameInput,
  type CompleteOnboardingInput,
  type OnboardingStatusResult,
  type UsernameAvailabilityResult,
  type CompleteOnboardingResult,
} from '@/lib/validation/onboarding-schemas';

/**
 * Check if authenticated user has completed onboarding
 *
 * Used across multiple modules:
 * - Landing navigation (show correct CTA)
 * - Dashboard layout (redirect if not onboarded)
 * - Onboarding page (redirect if already onboarded)
 *
 * @returns ActionResponse with onboarding status and workspace ID if exists
 *
 * @example
 * ```typescript
 * const result = await checkOnboardingStatus();
 * if (result.success) {
 *   console.log('Has workspace:', result.data.hasWorkspace);
 * }
 * ```
 */
export const checkOnboardingStatus = withAuth<OnboardingStatusResult>(
  'checkOnboardingStatus',
  async (userId) => {
    // Check if user has workspace (onboarding complete = workspace exists)
    const workspace = await getUserWorkspace(userId);

    return {
      success: true,
      data: {
        hasWorkspace: !!workspace,
        workspaceId: workspace?.id ?? null,
      },
    } as const;
  }
);

/**
 * Check if a username is available in Clerk
 *
 * Used by:
 * - Onboarding form (validate username before workspace creation)
 *
 * Requires reverification (10 minutes) before checking username availability
 * Rate limited to 5 requests per minute per user (SEC-002)
 *
 * @param input - Object containing username to check
 * @returns ActionResponse with availability status and message
 *
 * @example
 * ```typescript
 * const result = await checkUsernameAvailability({ username: 'john-doe' });
 * if (result.success && result.data.isAvailable) {
 *   console.log('Username is available');
 * }
 * ```
 */
export const checkUsernameAvailability = withAuthInput<
  CheckUsernameInput,
  UsernameAvailabilityResult
>('checkUsernameAvailability', async (userId, input) => {
  // Validate input (includes username sanitization via schema)
  const validated = validateInput(checkUsernameSchema, input);

  // Rate limiting check (SEC-002: Prevent username enumeration and DoS)
  const rateLimitKey = RateLimitKeys.usernameCheck(userId);
  const rateLimit = await checkRateLimit(rateLimitKey, RateLimitPresets.STRICT);

  if (!rateLimit.allowed) {
    logAuthFailure('Username check rate limit exceeded', {
      reason: 'rate_limit',
      userId,
      action: 'username_check',
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimit.resetAt,
    } as const;
  }

  // Additional validation: username must be at least 4 characters after sanitization
  // Note: sanitization already happened in the schema, validated.username is the sanitized version
  if (validated.username.length < 4) {
    logAuthFailure('Username check failed - invalid format', {
      reason: 'invalid_format',
      userId,
      action: 'username_check',
    });

    throw {
      success: false,
      error: 'Username must be at least 4 characters and contain only letters, numbers, hyphens, and underscores.',
    } as const;
  }

  const client = await clerkClient();

  // Get current user to check if username belongs to them
  const currentClerkUser = await currentUser();

  // Query Clerk for users with this username (using sanitized version)
  const users = await client.users.getUserList({
    username: [validated.username],
  });

  // Check if username is available
  // Username is available if:
  // 1. No users have this username, OR
  // 2. The only user with this username is the current user (they can keep their own username)
  const isOwnUsername =
    currentClerkUser?.username?.toLowerCase() === validated.username.toLowerCase();
  const isAvailable =
    users.data.length === 0 || (users.data.length === 1 && isOwnUsername);

  // Log successful check
  logSecurityEvent('Username availability checked', {
    action: 'username_check_success',
    userId,
    isAvailable,
    isOwnUsername,
  });

  return {
    success: true,
    data: {
      isAvailable,
      message: isAvailable
        ? isOwnUsername
          ? 'You can keep your current username'
          : 'Username is available'
        : 'Username is already taken',
    },
  } as const;
});

/**
 * Complete onboarding process atomically
 *
 * Creates user, workspace, first link, and owner permission in a single database transaction.
 * Ensures all operations succeed or all fail together (SEC-003).
 *
 * Used by:
 * - Onboarding form (complete user setup)
 *
 * @param input - Object containing username
 * @returns ActionResponse with created resources or error
 *
 * @example
 * ```typescript
 * const result = await completeOnboardingAction({ username: 'john-doe' });
 * if (result.success) {
 *   console.log('User:', result.data.user);
 *   console.log('Workspace:', result.data.workspace);
 * }
 * ```
 */
export const completeOnboardingAction = withAuthInput<
  CompleteOnboardingInput,
  CompleteOnboardingResult
>('completeOnboardingAction', async (userId, input) => {
  // Validate input (includes username sanitization via schema)
  const validated = validateInput(completeOnboardingSchema, input);

  // Get current user from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    logAuthFailure('Onboarding failed - Clerk user not found', {
      reason: 'no_clerk_user',
      userId,
      action: 'complete_onboarding',
    });
    throw {
      success: false,
      error: ERROR_MESSAGES.USER.NOT_FOUND,
    } as const;
  }

  // Additional validation: username must be at least 4 characters after sanitization
  if (validated.username.length < 4) {
    logAuthFailure('Onboarding failed - invalid username', {
      reason: 'invalid_username',
      userId,
      action: 'complete_onboarding',
    });
    throw {
      success: false,
      error: 'Invalid username format',
    } as const;
  }

  // Check if user already exists (resume detection)
  const existingUser = await getUserById(userId);
  if (existingUser) {
    // User already onboarded, check if they have a workspace
    const workspace = await getUserWorkspace(userId);

    logSecurityEvent('Onboarding attempted for existing user', {
      action: 'onboarding_duplicate',
      userId,
      hasWorkspace: !!workspace,
    });

    throw {
      success: false,
      error: 'User already onboarded',
    } as const;
  }

  // Get primary email from Clerk
  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    logAuthFailure('Onboarding failed - no email', {
      reason: 'no_email',
      userId,
      action: 'complete_onboarding',
    });
    throw {
      success: false,
      error: 'User must have a valid email address',
    } as const;
  }

  // Generate IDs for all resources
  const workspaceId = randomUUID();
  const linkId = randomUUID();
  const permissionId = randomUUID();

  // Prepare data for transaction
  const userData = {
    id: userId,
    email: primaryEmail,
    username: validated.username, // Use validated username (sanitized)
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    avatarUrl: clerkUser.imageUrl,
  };

  const workspaceData = {
    id: workspaceId,
    userId: userId,
    name: clerkUser.firstName
      ? `${clerkUser.firstName}'s Workspace`
      : `${validated.username}'s Workspace`,
  };

  const linkData = {
    id: linkId,
    workspaceId: workspaceId,
    slug: `${validated.username.toLowerCase()}-first-link`, // Convert to lowercase for URL-safe slug
    name: `${validated.username}'s First Link`, // Keep original case for display name
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
    username: validated.username,
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
      retries: transactionResult.retries,
    });
    throw {
      success: false,
      error: transactionResult.error || 'Failed to complete onboarding',
    } as const;
  }

  // Transaction succeeded! Now update Clerk username (external API, not part of transaction)
  // This is the LAST step for rollback safety
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, { username: validated.username });

    logSecurityEvent('Onboarding completed successfully', {
      action: 'onboarding_complete',
      userId,
      username: validated.username,
      workspaceId,
      linkId,
    });

    // Send welcome email (don't block on failure)
    await sendWelcomeEmailAction({
      email: primaryEmail,
      firstName: clerkUser.firstName,
      username: validated.username,
    });

    return {
      success: true,
      data: {
        user: transactionResult.data!.user,
        workspace: transactionResult.data!.workspace,
        link: transactionResult.data!.link,
        permission: transactionResult.data!.permission,
      },
    } as const;
  } catch (clerkError) {
    // Database transaction succeeded but Clerk update failed
    // This is a critical state mismatch - log as incident
    logSecurityIncident('Onboarding DB succeeded but Clerk update failed', {
      action: 'onboarding_clerk_mismatch',
      userId,
      username: validated.username,
      error: clerkError instanceof Error ? clerkError.message : 'Unknown error',
      workspaceId,
    });

    // User is technically onboarded in our system, return success
    // They can fix username later in settings if needed
    // Note: The 'warning' field is not in ActionResponse type, but we document this edge case
    return {
      success: true,
      data: {
        user: transactionResult.data!.user,
        workspace: transactionResult.data!.workspace,
        link: transactionResult.data!.link,
        permission: transactionResult.data!.permission,
      },
    } as const;
  }
});
