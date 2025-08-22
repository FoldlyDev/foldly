'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { checkWorkspaceStatusAction } from '@/features/workspace/lib/actions/workspace-actions';
import { userWorkspaceService } from '@/features/users/services/user-workspace-service';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';
import { sanitizeUserId } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/utils/rate-limiter';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStatusResult {
  authenticated: boolean;
  hasWorkspace: boolean;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
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

/**
 * Check if a username is available - checks Clerk first, then database as fallback
 */
export async function checkUsernameAvailabilityAction(
  username: string
): Promise<ActionResult<{ available: boolean; message?: string }>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // Apply rate limiting
    const rateLimitResult = checkRateLimit(sanitizedUserId, {
      ...RATE_LIMIT_PRESETS.VALIDATION,
      keyPrefix: 'username_check',
    });

    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      );
    }

    // Import validation utilities
    const { normalizeUsername, validateUsername, sanitizeInput } = await import('@/lib/utils/validation');
    
    // First sanitize the input to prevent XSS
    const sanitizedUsername = sanitizeInput(username);
    
    // Validate username format
    const validationResult = validateUsername(sanitizedUsername);
    if (!validationResult.isValid) {
      return createSuccessResponse({ 
        available: false,
        message: validationResult.error || 'Invalid username format'
      });
    }

    // Normalize username for consistent comparison
    const normalizedUsername = normalizeUsername(sanitizedUsername);
    if (!normalizedUsername) {
      return createSuccessResponse({ 
        available: false,
        message: 'Invalid username format'
      });
    }

    // First, try to check with Clerk by attempting to find users with this username
    // Use lowercase since Clerk stores usernames in lowercase
    try {
      const clerk = await clerkClient();
      const clerkUsers = await clerk.users.getUserList({
        username: [normalizedUsername],
        limit: 1
      });

      // If any user has this username (case-insensitive check)
      if (clerkUsers.data.length > 0) {
        const existingUser = clerkUsers.data[0];
        // Check if it's the same user (they might be checking their current username)
        if (existingUser && existingUser.id !== sanitizedUserId) {
          return createSuccessResponse({ 
            available: false,
            message: 'This username is already taken'
          });
        }
      }
    } catch (clerkError) {
      // If Clerk check fails, log it but continue with database check
      logger.warn('Clerk username check failed, falling back to database', { error: clerkError });
    }

    // Fallback: Check if username is available in database
    const isAvailable = await userWorkspaceService.isUsernameAvailable(normalizedUsername, sanitizedUserId);
    
    if (!isAvailable) {
      return createSuccessResponse({ 
        available: false,
        message: 'This username is already taken'
      });
    }

    return createSuccessResponse({ 
      available: true 
    });
  } catch (error) {
    logger.error('Failed to check username availability', error);
    return createErrorResponse(
      'Failed to check username availability',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

/**
 * Complete onboarding by creating user and workspace
 * Note: Username should already be updated in Clerk on client side
 */
export async function completeOnboardingAction(
  username: string
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // Get current user details from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return createErrorResponse('User not found', ERROR_CODES.NOT_FOUND);
    }

    // Validate and normalize username using existing utilities
    const { normalizeUsername, validateUsername, sanitizeInput } = await import('@/lib/utils/validation');
    
    // First sanitize the input to prevent XSS
    const sanitizedUsername = sanitizeInput(username);
    
    // Validate username format
    const validationResult = validateUsername(sanitizedUsername);
    if (!validationResult.isValid) {
      return createErrorResponse(
        validationResult.error || 'Invalid username format',
        ERROR_CODES.VALIDATION_FAILED
      );
    }
    
    // Normalize username for storage
    const normalizedUsername = normalizeUsername(sanitizedUsername);
    if (!normalizedUsername) {
      return createErrorResponse(
        'Invalid username format',
        ERROR_CODES.VALIDATION_FAILED
      );
    }

    // Extract email
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return createErrorResponse('Email not found', ERROR_CODES.VALIDATION_FAILED);
    }

    // Use the existing user-workspace service to create user and workspace
    // Use the normalized username which is already lowercase
    const result = await userWorkspaceService.createUserWithWorkspace({
      id: sanitizedUserId,
      email: primaryEmail,
      username: normalizedUsername, // Already normalized and lowercase
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    });

    if (!result.success) {
      logger.error('Failed to create user and workspace', {
        userId: sanitizedUserId,
        error: result.error,
      });
      return createErrorResponse(
        result.error || 'Failed to create workspace',
        ERROR_CODES.INTERNAL_ERROR
      );
    }

    logger.info('Onboarding completed successfully', {
      userId: sanitizedUserId,
      workspaceId: result.data?.workspace.id,
    });

    return createSuccessResponse({ 
      workspaceId: result.data!.workspace.id 
    });
  } catch (error) {
    logger.error('Failed to complete onboarding', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to complete onboarding',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}