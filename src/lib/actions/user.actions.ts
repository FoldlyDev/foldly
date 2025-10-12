// =============================================================================
// USER SERVER ACTIONS - Global Cross-Module Actions
// =============================================================================
// 🎯 User management operations used across the app

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserById, createUser, updateUser } from '@/lib/database/queries';

/**
 * Create user in database during onboarding
 *
 * Used by:
 * - Onboarding flow (sync Clerk user to database)
 *
 * This syncs the authenticated Clerk user to the database.
 * Must be called BEFORE creating workspace (foreign key dependency).
 *
 * @param username - User's chosen username
 * @returns Success status with user data or error
 */
export async function createUserAction(username: string) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return {
      success: false as const,
      error: 'Unauthorized - user not authenticated',
    };
  }

  try {
    // Check if user already exists in database
    const existingUser = await getUserById(userId);
    if (existingUser) {
      return {
        success: false as const,
        error: 'User already exists in database',
      };
    }

    // Get primary email from Clerk
    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return {
        success: false as const,
        error: 'User must have a valid email address',
      };
    }

    // Create user in database
    const user = await createUser({
      id: userId,
      email: primaryEmail,
      username: username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    });

    return {
      success: true as const,
      user,
    };
  } catch (error) {
    console.error('Failed to create user:', error);
    return {
      success: false as const,
      error: 'Failed to create user in database',
    };
  }
}

/**
 * Update user profile
 *
 * Used by:
 * - Settings module (update user information)
 *
 * @param data - Fields to update
 * @returns Success status with updated user or error
 */
export async function updateUserProfileAction(data: {
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false as const,
      error: 'Unauthorized',
    };
  }

  try {
    // Verify user exists
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return {
        success: false as const,
        error: 'User not found in database',
      };
    }

    // Update user
    const updatedUser = await updateUser(userId, data);

    return {
      success: true as const,
      user: updatedUser,
    };
  } catch (error) {
    console.error('Failed to update user:', error);
    return {
      success: false as const,
      error: 'Failed to update user profile',
    };
  }
}

/**
 * Get authenticated user from database
 *
 * Used across modules:
 * - Dashboard (display user info)
 * - Settings (load user profile)
 *
 * @returns User from database or null if not found
 */
export async function getUserAction() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await getUserById(userId);
  return user ?? null;
}
