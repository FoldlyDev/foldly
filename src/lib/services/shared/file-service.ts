import { db } from '@/lib/db/db';
import { files, folders, links } from '@/lib/supabase/schemas';
import { eq, and, sql, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/supabase/types/common';

// Use the drizzle-generated types
type DbFile = typeof files.$inferSelect;
type DbFileInsert = typeof files.$inferInsert;
type DbFileUpdate = Partial<DbFileInsert>;
type DbFolder = typeof folders.$inferSelect;

export class FileService {
  /**
   * Get all files for a workspace
   */
  async getFilesByWorkspace(
    workspaceId: string
  ): Promise<DatabaseResult<DbFile[]>> {
    try {
      // Get files via the links relationship (files -> links -> workspaces)
      const workspaceFiles = await db
        .select({
          file: files,
        })
        .from(files)
        .innerJoin(links, eq(files.linkId, links.id))
        .where(eq(links.workspaceId, workspaceId))
        .orderBy(files.createdAt);

      const flatFiles = workspaceFiles.map(({ file }) => file);

      console.log(
        `✅ FILES_FETCHED: ${flatFiles.length} files for workspace ${workspaceId}`
      );
      return { success: true, data: flatFiles };
    } catch (error) {
      console.error(`❌ FILES_FETCH_FAILED: Workspace ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get files by folder ID
   */
  async getFilesByFolder(folderId: string): Promise<DatabaseResult<DbFile[]>> {
    try {
      const folderFiles = await db
        .select()
        .from(files)
        .where(eq(files.folderId, folderId))
        .orderBy(files.createdAt);

      return { success: true, data: folderFiles };
    } catch (error) {
      console.error(`❌ FILES_BY_FOLDER_FETCH_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get root files (no folder) for a workspace
   */
  async getRootFilesByWorkspace(
    workspaceId: string
  ): Promise<DatabaseResult<DbFile[]>> {
    try {
      // Get files that have no folder but belong to a workspace
      // This requires joining with other tables since files don't directly reference workspace
      const rootFiles = await db
        .select({
          file: files,
        })
        .from(files)
        .leftJoin(folders, eq(files.folderId, folders.id))
        .where(
          and(
            isNull(files.folderId), // No folder (root level)
            eq(folders.workspaceId, workspaceId) // Belongs to workspace
          )
        )
        .orderBy(files.createdAt);

      const flatFiles = rootFiles.map(({ file }) => file);

      return { success: true, data: flatFiles };
    } catch (error) {
      console.error(
        `❌ ROOT_FILES_FETCH_FAILED: Workspace ${workspaceId}`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<DatabaseResult<DbFile>> {
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file) {
        return { success: false, error: 'File not found' };
      }

      return { success: true, data: file };
    } catch (error) {
      console.error(`❌ FILE_FETCH_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create a new file record
   */
  async createFile(fileData: DbFileInsert): Promise<DatabaseResult<DbFile>> {
    try {
      const [newFile] = await db
        .insert(files)
        .values({
          ...fileData,
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newFile) {
        return { success: false, error: 'Failed to create file' };
      }

      console.log(`✅ FILE_CREATED: ${newFile.id} - ${newFile.fileName}`);
      return { success: true, data: newFile };
    } catch (error) {
      console.error(`❌ FILE_CREATE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update file
   */
  async updateFile(
    fileId: string,
    updates: DbFileUpdate
  ): Promise<DatabaseResult<DbFile>> {
    try {
      const [updatedFile] = await db
        .update(files)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(files.id, fileId))
        .returning();

      if (!updatedFile) {
        return { success: false, error: 'File not found' };
      }

      console.log(`✅ FILE_UPDATED: ${fileId}`);
      return { success: true, data: updatedFile };
    } catch (error) {
      console.error(`❌ FILE_UPDATE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<DatabaseResult<void>> {
    try {
      await db.delete(files).where(eq(files.id, fileId));

      console.log(`✅ FILE_DELETED: ${fileId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FILE_DELETE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Move file to different folder
   */
  async moveFile(
    fileId: string,
    newFolderId: string | null
  ): Promise<DatabaseResult<DbFile>> {
    try {
      const [movedFile] = await db
        .update(files)
        .set({
          folderId: newFolderId,
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId))
        .returning();

      if (!movedFile) {
        return { success: false, error: 'File not found' };
      }

      console.log(`✅ FILE_MOVED: ${fileId} to folder ${newFolderId}`);
      return { success: true, data: movedFile };
    } catch (error) {
      console.error(`❌ FILE_MOVE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get workspace tree data (files and folders combined)
   */
  async getWorkspaceTreeData(
    workspaceId: string
  ): Promise<DatabaseResult<{ files: DbFile[]; folders: DbFolder[] }>> {
    try {
      // Get all folders for the workspace
      const workspaceFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.workspaceId, workspaceId))
        .orderBy(folders.depth, folders.path);

      // Get all files for the workspace (both in folders and root)
      const workspaceFiles = await db
        .select({
          file: files,
          folder: folders,
        })
        .from(files)
        .leftJoin(folders, eq(files.folderId, folders.id))
        .where(eq(folders.workspaceId, workspaceId))
        .orderBy(files.createdAt);

      const flatFiles = workspaceFiles.map(({ file }) => file);

      return {
        success: true,
        data: {
          files: flatFiles,
          folders: workspaceFolders,
        },
      };
    } catch (error) {
      console.error(`❌ WORKSPACE_TREE_FETCH_FAILED: ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update download count for a file
   */
  async incrementDownloadCount(fileId: string): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(files)
        .set({
          downloadCount: sql`${files.downloadCount} + 1`,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));

      console.log(`✅ FILE_DOWNLOAD_COUNT_UPDATED: ${fileId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FILE_DOWNLOAD_COUNT_UPDATE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
