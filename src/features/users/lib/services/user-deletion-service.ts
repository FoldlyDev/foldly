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
        let filesDeleted: { id: string }[] = [];
        for (const workspaceId of workspaceIds) {
          const deleted = await tx
            .delete(files)
            .where(eq(files.workspaceId, workspaceId))
            .returning({ id: files.id });
          filesDeleted = [...filesDeleted, ...deleted];
        }

        // Also delete files from user's links
        const userLinks = await tx
          .select({ id: links.id })
          .from(links)
          .where(eq(links.userId, userId));
        
        for (const link of userLinks) {
          const deleted = await tx
            .delete(files)
            .where(eq(files.linkId, link.id))
            .returning({ id: files.id });
          filesDeleted = [...filesDeleted, ...deleted];
        }

        // Delete all folders in user's workspaces
        let foldersDeleted: { id: string }[] = [];
        for (const workspaceId of workspaceIds) {
          const deleted = await tx
            .delete(folders)
            .where(eq(folders.workspaceId, workspaceId))
            .returning({ id: folders.id });
          foldersDeleted = [...foldersDeleted, ...deleted];
        }

        // Also delete folders from user's links
        for (const link of userLinks) {
          const deleted = await tx
            .delete(folders)
            .where(eq(folders.linkId, link.id))
            .returning({ id: folders.id });
          foldersDeleted = [...foldersDeleted, ...deleted];
        }

        // Delete all batches (they belong to links which will be deleted)
        let batchesDeleted: { id: string }[] = [];
        // Batches are deleted via CASCADE when links are deleted

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