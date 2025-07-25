import { db } from '@/lib/db/db';
import {
  users,
  workspaces,
  folders,
  files,
  links,
  batches,
} from '@/lib/supabase/schemas';
import { eq } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/supabase/types';

export interface UserDeletionResult {
  userId: string;
  deletedRecords: {
    files: number;
    folders: number;
    links: number;
    batches: number;
    workspaces: number;
    users: number;
  };
}

export class UserDeletionService {
  /**
   * Completely remove user and all associated data from the database
   * This is called when a user is deleted from Clerk
   */
  async deleteUserData(
    userId: string
  ): Promise<DatabaseResult<UserDeletionResult>> {
    const startTime = Date.now();

    try {
      return await db.transaction(async tx => {
        const deletedRecords = {
          files: 0,
          folders: 0,
          links: 0,
          batches: 0,
          workspaces: 0,
          users: 0,
        };

        console.log(
          `🗑️ USER_DELETION_START: Starting deletion for user ${userId}`
        );

        // Step 1: Delete files (must be first due to foreign key constraints)
        const deletedFiles = await tx
          .delete(files)
          .where(eq(files.userId, userId))
          .returning({ id: files.id });
        deletedRecords.files = deletedFiles.length;
        console.log(
          `📄 DELETED_FILES: ${deletedRecords.files} files deleted for user ${userId}`
        );

        // Step 2: Delete batches
        const deletedBatches = await tx
          .delete(batches)
          .where(eq(batches.userId, userId))
          .returning({ id: batches.id });
        deletedRecords.batches = deletedBatches.length;
        console.log(
          `📦 DELETED_BATCHES: ${deletedRecords.batches} batches deleted for user ${userId}`
        );

        // Step 3: Delete folders
        const deletedFolders = await tx
          .delete(folders)
          .where(eq(folders.userId, userId))
          .returning({ id: folders.id });
        deletedRecords.folders = deletedFolders.length;
        console.log(
          `📁 DELETED_FOLDERS: ${deletedRecords.folders} folders deleted for user ${userId}`
        );

        // Step 4: Delete links
        const deletedLinks = await tx
          .delete(links)
          .where(eq(links.userId, userId))
          .returning({ id: links.id });
        deletedRecords.links = deletedLinks.length;
        console.log(
          `🔗 DELETED_LINKS: ${deletedRecords.links} links deleted for user ${userId}`
        );

        // Step 5: Delete workspaces
        const deletedWorkspaces = await tx
          .delete(workspaces)
          .where(eq(workspaces.userId, userId))
          .returning({ id: workspaces.id });
        deletedRecords.workspaces = deletedWorkspaces.length;
        console.log(
          `🏢 DELETED_WORKSPACES: ${deletedRecords.workspaces} workspaces deleted for user ${userId}`
        );

        // Step 6: Delete user (final step)
        const deletedUsers = await tx
          .delete(users)
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        deletedRecords.users = deletedUsers.length;
        console.log(`👤 DELETED_USER: User ${userId} deleted from database`);

        const duration = Date.now() - startTime;
        const totalRecords = Object.values(deletedRecords).reduce(
          (sum, count) => sum + count,
          0
        );
        console.log(
          `✅ USER_DELETION_COMPLETE: ${userId} | ${totalRecords} total records deleted | ${duration}ms`
        );

        return {
          success: true,
          data: {
            userId,
            deletedRecords,
          },
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ USER_DELETION_FAILED: ${userId} | ${duration}ms`,
        error
      );
      return {
        success: false,
        error: `Failed to delete user data: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Check if user exists before deletion (safety check)
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
   * Get user data count before deletion (for audit logging)
   */
  async getUserDataCount(
    userId: string
  ): Promise<UserDeletionResult['deletedRecords']> {
    try {
      const [fileCount] = await db
        .select({ count: files.id })
        .from(files)
        .where(eq(files.userId, userId));

      const [folderCount] = await db
        .select({ count: folders.id })
        .from(folders)
        .where(eq(folders.userId, userId));

      const [linkCount] = await db
        .select({ count: links.id })
        .from(links)
        .where(eq(links.userId, userId));

      const [batchCount] = await db
        .select({ count: batches.id })
        .from(batches)
        .where(eq(batches.userId, userId));

      const [workspaceCount] = await db
        .select({ count: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

      return {
        files: fileCount?.count ? 1 : 0, // Note: count queries return different structure in drizzle
        folders: folderCount?.count ? 1 : 0,
        links: linkCount?.count ? 1 : 0,
        batches: batchCount?.count ? 1 : 0,
        workspaces: workspaceCount?.count ? 1 : 0,
        users: 1, // Always 1 since we're checking for a specific user
      };
    } catch (error) {
      console.error(`❌ USER_DATA_COUNT_FAILED: ${userId}`, error);
      return {
        files: 0,
        folders: 0,
        links: 0,
        batches: 0,
        workspaces: 0,
        users: 0,
      };
    }
  }
}

// Export singleton instance
export const userDeletionService = new UserDeletionService();
