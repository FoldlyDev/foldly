import { db } from '@/lib/database/connection';
import { users, workspaces } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { workspaceService } from '@/features/workspace/services/workspace-service';
import type {
  User,
  Workspace,
  DatabaseResult,
} from '@/lib/database/types';
import type { WebhookUserData } from '@/lib/webhooks';

// Combined user + workspace creation result
export interface UserWorkspaceCreateResult {
  user: User;
  workspace: Workspace;
}

export class UserWorkspaceService {
  /**
   * Atomically create user and workspace in a single transaction
   * Handles idempotency for both user and workspace creation
   */
  async createUserWithWorkspace(
    userData: WebhookUserData
  ): Promise<DatabaseResult<UserWorkspaceCreateResult>> {
    const startTime = Date.now();

    try {
      return await db.transaction(async tx => {
        // Phase 1: Create or update user (idempotent)
        // Handle conflicts on multiple unique constraints (id, email, username)
        let user;

        // Strategy: Check for existing user first, then handle conflicts gracefully
        const existingUserByEmail = await tx
          .select()
          .from(users)
          .where(eq(users.email, userData.email))
          .limit(1);

        if (existingUserByEmail.length > 0) {
          const existingUser = existingUserByEmail[0];

          if (!existingUser) {
            throw new Error('Unexpected: existing user not found');
          }

          // If the existing user has the same Clerk ID, just return it
          if (existingUser.id === userData.id) {
            console.log(
              `✅ EXISTING_USER: User ${userData.id} already exists with correct Clerk ID`
            );
            user = existingUser;
          } else {
            // Different Clerk ID - UPDATE existing user instead of deleting (prevents webhook race condition)
            console.log(
              `🔄 CONFLICT_RESOLUTION: User exists with email ${userData.email} but different Clerk ID. Updating existing user ${existingUser.id} with new Clerk ID ${userData.id}`
            );

            // Update the existing user with the new Clerk ID - preserves all relationships and workspace
            [user] = await tx
              .update(users)
              .set({
                id: userData.id, // Update to new Clerk ID
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatarUrl: userData.avatarUrl,
                // Storage tracking now handled by real-time calculation
                updatedAt: new Date(),
                // Keep original createdAt to preserve user history
              })
              .where(eq(users.id, existingUser.id))
              .returning();

            // Update workspace to maintain user connection with new Clerk ID
            await tx
              .update(workspaces)
              .set({
                userId: userData.id, // Update workspace to reference new user ID
              })
              .where(eq(workspaces.userId, existingUser.id));

            if (!user) {
              throw new Error(
                'Failed to create user after conflict resolution'
              );
            }
          }
        } else {
          // No existing user - try to create new one
          try {
            [user] = await tx
              .insert(users)
              .values({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatarUrl: userData.avatarUrl,
                // Storage tracking now handled by real-time calculation
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: users.id,
                set: {
                  email: userData.email,
                  username: userData.username,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  avatarUrl: userData.avatarUrl,
                  updatedAt: new Date(),
                },
              })
              .returning();
          } catch (insertError: any) {
            // Final fallback - if any constraint violation, try to find by email/username and use cascade deletion
            if (insertError?.code === '23505') {
              console.log(
                `🔄 FINAL_FALLBACK: Constraint violation, attempting cascade deletion for ${userData.id}`
              );

              // Try to find by email or username
              const [existingUser] = await tx
                .select()
                .from(users)
                .where(eq(users.email, userData.email))
                .limit(1);

              if (existingUser) {
                // Update the existing user instead of deleting (prevents webhook race condition)
                [user] = await tx
                  .update(users)
                  .set({
                    id: userData.id, // Update to new Clerk ID
                    email: userData.email,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    avatarUrl: userData.avatarUrl,
                    // Storage tracking now handled by real-time calculation
                    updatedAt: new Date(),
                    // Keep original createdAt to preserve user history
                  })
                  .where(eq(users.id, existingUser.id))
                  .returning();

                // Update workspace to maintain user connection with new Clerk ID
                await tx
                  .update(workspaces)
                  .set({
                    userId: userData.id, // Update workspace to reference new user ID
                  })
                  .where(eq(workspaces.userId, existingUser.id));
              } else {
                // This should rarely happen, but handle gracefully
                throw new Error(
                  'Could not create user - constraint violation with no matching record'
                );
              }
            } else {
              throw insertError;
            }
          }
        }

        if (!user) {
          throw new Error('Failed to create or update user');
        }

        // Phase 2: Create workspace (with 1:1 constraint)
        const [workspace] = await tx
          .insert(workspaces)
          .values({
            userId: user.id,
            name: 'My Workspace',
            createdAt: new Date(),
          })
          .onConflictDoNothing()
          .returning();

        // If workspace wasn't created, fetch existing one
        if (!workspace) {
          const [existingWorkspace] = await tx
            .select()
            .from(workspaces)
            .where(eq(workspaces.userId, user.id))
            .limit(1);

          if (!existingWorkspace) {
            throw new Error('Failed to create or retrieve workspace');
          }

          const duration = Date.now() - startTime;
          console.log(`✅ USER_WORKSPACE_EXISTS: ${user.id} | ${duration}ms`);

          return {
            success: true,
            data: {
              user,
              workspace: existingWorkspace,
            },
          };
        }

        const duration = Date.now() - startTime;
        console.log(`✅ USER_WORKSPACE_CREATED: ${user.id} | ${duration}ms`);

        return {
          success: true,
          data: {
            user,
            workspace,
          },
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ USER_WORKSPACE_FAILED: ${userData.id} | ${duration}ms`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if user already has a workspace (idempotency check)
   */
  async hasExistingWorkspace(userId: string): Promise<boolean> {
    return await workspaceService.hasExistingWorkspace(userId);
  }

  /**
   * Get user with their workspace (for workspace feature)
   */
  async getUserWithWorkspace(
    userId: string
  ): Promise<DatabaseResult<UserWorkspaceCreateResult>> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const workspace = await workspaceService.getWorkspaceByUserId(userId);
      if (!workspace) {
        return { success: false, error: 'Workspace not found' };
      }

      return {
        success: true,
        data: {
          user,
          workspace,
        },
      };
    } catch (error) {
      console.error(`❌ USER_WORKSPACE_FETCH_FAILED: ${userId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create user separately (fallback strategy)
   */
  async createUser(userData: WebhookUserData): Promise<DatabaseResult<User>> {
    try {
      let user;

      // Strategy: Check for existing user by Clerk ID first, then by email
      // This handles cases where users have multiple emails or changed their primary email
      const [existingUserById, existingUserByEmail] = await Promise.all([
        // Check by Clerk ID first (most reliable)
        db.select().from(users).where(eq(users.id, userData.id)).limit(1),
        // Check by email (for conflict resolution)
        db.select().from(users).where(eq(users.email, userData.email)).limit(1)
      ]);

      if (existingUserById.length > 0) {
        // User exists with same Clerk ID - simple update (user might have changed primary email)
        console.log(
          `✅ EXISTING_USER_UPDATE: User ${userData.id} exists, updating profile data`
        );
        
        [user] = await db
          .update(users)
          .set({
            email: userData.email, // Update to current primary email
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
          
      } else if (existingUserByEmail.length > 0) {
        // Different Clerk ID but same email - potential conflict or email change
        const existingUser = existingUserByEmail[0];
        if (!existingUser) {
          throw new Error('Unexpected: existing user by email not found');
        }
        
        console.log(
          `🔄 CONFLICT_RESOLUTION: User exists with email ${userData.email}, updating with new Clerk ID ${userData.id}`
        );

        [user] = await db
          .update(users)
          .set({
            id: userData.id, // Update to new Clerk ID
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();

        // Update workspace to maintain user connection with new Clerk ID
        await db
          .update(workspaces)
          .set({
            userId: userData.id, // Update workspace to reference new user ID
          })
          .where(eq(workspaces.userId, existingUser.id));
      } else {
        // No existing user - create new one
        [user] = await db
          .insert(users)
          .values({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            // Storage tracking now handled by real-time calculation
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: userData.email,
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName,
              avatarUrl: userData.avatarUrl,
              updatedAt: new Date(),
            },
          })
          .returning();
      }

      if (!user) {
        throw new Error('Failed to create or update user');
      }

      console.log(`✅ USER_CREATED: ${user.id}`);
      return { success: true, data: user };
    } catch (error) {
      console.error(`❌ USER_CREATE_FAILED: ${userData.id}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error(`❌ USER_FETCH_FAILED: ${userId}`, error);
      return null;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return !!user;
    } catch (error) {
      console.error(`❌ USER_EXISTS_CHECK_FAILED: ${userId}`, error);
      return false;
    }
  }

  /**
   * Get combined user and workspace data with performance optimization
   */
  async getUserWithWorkspaceOptimized(
    userId: string
  ): Promise<DatabaseResult<UserWorkspaceCreateResult>> {
    try {
      // Single query with JOIN instead of separate queries
      const result = await db
        .select({
          user: users,
          workspace: workspaces,
        })
        .from(users)
        .leftJoin(workspaces, eq(workspaces.userId, users.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (!result[0]) {
        return { success: false, error: 'User not found' };
      }

      const { user, workspace } = result[0];

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!workspace) {
        return { success: false, error: 'Workspace not found' };
      }

      return {
        success: true,
        data: {
          user,
          workspace,
        },
      };
    } catch (error) {
      console.error(
        `❌ USER_WORKSPACE_OPTIMIZED_FETCH_FAILED: ${userId}`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const userWorkspaceService = new UserWorkspaceService();
