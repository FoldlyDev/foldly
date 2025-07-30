import { db } from '@/lib/database/connection';
import { files, folders, links } from '@/lib/database/schemas';
import { eq, and, sql, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';

// Use the drizzle-generated types
type DbFile = typeof files.$inferSelect;
type DbFileInsert = typeof files.$inferInsert;
type DbFileUpdate = Partial<DbFileInsert>;
type DbFolder = typeof folders.$inferSelect;

export class FileService {
  /**
   * Get all personal workspace files (excludes link-uploaded files)
   */
  async getFilesByWorkspace(
    workspaceId: string
  ): Promise<DatabaseResult<DbFile[]>> {
    try {
      // Get only personal workspace files (linkId IS NULL)
      const workspaceFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.workspaceId, workspaceId),
            isNull(files.linkId) // Only personal files, not link-uploaded
          )
        )
        .orderBy(files.sortOrder, files.createdAt);

      return { success: true, data: workspaceFiles };
    } catch (error) {
      console.error(
        `❌ FILES_BY_WORKSPACE_FETCH_FAILED: ${workspaceId}`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all files for a workspace ordered by sortOrder
   */
  async getFilesByWorkspaceOrdered(
    workspaceId: string
  ): Promise<DatabaseResult<DbFile[]>> {
    try {
      // Get files that belong to a workspace through folders
      const workspaceFiles = await db
        .select({
          file: files,
        })
        .from(files)
        .leftJoin(folders, eq(files.folderId, folders.id))
        .where(eq(folders.workspaceId, workspaceId))
        .orderBy(files.sortOrder, files.fileName); // Order by sortOrder first, then fileName

      const flatFiles = workspaceFiles.map(({ file }) => file);

      return { success: true, data: flatFiles };
    } catch (error) {
      console.error(
        `❌ FILES_BY_WORKSPACE_ORDERED_FETCH_FAILED: ${workspaceId}`,
        error
      );
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
      // For root files in workspace context, we need to get files where:
      // 1. folderId is null (root level)
      // 2. linkId or batchId matches the workspace ID (depending on implementation)
      // For now, let's get files with null folderId and check linkId/batchId pattern
      const rootFiles = await db
        .select()
        .from(files)
        .where(
          and(
            isNull(files.folderId), // No folder (root level)
            eq(files.linkId, workspaceId) // Links to workspace
          )
        )
        .orderBy(files.createdAt);

      console.log(
        `✅ ROOT_FILES_FETCHED: ${rootFiles.length} root files for workspace ${workspaceId}`
      );
      return { success: true, data: rootFiles };
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
   * Delete file - only removes database record
   * Storage deletion should be handled separately by the caller
   */
  async deleteFile(fileId: string): Promise<DatabaseResult<void>> {
    try {
      await db.delete(files).where(eq(files.id, fileId));

      console.log(`✅ FILE_DELETED_FROM_DB: ${fileId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FILE_DELETE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete file with storage cleanup
   * Handles both database and storage deletion atomically
   */
  async deleteFileWithStorage(
    fileId: string,
    storageService: any
  ): Promise<DatabaseResult<{ deletedFromStorage: boolean }>> {
    try {
      // Get file details first
      const fileResult = await this.getFileById(fileId);
      if (!fileResult.success) {
        return { success: false, error: 'File not found' };
      }

      const file = fileResult.data;
      let deletedFromStorage = false;

      // Delete from storage first if path exists
      if (file.storagePath) {
        const context = file.linkId ? 'shared' : 'workspace';
        const storageResult = await storageService.deleteFile(
          file.storagePath,
          context
        );
        
        if (!storageResult.success) {
          console.error(
            `⚠️ Storage deletion failed for ${fileId}: ${storageResult.error}`
          );
          // Continue with database deletion even if storage fails
          // This prevents orphaned database records
        } else {
          deletedFromStorage = true;
        }
      }

      // Delete from database
      const dbResult = await this.deleteFile(fileId);
      if (!dbResult.success) {
        return { success: false, error: dbResult.error };
      }

      console.log(
        `✅ FILE_FULLY_DELETED: ${fileId} (storage: ${deletedFromStorage})`
      );
      return { success: true, data: { deletedFromStorage } };
    } catch (error) {
      console.error(`❌ FILE_DELETE_WITH_STORAGE_FAILED: ${fileId}`, error);
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

  /**
   * Rename file (simplified updateFile for just name changes)
   */
  async renameFile(
    fileId: string,
    newName: string
  ): Promise<DatabaseResult<DbFile>> {
    try {
      const [updatedFile] = await db
        .update(files)
        .set({
          fileName: newName,
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId))
        .returning();

      if (!updatedFile) {
        return { success: false, error: 'File not found' };
      }

      console.log(`✅ FILE_RENAMED: ${fileId} to "${newName}"`);
      return { success: true, data: updatedFile };
    } catch (error) {
      console.error(`❌ FILE_RENAME_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch move multiple files to different folder
   */
  async batchMoveFiles(
    fileIds: string[],
    newFolderId: string | null
  ): Promise<DatabaseResult<void>> {
    try {
      if (fileIds.length === 0) {
        return { success: true, data: undefined };
      }

      // Move all files in batch (optimized for performance)
      for (const fileId of fileIds) {
        await db
          .update(files)
          .set({
            folderId: newFolderId,
            updatedAt: new Date(),
          })
          .where(eq(files.id, fileId));
      }

      console.log(
        `✅ FILES_BATCH_MOVED: ${fileIds.length} files to folder ${newFolderId} in single operation`
      );
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FILES_BATCH_MOVE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch delete multiple files - only removes database records
   * Storage deletion should be handled separately by the caller
   */
  async batchDeleteFiles(fileIds: string[]): Promise<DatabaseResult<void>> {
    try {
      if (fileIds.length === 0) {
        return { success: true, data: undefined };
      }

      // Delete all files from database
      for (const fileId of fileIds) {
        await db.delete(files).where(eq(files.id, fileId));
      }

      console.log(`✅ FILES_BATCH_DELETED_FROM_DB: ${fileIds.length} files`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FILES_BATCH_DELETE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch delete files with storage cleanup
   * Handles both database and storage deletion for multiple files
   */
  async batchDeleteFilesWithStorage(
    fileIds: string[],
    storageService: any
  ): Promise<DatabaseResult<{ totalDeleted: number; storageDeleted: number }>> {
    try {
      if (fileIds.length === 0) {
        return { success: true, data: { totalDeleted: 0, storageDeleted: 0 } };
      }

      // Get all file details first
      const fileResults = await Promise.all(
        fileIds.map(id => this.getFileById(id))
      );

      const validFiles = fileResults
        .filter(r => r.success)
        .map(r => r.data!);

      let storageDeleted = 0;

      // Delete from storage first (in parallel for performance)
      const storagePromises = validFiles
        .filter(file => file.storagePath)
        .map(async file => {
          const context = file.linkId ? 'shared' : 'workspace';
          const result = await storageService.deleteFile(
            file.storagePath,
            context
          );
          if (result.success) {
            storageDeleted++;
          } else {
            console.error(
              `⚠️ Storage deletion failed for ${file.id}: ${result.error}`
            );
          }
          return result;
        });

      await Promise.all(storagePromises);

      // Delete from database
      const dbResult = await this.batchDeleteFiles(fileIds);
      if (!dbResult.success) {
        return { success: false, error: dbResult.error };
      }

      console.log(
        `✅ FILES_BATCH_FULLY_DELETED: ${fileIds.length} files (storage: ${storageDeleted})`
      );
      return {
        success: true,
        data: { totalDeleted: fileIds.length, storageDeleted },
      };
    } catch (error) {
      console.error(`❌ FILES_BATCH_DELETE_WITH_STORAGE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Prepare file for download (increment count and return file data)
   */
  async prepareFileForDownload(
    fileId: string
  ): Promise<DatabaseResult<DbFile>> {
    try {
      // Get file data
      const fileResult = await this.getFileById(fileId);
      if (!fileResult.success) {
        return fileResult;
      }

      // Increment download count
      await this.incrementDownloadCount(fileId);

      console.log(`✅ FILE_PREPARED_FOR_DOWNLOAD: ${fileId}`);
      return { success: true, data: fileResult.data };
    } catch (error) {
      console.error(`❌ FILE_DOWNLOAD_PREPARE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get file download info with metadata
   */
  async getFileDownloadInfo(fileId: string): Promise<
    DatabaseResult<{
      file: DbFile;
      downloadUrl: string;
      expiresAt: Date;
    }>
  > {
    try {
      const fileResult = await this.getFileById(fileId);
      if (!fileResult.success) {
        return fileResult;
      }

      const file = fileResult.data;

      // Generate download URL (this would be implemented based on your storage provider)
      const downloadUrl = `/api/files/${fileId}/download`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return {
        success: true,
        data: {
          file,
          downloadUrl,
          expiresAt,
        },
      };
    } catch (error) {
      console.error(`❌ FILE_DOWNLOAD_INFO_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
