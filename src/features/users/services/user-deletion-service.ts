import { db } from '@/lib/database/connection';
import {
  users,
  workspaces,
  folders,
  files,
  links,
  batches,
} from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types';

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

        // Step 1: Get user's workspaces and links for file deletion
        const userWorkspaces = await tx
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.userId, userId));
        
        const userLinks = await tx
          .select({ id: links.id })
          .from(links)
          .where(eq(links.userId, userId));

        // Delete files from workspaces and links in batch operations
        const workspaceIds = userWorkspaces.map(w => w.id);
        const linkIds = userLinks.map(l => l.id);
        
        let deletedFiles: { id: string }[] = [];
        
        // Delete all workspace files in one query
        if (workspaceIds.length > 0) {
          const workspaceFiles = await tx
            .delete(files)
            .where(sql`${files.workspaceId} = ANY(ARRAY[${sql.join(workspaceIds, sql`, `)}]::uuid[])`)
            .returning({ id: files.id });
          deletedFiles = [...deletedFiles, ...workspaceFiles];
        }
        
        // Delete all link files in one query
        if (linkIds.length > 0) {
          const linkFiles = await tx
            .delete(files)
            .where(sql`${files.linkId} = ANY(ARRAY[${sql.join(linkIds, sql`, `)}]::uuid[])`)
            .returning({ id: files.id });
          deletedFiles = [...deletedFiles, ...linkFiles];
        }
        
        deletedRecords.files = deletedFiles.length;
        console.log(
          `📄 DELETED_FILES: ${deletedRecords.files} files deleted for user ${userId}`
        );

        // Step 2: Count batches before links are deleted (CASCADE will delete them)
        let batchCount = 0;
        if (linkIds.length > 0) {
          const batchCountResult = await tx
            .select({ count: sql<number>`count(*)` })
            .from(batches)
            .where(sql`${batches.linkId} = ANY(ARRAY[${sql.join(linkIds, sql`, `)}]::uuid[])`);
          batchCount = Number(batchCountResult[0]?.count || 0);
        }
        deletedRecords.batches = batchCount;
        console.log(
          `📦 DELETED_BATCHES: ${deletedRecords.batches} batches deleted for user ${userId}`
        );

        // Step 3: Count folders (they are deleted via CASCADE when workspaces/links are deleted)
        // Count workspace folders
        const workspaceFolderCount = await tx
          .select({ count: sql<number>`count(*)` })
          .from(folders)
          .innerJoin(workspaces, eq(folders.workspaceId, workspaces.id))
          .where(eq(workspaces.userId, userId))
          .then(result => Number(result[0]?.count || 0));
        
        // Count link folders
        const linkFolderCount = await tx
          .select({ count: sql<number>`count(*)` })
          .from(folders)
          .innerJoin(links, eq(folders.linkId, links.id))
          .where(eq(links.userId, userId))
          .then(result => Number(result[0]?.count || 0));
        
        deletedRecords.folders = workspaceFolderCount + linkFolderCount;
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
      // Count files through workspace and link relationships
      const workspaceFiles = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
        .where(eq(workspaces.userId, userId));

      const linkFiles = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .innerJoin(links, eq(files.linkId, links.id))
        .where(eq(links.userId, userId));

      const fileCount = Number(workspaceFiles[0]?.count || 0) + Number(linkFiles[0]?.count || 0);

      // Count folders through workspace and link relationships
      const workspaceFolders = await db
        .select({ count: sql<number>`count(*)` })
        .from(folders)
        .innerJoin(workspaces, eq(folders.workspaceId, workspaces.id))
        .where(eq(workspaces.userId, userId));
      
      const linkFolders = await db
        .select({ count: sql<number>`count(*)` })
        .from(folders)
        .innerJoin(links, eq(folders.linkId, links.id))
        .where(eq(links.userId, userId));
      
      const folderCount = Number(workspaceFolders[0]?.count || 0) + Number(linkFolders[0]?.count || 0);

      const linkCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(links)
        .where(eq(links.userId, userId));

      // Count batches through link relationships
      const batchCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(batches)
        .innerJoin(links, eq(batches.linkId, links.id))
        .where(eq(links.userId, userId));

      const workspaceCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

      return {
        files: fileCount,
        folders: folderCount,
        links: Number(linkCount[0]?.count || 0),
        batches: Number(batchCount[0]?.count || 0),
        workspaces: Number(workspaceCount[0]?.count || 0),
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
