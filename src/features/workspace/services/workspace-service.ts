import { db } from '@/lib/database/connection';
import { workspaces } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type {
  Workspace,
  WorkspaceUpdate,
  DatabaseResult,
} from '@/lib/database/types';
import { logger } from '@/lib/services/logging/logger';
import { ERROR_CODES } from '@/lib/types/error-response';

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

      logger.info('Workspace created successfully', { workspaceId: workspace.id, userId });
      return {
        success: true,
        data: workspace,
      };
    } catch (error) {
      logger.error('Workspace creation failed', error, { userId });
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

      return workspace || null;
    } catch (error) {
      logger.error('Failed to fetch workspace by user ID', error, { userId });
      return null;
    }
  }

  /**
   * Update workspace with authorization check
   * @param workspaceId - The workspace ID to update
   * @param updates - The updates to apply
   * @param userId - The user ID requesting the update (for authorization)
   */
  async updateWorkspace(
    workspaceId: string,
    updates: WorkspaceUpdate,
    userId?: string
  ): Promise<DatabaseResult<Workspace>> {
    try {
      // If userId is provided, verify ownership first
      if (userId) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) {
          logger.warn('Workspace not found for update', { workspaceId, userId });
          return { success: false, error: 'Workspace not found', code: ERROR_CODES.NOT_FOUND };
        }
        
        if (workspace.userId !== userId) {
          logger.logSecurityEvent(
            'Unauthorized workspace update attempt',
            'high',
            { workspaceId, userId, ownerId: workspace.userId }
          );
          return { 
            success: false, 
            error: 'You do not have permission to update this workspace',
            code: ERROR_CODES.FORBIDDEN 
          };
        }
      }

      const [updatedWorkspace] = await db
        .update(workspaces)
        .set({ ...updates })
        .where(eq(workspaces.id, workspaceId))
        .returning();

      if (!updatedWorkspace) {
        return { success: false, error: 'Workspace not found', code: ERROR_CODES.NOT_FOUND };
      }

      logger.info('Workspace updated successfully', userId ? { workspaceId, userId } : { workspaceId });
      return {
        success: true,
        data: updatedWorkspace,
      };
    } catch (error) {
      logger.error('Workspace update failed', error, userId ? { workspaceId, userId } : { workspaceId });
      return { 
        success: false, 
        error: (error as Error).message,
        code: ERROR_CODES.DATABASE_ERROR 
      };
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
      logger.error('Failed to check workspace existence', error, { userId });
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

      return workspace || null;
    } catch (error) {
      logger.error('Failed to fetch workspace by ID', error, { workspaceId });
      return null;
    }
  }

  /**
   * Delete workspace with authorization check
   * @param workspaceId - The workspace ID to delete
   * @param userId - The user ID requesting the deletion (for authorization)
   */
  async deleteWorkspace(
    workspaceId: string,
    userId?: string
  ): Promise<DatabaseResult<void>> {
    try {
      // If userId is provided, verify ownership first
      if (userId) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) {
          logger.warn('Workspace not found for deletion', { workspaceId, userId });
          return { success: false, error: 'Workspace not found', code: ERROR_CODES.NOT_FOUND };
        }
        
        if (workspace.userId !== userId) {
          logger.logSecurityEvent(
            'Unauthorized workspace deletion attempt',
            'critical',
            { workspaceId, userId, ownerId: workspace.userId }
          );
          return { 
            success: false, 
            error: 'You do not have permission to delete this workspace',
            code: ERROR_CODES.FORBIDDEN 
          };
        }
      }

      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

      logger.info('Workspace deleted successfully', userId ? { workspaceId, userId } : { workspaceId });
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Workspace deletion failed', error, userId ? { workspaceId, userId } : { workspaceId });
      return { 
        success: false, 
        error: (error as Error).message,
        code: ERROR_CODES.DATABASE_ERROR 
      };
    }
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();