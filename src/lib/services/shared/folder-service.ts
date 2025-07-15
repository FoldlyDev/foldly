import { db } from '@/lib/db/db';
import { folders, files } from '@/lib/supabase/schemas';
import { eq, and, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/supabase/types/common';

// Use the drizzle-generated types
type DbFolder = typeof folders.$inferSelect;
type DbFolderInsert = typeof folders.$inferInsert;
type DbFolderUpdate = Partial<DbFolderInsert>;

export class FolderService {
  /**
   * Get all folders for a workspace
   */
  async getFoldersByWorkspace(
    workspaceId: string
  ): Promise<DatabaseResult<DbFolder[]>> {
    try {
      const workspaceFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.workspaceId, workspaceId))
        .orderBy(folders.path);

      console.log(
        `✅ FOLDERS_FETCHED: ${workspaceFolders.length} folders for workspace ${workspaceId}`
      );
      return { success: true, data: workspaceFolders };
    } catch (error) {
      console.error(`❌ FOLDERS_FETCH_FAILED: Workspace ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all folders for a workspace ordered by sortOrder
   */
  async getFoldersByWorkspaceOrdered(
    workspaceId: string
  ): Promise<DatabaseResult<DbFolder[]>> {
    try {
      const workspaceFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.workspaceId, workspaceId))
        .orderBy(folders.sortOrder, folders.path);

      console.log(
        `✅ FOLDERS_FETCHED_ORDERED: ${workspaceFolders.length} folders for workspace ${workspaceId}`
      );
      return { success: true, data: workspaceFolders };
    } catch (error) {
      console.error(
        `❌ FOLDERS_FETCH_ORDERED_FAILED: Workspace ${workspaceId}`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(folderId: string): Promise<DatabaseResult<DbFolder>> {
    try {
      const [folder] = await db
        .select()
        .from(folders)
        .where(eq(folders.id, folderId))
        .limit(1);

      if (!folder) {
        return { success: false, error: 'Folder not found' };
      }

      return { success: true, data: folder };
    } catch (error) {
      console.error(`❌ FOLDER_FETCH_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    folderData: DbFolderInsert
  ): Promise<DatabaseResult<DbFolder>> {
    try {
      const [newFolder] = await db
        .insert(folders)
        .values({
          ...folderData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newFolder) {
        return { success: false, error: 'Failed to create folder' };
      }

      console.log(`✅ FOLDER_CREATED: ${newFolder.id} - ${newFolder.name}`);
      return { success: true, data: newFolder };
    } catch (error) {
      console.error(`❌ FOLDER_CREATE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update folder
   */
  async updateFolder(
    folderId: string,
    updates: DbFolderUpdate
  ): Promise<DatabaseResult<DbFolder>> {
    try {
      const [updatedFolder] = await db
        .update(folders)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(folders.id, folderId))
        .returning();

      if (!updatedFolder) {
        return { success: false, error: 'Folder not found' };
      }

      console.log(`✅ FOLDER_UPDATED: ${folderId}`);
      return { success: true, data: updatedFolder };
    } catch (error) {
      console.error(`❌ FOLDER_UPDATE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete folder (and all its contents)
   */
  async deleteFolder(folderId: string): Promise<DatabaseResult<void>> {
    try {
      // First delete all files in the folder
      await db.delete(files).where(eq(files.folderId, folderId));

      // Then delete the folder itself
      await db.delete(folders).where(eq(folders.id, folderId));

      console.log(`✅ FOLDER_DELETED: ${folderId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FOLDER_DELETE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get folder structure statistics
   */
  async getFolderStats(
    workspaceId: string
  ): Promise<DatabaseResult<{ folderCount: number; fileCount: number }>> {
    try {
      const [folderStats] = await db
        .select({
          folderCount: sql<number>`COUNT(DISTINCT ${folders.id})`,
          fileCount: sql<number>`COUNT(DISTINCT ${files.id})`,
        })
        .from(folders)
        .leftJoin(files, eq(files.folderId, folders.id))
        .where(eq(folders.workspaceId, workspaceId));

      return {
        success: true,
        data: {
          folderCount: folderStats?.folderCount || 0,
          fileCount: folderStats?.fileCount || 0,
        },
      };
    } catch (error) {
      console.error(`❌ FOLDER_STATS_FAILED: ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Rename folder (simplified updateFolder for just name changes)
   */
  async renameFolder(
    folderId: string,
    newName: string
  ): Promise<DatabaseResult<DbFolder>> {
    try {
      // Get current folder to update path
      const folderResult = await this.getFolderById(folderId);
      if (!folderResult.success) {
        return folderResult;
      }

      const currentFolder = folderResult.data;

      // Calculate new path
      const pathParts = currentFolder.path.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const [updatedFolder] = await db
        .update(folders)
        .set({
          name: newName,
          path: newPath,
          updatedAt: new Date(),
        })
        .where(eq(folders.id, folderId))
        .returning();

      if (!updatedFolder) {
        return { success: false, error: 'Folder not found' };
      }

      console.log(`✅ FOLDER_RENAMED: ${folderId} to "${newName}"`);
      return { success: true, data: updatedFolder };
    } catch (error) {
      console.error(`❌ FOLDER_RENAME_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Move folder to different parent
   */
  async moveFolder(
    folderId: string,
    newParentId: string | null
  ): Promise<DatabaseResult<DbFolder>> {
    try {
      // Get current folder details
      const folderResult = await this.getFolderById(folderId);
      if (!folderResult.success) {
        return folderResult;
      }

      const currentFolder = folderResult.data;
      let newPath = currentFolder.name;
      let newDepth = 0;

      // Calculate new path and depth based on parent
      if (newParentId) {
        const parentResult = await this.getFolderById(newParentId);
        if (!parentResult.success) {
          return { success: false, error: 'Parent folder not found' };
        }

        const parentFolder = parentResult.data;
        newPath = `${parentFolder.path}/${currentFolder.name}`;
        newDepth = parentFolder.depth + 1;
      }

      const [movedFolder] = await db
        .update(folders)
        .set({
          parentFolderId: newParentId,
          path: newPath,
          depth: newDepth,
          updatedAt: new Date(),
        })
        .where(eq(folders.id, folderId))
        .returning();

      if (!movedFolder) {
        return { success: false, error: 'Folder not found' };
      }

      console.log(`✅ FOLDER_MOVED: ${folderId} to parent ${newParentId}`);
      return { success: true, data: movedFolder };
    } catch (error) {
      console.error(`❌ FOLDER_MOVE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch delete multiple folders
   */
  async batchDeleteFolders(folderIds: string[]): Promise<DatabaseResult<void>> {
    try {
      if (folderIds.length === 0) {
        return { success: true, data: undefined };
      }

      // Delete all files in these folders first
      for (const folderId of folderIds) {
        await db.delete(files).where(eq(files.folderId, folderId));
      }

      // Delete the folders
      for (const folderId of folderIds) {
        await db.delete(folders).where(eq(folders.id, folderId));
      }

      console.log(`✅ FOLDERS_BATCH_DELETED: ${folderIds.length} folders`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FOLDERS_BATCH_DELETE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}
