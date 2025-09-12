import { db } from '@/lib/database/connection';
import { files, folders, links } from '@/lib/database/schemas';
import { eq, and, sql, isNull, inArray } from 'drizzle-orm';
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
   * Get all files for a specific link
   * For generated links, gets files from the workspace folder
   * For base/custom links, gets files with linkId
   */
  async getFilesByLink(
    linkId: string
  ): Promise<DatabaseResult<DbFile[]>> {
    try {
      // First, check if this is a generated link
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return { success: false, error: 'Link not found' };
      }

      let linkFiles: DbFile[] = [];

      if (link.linkType === 'generated') {
        // For generated links, we don't fetch content anymore
        // Files are managed in Personal Space, not in the link view
        // Return empty array as content is not displayed
        linkFiles = [];
        console.log(
          `✅ GENERATED_LINK: Skipping file content fetch for link ${linkId} - files are in Personal Space`
        );
      } else {
        // For base/custom links, get files with linkId
        linkFiles = await db
          .select()
          .from(files)
          .where(eq(files.linkId, linkId))
          .orderBy(files.sortOrder, files.createdAt);
      }

      console.log(
        `✅ LINK_FILES_FETCHED: ${linkFiles.length} files for link ${linkId} (type: ${link.linkType})`
      );
      return { success: true, data: linkFiles };
    } catch (error) {
      console.error(`❌ LINK_FILES_FETCH_FAILED: Link ${linkId}`, error);
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
        .orderBy(files.sortOrder, files.createdAt);

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
      // 2. workspaceId matches (these are workspace files, not link files)
      const rootFiles = await db
        .select()
        .from(files)
        .where(
          and(
            isNull(files.folderId), // No folder (root level)
            eq(files.workspaceId, workspaceId) // Belongs to this workspace
          )
        )
        .orderBy(files.sortOrder, files.createdAt);

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
   * Also syncs deletion with generated links if applicable
   */
  async deleteFileWithStorage(
    fileId: string,
    storageService: any
  ): Promise<DatabaseResult<{ deletedFromStorage: boolean; syncedLinkFiles?: number }>> {
    try {
      // Get file details first
      const fileResult = await this.getFileById(fileId);
      if (!fileResult.success) {
        console.error(`❌ FILE_NOT_FOUND_FOR_DELETE: ${fileId}`);
        return { success: false, error: 'File not found' };
      }

      const file = fileResult.data;
      let deletedFromStorage = false;
      let syncedLinkFiles = 0;

      console.log(`🗑️ STARTING_FILE_DELETE: FileId="${fileId}" StoragePath="${file.storagePath}" LinkId="${file.linkId}" FolderId="${file.folderId}"`);

      // Check if this is a workspace file in a folder with a generated link
      if (file.workspaceId && file.folderId) {
        // Check if there's a generated link pointing to this folder
        const generatedLink = await db
          .select()
          .from(links)
          .where(and(
            eq(links.sourceFolderId, file.folderId),
            eq(links.linkType, 'generated')
          ))
          .limit(1);

        if (generatedLink.length > 0 && generatedLink[0]) {
          // Find and delete corresponding link files with the same name in the same folder
          // These are files uploaded through the generated link that should be synced
          const linkFilesToDelete = await db
            .select()
            .from(files)
            .where(and(
              eq(files.fileName, file.fileName),
              eq(files.folderId, file.folderId!), // We know it's not null because of the check above
              eq(files.linkId, generatedLink[0].id)
            ));

          console.log(`🔗 FOUND_GENERATED_LINK_FILES: ${linkFilesToDelete.length} files to sync delete`);

          // Delete each link file
          for (const linkFile of linkFilesToDelete) {
            // Delete from storage if exists
            if (linkFile.storagePath) {
              await storageService.deleteFile(linkFile.storagePath, 'shared');
            }
            // Delete from database
            await db.delete(files).where(eq(files.id, linkFile.id));
            syncedLinkFiles++;
          }

          if (syncedLinkFiles > 0) {
            console.log(`✅ SYNCED_LINK_FILES_DELETED: ${syncedLinkFiles} files deleted from generated link`);
          }
        }
      }

      // Delete from storage first if path exists
      if (file.storagePath) {
        const context = file.linkId ? 'shared' : 'workspace';
        console.log(`📂 DELETE_CONTEXT: Using bucket context="${context}" for file ${fileId}`);
        
        const storageResult = await storageService.deleteFile(
          file.storagePath,
          context
        );
        
        if (!storageResult.success) {
          console.error(
            `⚠️ STORAGE_DELETE_ISSUE: FileId="${fileId}" Path="${file.storagePath}" Error="${storageResult.error}"`
          );
          // Continue with database deletion even if storage fails
          // This prevents orphaned database records
        } else {
          deletedFromStorage = true;
          console.log(`✅ STORAGE_DELETE_SUCCESS: FileId="${fileId}" Path="${file.storagePath}"`);
        }
      } else {
        console.warn(`⚠️ NO_STORAGE_PATH: FileId="${fileId}" has no storage path to delete`);
      }

      // Delete from database
      const dbResult = await this.deleteFile(fileId);
      if (!dbResult.success) {
        console.error(`❌ DB_DELETE_FAILED: FileId="${fileId}" Error="${dbResult.error}"`);
        return { success: false, error: dbResult.error };
      }

      console.log(
        `✅ FILE_FULLY_DELETED: FileId="${fileId}" StorageDeleted="${deletedFromStorage}" Path="${file.storagePath}" SyncedLinkFiles="${syncedLinkFiles}"`
      );
      return { success: true, data: { deletedFromStorage, syncedLinkFiles } };
    } catch (error) {
      console.error(`❌ FILE_DELETE_WITH_STORAGE_FAILED: FileId="${fileId}"`, error);
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
        .orderBy(files.sortOrder, files.createdAt);

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
  ): Promise<DatabaseResult<{ totalDeleted: number; storageDeleted: number; syncedLinkFiles?: number }>> {
    try {
      if (fileIds.length === 0) {
        return { success: true, data: { totalDeleted: 0, storageDeleted: 0 } };
      }

      console.log(`🗑️ STARTING_BATCH_DELETE: ${fileIds.length} files`);

      // Get all file details first
      const fileResults = await Promise.all(
        fileIds.map(id => this.getFileById(id))
      );

      const validFiles = fileResults
        .filter(r => r.success)
        .map(r => r.data!);

      console.log(`📊 BATCH_DELETE_STATS: Found ${validFiles.length} valid files out of ${fileIds.length} requested`);

      let storageDeleted = 0;
      let storageFailed = 0;
      let syncedLinkFiles = 0;

      // Check for and delete corresponding generated link files
      const workspaceFiles = validFiles.filter(f => f.workspaceId && f.folderId);
      if (workspaceFiles.length > 0) {
        // Group files by folder
        const filesByFolder = new Map<string, typeof workspaceFiles>();
        workspaceFiles.forEach(file => {
          const folderId = file.folderId!;
          if (!filesByFolder.has(folderId)) {
            filesByFolder.set(folderId, []);
          }
          filesByFolder.get(folderId)!.push(file);
        });

        // Check each folder for generated links
        for (const [folderId, folderFiles] of filesByFolder) {
          const generatedLink = await db
            .select()
            .from(links)
            .where(and(
              eq(links.sourceFolderId, folderId),
              eq(links.linkType, 'generated')
            ))
            .limit(1);

          if (generatedLink.length > 0 && generatedLink[0]) {
            // Delete corresponding link files
            for (const file of folderFiles) {
              const linkFilesToDelete = await db
                .select()
                .from(files)
                .where(and(
                  eq(files.fileName, file.fileName),
                  eq(files.folderId, file.folderId!), // We know it's not null because of the filter above
                  eq(files.linkId, generatedLink[0].id)
                ));

              for (const linkFile of linkFilesToDelete) {
                if (linkFile.storagePath) {
                  await storageService.deleteFile(linkFile.storagePath, 'shared');
                }
                await db.delete(files).where(eq(files.id, linkFile.id));
                syncedLinkFiles++;
              }
            }
          }
        }

        if (syncedLinkFiles > 0) {
          console.log(`✅ BATCH_SYNCED_LINK_FILES_DELETED: ${syncedLinkFiles} files deleted from generated links`);
        }
      }

      // Delete from storage first (in parallel for performance)
      const storagePromises = validFiles
        .filter(file => file.storagePath)
        .map(async file => {
          const context = file.linkId ? 'shared' : 'workspace';
          console.log(`🗑️ BATCH_DELETING_FILE: FileId="${file.id}" Path="${file.storagePath}" Context="${context}"`);
          
          const result = await storageService.deleteFile(
            file.storagePath,
            context
          );
          
          if (result.success) {
            storageDeleted++;
            console.log(`✅ BATCH_STORAGE_DELETE_SUCCESS: FileId="${file.id}"`);
          } else {
            storageFailed++;
            console.error(
              `⚠️ BATCH_STORAGE_DELETE_FAILED: FileId="${file.id}" Path="${file.storagePath}" Error="${result.error}"`
            );
          }
          return result;
        });

      await Promise.all(storagePromises);

      console.log(`📊 STORAGE_DELETE_RESULTS: Success=${storageDeleted} Failed=${storageFailed}`);

      // Delete from database
      const dbResult = await this.batchDeleteFiles(fileIds);
      if (!dbResult.success) {
        console.error(`❌ BATCH_DB_DELETE_FAILED: ${dbResult.error}`);
        return { success: false, error: dbResult.error };
      }

      console.log(
        `✅ FILES_BATCH_FULLY_DELETED: Total=${fileIds.length} StorageDeleted=${storageDeleted} StorageFailed=${storageFailed} SyncedLinkFiles=${syncedLinkFiles}`
      );
      return {
        success: true,
        data: { totalDeleted: fileIds.length, storageDeleted, syncedLinkFiles },
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

  /**
   * Copy a file from link context to workspace context
   * Creates a new file record and copies the storage file to workspace bucket
   */
  async copyFileToWorkspace(
    fileId: string,
    workspaceId: string,
    targetFolderId: string | null,
    storageService: any,
    userId: string
  ): Promise<DatabaseResult<DbFile>> {
    try {
      // Get the source file
      const fileResult = await this.getFileById(fileId);
      if (!fileResult.success || !fileResult.data) {
        return { success: false, error: 'Source file not found' };
      }

      const sourceFile = fileResult.data;

      // Verify this is a link file
      if (!sourceFile.linkId) {
        return { success: false, error: 'Can only copy files from links to workspace' };
      }

      // Generate new storage path for workspace context
      // RLS policy requires userId as first folder in path
      const timestamp = Date.now();
      const folderPath = targetFolderId || 'root';
      const workspacePath = `${userId}/${folderPath}/${timestamp}_${sourceFile.fileName}`;

      // Copy the storage file from shared to workspace bucket
      const copyResult = await storageService.copyFile(
        sourceFile.storagePath,
        workspacePath,
        'shared', // from context
        'workspace' // to context
      );

      if (!copyResult.success) {
        console.error('Failed to copy storage file:', copyResult.error);
        return { success: false, error: 'Failed to copy file to storage' };
      }

      // Create new file record for workspace with new storage path
      const newFileData: DbFileInsert = {
        workspaceId, // Set workspace context
        linkId: null, // Remove link context
        batchId: null, // No batch for workspace files
        folderId: targetFolderId,
        fileName: sourceFile.fileName,
        originalName: sourceFile.originalName,
        fileSize: sourceFile.fileSize,
        mimeType: sourceFile.mimeType,
        extension: sourceFile.extension,
        storagePath: copyResult.data, // NEW storage path in workspace bucket
        storageProvider: sourceFile.storageProvider,
        checksum: sourceFile.checksum,
        isSafe: sourceFile.isSafe,
        virusScanResult: sourceFile.virusScanResult,
        processingStatus: 'completed',
        thumbnailPath: sourceFile.thumbnailPath,
        isOrganized: false,
        needsReview: false,
        sortOrder: -1, // New files at top
        downloadCount: 0, // Reset download count
      };

      const createResult = await this.createFile(newFileData);
      
      if (!createResult.success) {
        // Try to clean up copied storage file
        await storageService.deleteFile(workspacePath, 'workspace');
        return { success: false, error: 'Failed to create workspace file record' };
      }

      console.log(`✅ FILE_COPIED_TO_WORKSPACE: ${fileId} -> ${createResult.data!.id}`);
      return createResult;
    } catch (error) {
      console.error(`❌ FILE_COPY_TO_WORKSPACE_FAILED: ${fileId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Copy a folder and all its contents from link to workspace
   * Recursively copies subfolders and files
   */
  async copyFolderToWorkspace(
    folderId: string,
    workspaceId: string,
    targetParentFolderId: string | null,
    storageService: any,
    userId: string,
    folderIdMapping: Map<string, string> = new Map()
  ): Promise<DatabaseResult<{ copiedFiles: number; copiedFolders: number }>> {
    try {
      // Get the source folder
      const sourceFolder = await db.query.folders.findFirst({
        where: eq(folders.id, folderId),
      });

      if (!sourceFolder) {
        return { success: false, error: 'Source folder not found' };
      }

      // Verify this is a link folder
      if (!sourceFolder.linkId) {
        return { success: false, error: 'Can only copy folders from links to workspace' };
      }

      // Calculate new path and depth for the folder in workspace context
      let newPath: string;
      let newDepth: number;
      
      if (targetParentFolderId) {
        // Get parent folder to calculate proper path and depth
        const parentFolder = await db.query.folders.findFirst({
          where: eq(folders.id, targetParentFolderId),
        });
        
        if (parentFolder) {
          newPath = `${parentFolder.path}/${sourceFolder.name}`;
          newDepth = parentFolder.depth + 1;
        } else {
          // Fallback if parent not found
          newPath = sourceFolder.name;
          newDepth = 1;
        }
      } else {
        // Root level in workspace
        newPath = sourceFolder.name;
        newDepth = 0;
      }

      // Create new folder in workspace with proper relationships
      const newFolderData = {
        workspaceId,
        linkId: null,
        parentFolderId: targetParentFolderId,
        name: sourceFolder.name,
        path: newPath,
        depth: newDepth,
        isArchived: false,
        sortOrder: -1, // New folders at top
        fileCount: 0,
        totalSize: 0,
      };

      const [newFolder] = await db
        .insert(folders)
        .values(newFolderData)
        .returning();

      if (!newFolder) {
        return { success: false, error: 'Failed to create workspace folder' };
      }

      // Map old folder ID to new folder ID for file copying
      folderIdMapping.set(folderId, newFolder.id);

      let totalCopiedFiles = 0;
      let totalCopiedFolders = 1; // Count this folder

      // Copy all files in this folder
      const folderFiles = await db.query.files.findMany({
        where: and(
          eq(files.folderId, folderId),
          eq(files.linkId, sourceFolder.linkId!)
        ),
      });

      for (const file of folderFiles) {
        const copyResult = await this.copyFileToWorkspace(
          file.id,
          workspaceId,
          newFolder.id,
          storageService,
          userId
        );

        if (copyResult.success) {
          totalCopiedFiles++;
        } else {
          console.error(`Failed to copy file ${file.id}:`, copyResult.error);
        }
      }

      // Recursively copy subfolders
      const subfolders = await db.query.folders.findMany({
        where: and(
          eq(folders.parentFolderId, folderId),
          eq(folders.linkId, sourceFolder.linkId!)
        ),
      });

      for (const subfolder of subfolders) {
        const subfolderResult = await this.copyFolderToWorkspace(
          subfolder.id,
          workspaceId,
          newFolder.id,
          storageService,
          userId,
          folderIdMapping
        );

        if (subfolderResult.success && subfolderResult.data) {
          totalCopiedFiles += subfolderResult.data.copiedFiles;
          totalCopiedFolders += subfolderResult.data.copiedFolders;
        } else {
          console.error(`Failed to copy subfolder ${subfolder.id}:`, 'error' in subfolderResult ? subfolderResult.error : 'Unknown error');
        }
      }

      // Update folder statistics with counts for direct children only
      await db
        .update(folders)
        .set({
          fileCount: folderFiles.length, // Direct files in this folder
          totalSize: folderFiles.reduce((sum, f) => sum + f.fileSize, 0), // Size of direct files
        })
        .where(eq(folders.id, newFolder.id));

      console.log(`✅ FOLDER_COPIED_TO_WORKSPACE: ${folderId} -> ${newFolder.id}`);
      return {
        success: true,
        data: {
          copiedFiles: totalCopiedFiles,
          copiedFolders: totalCopiedFolders,
        },
      };
    } catch (error) {
      console.error(`❌ FOLDER_COPY_TO_WORKSPACE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
