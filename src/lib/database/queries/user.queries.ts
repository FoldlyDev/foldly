// =============================================================================
// USER DATABASE QUERIES - Reusable User Operations
// =============================================================================
// 🎯 User CRUD operations called by server actions

import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/database/schemas';

/**
 * Get user by Clerk user ID
 * @param userId - Clerk user ID
 * @returns User or undefined if not found
 */
export async function getUserById(userId: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

/**
 * Get user by email
 * @param email - User email
 * @returns User or undefined if not found
 */
export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

/**
 * Get user by username
 * @param username - Username
 * @returns User or undefined if not found
 */
export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return user;
}

/**
 * Create new user in database (called during onboarding)
 * @param data - User creation data from Clerk
 * @returns Created user
 */
export async function createUser(data: {
  id: string; // Clerk user ID
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      username: data.username,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      avatarUrl: data.avatarUrl ?? null,
    })
    .returning();

  return user;
}

/**
 * Update user profile information
 * @param userId - Clerk user ID
 * @param data - Fields to update
 * @returns Updated user
 */
export async function updateUser(
  userId: string,
  data: {
    username?: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  }
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

/**
 * Update user's storage usage (called after file operations)
 * @param userId - Clerk user ID
 * @param storageUsed - New storage size in bytes
 */
export async function updateUserStorage(
  userId: string,
  storageUsed: number
): Promise<void> {
  await db
    .update(users)
    .set({
      storageUsed,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Soft delete user (sets deletedAt timestamp)
 * @param userId - Clerk user ID
 */
export async function softDeleteUser(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
