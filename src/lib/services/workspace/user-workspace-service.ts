import { db } from '@/lib/db/db';
import { users, workspaces } from '@/lib/supabase/schemas';
import { eq } from 'drizzle-orm';
import { workspaceService } from './workspace-service';
import type {
  User,
  UserInsert,
  Workspace,
  DatabaseResult,
} from '@/lib/supabase/types';
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
        const [user] = await tx
          .insert(users)
          .values({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            subscriptionTier: 'free',
            storageUsed: 0,
            storageLimit: 2147483648, // 2GB default
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
              workspace: {
                ...existingWorkspace,
                updatedAt: existingWorkspace.createdAt,
              },
            },
          };
        }

        const duration = Date.now() - startTime;
        console.log(`✅ USER_WORKSPACE_CREATED: ${user.id} | ${duration}ms`);

        return {
          success: true,
          data: {
            user,
            workspace: { ...workspace, updatedAt: workspace.createdAt },
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
   * Get user with their workspace (for dashboard-home feature)
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
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatarUrl: userData.avatarUrl,
          subscriptionTier: 'free',
          storageUsed: 0,
          storageLimit: 2147483648,
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
          workspace: { ...workspace, updatedAt: workspace.createdAt },
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
