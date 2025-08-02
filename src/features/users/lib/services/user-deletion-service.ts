// =============================================================================
// USER DELETION SERVICE - User Account Deletion Operations
// =============================================================================

import { db } from '@/lib/database/connection';
import { users, workspaces, links, files, batches, folders } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { UserId } from '@/types/ids';

export interface UserDeletionResult {
  success: boolean;
  deletedItems?: {
    workspaces: number;
    links: number;
    files: number;
    batches: number;
    folders: number;
  };
  error?: string;
}

export class UserDeletionService {
  /**
   * Delete a user account and all associated data
   */
  async deleteUser(userId: UserId): Promise<UserDeletionResult> {
    try {
      // Start a transaction to ensure all deletions are atomic
      const result = await db.transaction(async (tx) => {
        // Get all user's workspaces for cascading deletes
        const userWorkspaces = await tx
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.userId, userId));

        const workspaceIds = userWorkspaces.map(w => w.id);

        // Delete all files in user's workspaces
        const filesDeleted = await tx
          .delete(files)
          .where(eq(files.userId, userId))
          .returning({ id: files.id });

        // Delete all folders in user's workspaces
        let foldersDeleted: { id: string }[] = [];
        for (const workspaceId of workspaceIds) {
          const deleted = await tx
            .delete(folders)
            .where(eq(folders.workspaceId, workspaceId))
            .returning({ id: folders.id });
          foldersDeleted = [...foldersDeleted, ...deleted];
        }

        // Delete all batches owned by user
        const batchesDeleted = await tx
          .delete(batches)
          .where(eq(batches.userId, userId))
          .returning({ id: batches.id });

        // Delete all links owned by user
        const linksDeleted = await tx
          .delete(links)
          .where(eq(links.userId, userId))
          .returning({ id: links.id });

        // Delete all workspaces
        const workspacesDeleted = await tx
          .delete(workspaces)
          .where(eq(workspaces.userId, userId))
          .returning({ id: workspaces.id });

        // Finally, delete the user
        await tx
          .delete(users)
          .where(eq(users.id, userId));

        return {
          workspaces: workspacesDeleted.length,
          links: linksDeleted.length,
          files: filesDeleted.length,
          batches: batchesDeleted.length,
          folders: foldersDeleted.length,
        };
      });

      return {
        success: true,
        deletedItems: result,
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }

}

// Export singleton instance
export const userDeletionService = new UserDeletionService();