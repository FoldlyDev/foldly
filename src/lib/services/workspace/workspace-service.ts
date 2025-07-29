import { db } from '@/lib/database/connection';
import { workspaces } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type {
  Workspace,
  WorkspaceUpdate,
  DatabaseResult,
} from '@/lib/database/types';

export class WorkspaceService {
  /**
   * Create a new workspace for a user
   * Handles 1:1 constraint with ON CONFLICT DO NOTHING
   */
  async createWorkspace(
    userId: string,
    name: string = 'My Workspace'
  ): Promise<DatabaseResult<Workspace>> {
    try {
      // First check if workspace already exists
      const existing = await this.getWorkspaceByUserId(userId);
      if (existing) {
        return { success: true, data: existing };
      }

      const [workspace] = await db
        .insert(workspaces)
        .values({
          userId,
          name,
          createdAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!workspace) {
        // Workspace already exists due to unique constraint
        const existingWorkspace = await this.getWorkspaceByUserId(userId);
        if (existingWorkspace) {
          return { success: true, data: existingWorkspace };
        }
        return {
          success: false,
          error: 'Failed to create or retrieve workspace',
        };
      }

      console.log(`✅ WORKSPACE_CREATED: ${workspace.id} for user ${userId}`);
      return {
        success: true,
        data: workspace,
      };
    } catch (error) {
      console.error(`❌ WORKSPACE_CREATE_FAILED: User ${userId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get workspace by user ID (for 1:1 relationship)
   */
  async getWorkspaceByUserId(userId: string): Promise<Workspace | null> {
    try {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .limit(1);

      return workspace ? workspace : null;
    } catch (error) {
      console.error(`❌ WORKSPACE_FETCH_FAILED: User ${userId}`, error);
      return null;
    }
  }

  /**
   * Update workspace (used by workspace feature)
   */
  async updateWorkspace(
    workspaceId: string,
    updates: WorkspaceUpdate
  ): Promise<DatabaseResult<Workspace>> {
    try {
      const [updatedWorkspace] = await db
        .update(workspaces)
        .set({ ...updates })
        .where(eq(workspaces.id, workspaceId))
        .returning();

      if (!updatedWorkspace) {
        return { success: false, error: 'Workspace not found' };
      }

      console.log(`✅ WORKSPACE_UPDATED: ${workspaceId}`);
      return {
        success: true,
        data: updatedWorkspace,
      };
    } catch (error) {
      console.error(`❌ WORKSPACE_UPDATE_FAILED: ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if workspace exists (for idempotency)
   */
  async hasExistingWorkspace(userId: string): Promise<boolean> {
    try {
      const [workspace] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .limit(1);

      return !!workspace;
    } catch (error) {
      console.error(`❌ WORKSPACE_CHECK_FAILED: User ${userId}`, error);
      return false;
    }
  }

  /**
   * Get workspace by ID (for direct access)
   */
  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    try {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      return workspace ? workspace : null;
    } catch (error) {
      console.error(`❌ WORKSPACE_FETCH_BY_ID_FAILED: ${workspaceId}`, error);
      return null;
    }
  }

  /**
   * Delete workspace (for cleanup/admin operations)
   */
  async deleteWorkspace(workspaceId: string): Promise<DatabaseResult<void>> {
    try {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

      console.log(`✅ WORKSPACE_DELETED: ${workspaceId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ WORKSPACE_DELETE_FAILED: ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();
