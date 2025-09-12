import { db } from '@/lib/database/connection';
import { folders, files, links } from '@/lib/database/schemas';
import { eq, and, sql, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';

// Use the drizzle-generated types
type DbFolder = typeof folders.$inferSelect;
type DbFolderInsert = typeof folders.$inferInsert;
type DbFolderUpdate = Partial<DbFolderInsert>;

export class FolderService {
  /**
   * Get all personal workspace folders (excludes link-uploaded folders)
   * Includes information about whether each folder has a generated link
   */
  async getFoldersByWorkspace(
    workspaceId: string
  ): Promise<DatabaseResult<(DbFolder & { hasGeneratedLink?: boolean })[]>> {
    try {
      const workspaceFolders = await db
        .select({
          folder: folders,
          generatedLink: links
        })
        .from(folders)
        .leftJoin(
          links,
          and(
            eq(links.sourceFolderId, folders.id),
            eq(links.linkType, 'generated')
          )
        )
        .where(
          and(
            eq(folders.workspaceId, workspaceId),
            isNull(folders.linkId) // Only personal folders, not link-uploaded
          )
        )
        .orderBy(folders.path);

      // Transform the result to include hasGeneratedLink flag
      const foldersWithLinkInfo = workspaceFolders.map(row => ({
        ...row.folder,
        hasGeneratedLink: !!row.generatedLink
      }));

      console.log(
        `✅ FOLDERS_FETCHED: ${foldersWithLinkInfo.length} folders for workspace ${workspaceId}`
      );
      return { success: true, data: foldersWithLinkInfo };
    } catch (error) {
      console.error(`❌ FOLDERS_FETCH_FAILED: Workspace ${workspaceId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all personal workspace folders ordered by sortOrder (excludes link-uploaded folders)
   * Includes information about whether each folder has a generated link
   */
  async getFoldersByWorkspaceOrdered(
    workspaceId: string
  ): Promise<DatabaseResult<(DbFolder & { hasGeneratedLink?: boolean })[]>> {
    try {
      const workspaceFolders = await db
        .select({
          folder: folders,
          generatedLink: links
        })
        .from(folders)
        .leftJoin(
          links,
          and(
            eq(links.sourceFolderId, folders.id),
            eq(links.linkType, 'generated')
          )
        )
        .where(
          and(
            eq(folders.workspaceId, workspaceId),
            isNull(folders.linkId) // Only personal folders, not link-uploaded
          )
        )
        .orderBy(folders.sortOrder, folders.path);

      // Transform the result to include hasGeneratedLink flag
      const foldersWithLinkInfo = workspaceFolders.map(row => ({
        ...row.folder,
        hasGeneratedLink: !!row.generatedLink
      }));

      console.log(
        `✅ FOLDERS_FETCHED_ORDERED: ${foldersWithLinkInfo.length} folders for workspace ${workspaceId}`
      );
      return { success: true, data: foldersWithLinkInfo };
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
   * Get all folders for a specific link
   * For generated links, gets workspace folders from the source folder
   * For base/custom links, gets folders with linkId
   */
  async getFoldersByLink(
    linkId: string
  ): Promise<DatabaseResult<DbFolder[]>> {
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

      let linkFolders: DbFolder[] = [];

      if (link.linkType === 'generated') {
        // For generated links, we don't fetch content anymore
        // Folders are managed in Personal Space, not in the link view
        // Return empty array as content is not displayed
        linkFolders = [];
        console.log(
          `✅ GENERATED_LINK: Skipping folder content fetch for link ${linkId} - folders are in Personal Space`
        );
      } else {
        // For base/custom links, get folders with linkId
        linkFolders = await db
          .select()
          .from(folders)
          .where(eq(folders.linkId, linkId))
          .orderBy(folders.sortOrder, folders.path);
      }

      console.log(
        `✅ LINK_FOLDERS_FETCHED: ${linkFolders.length} folders for link ${linkId} (type: ${link.linkType})`
      );
      return { success: true, data: linkFolders };
    } catch (error) {
      console.error(`❌ LINK_FOLDERS_FETCH_FAILED: Link ${linkId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get folders by parent ID (for uniqueness checking)
   */
  async getFoldersByParent(
    parentId: string | null,
    workspaceId: string
  ): Promise<DatabaseResult<DbFolder[]>> {
    try {
      const condition = parentId
        ? and(
            eq(folders.parentFolderId, parentId),
            eq(folders.workspaceId, workspaceId)
          )
        : and(
            isNull(folders.parentFolderId),
            eq(folders.workspaceId, workspaceId)
          );

      const siblingFolders = await db
        .select()
        .from(folders)
        .where(condition)
        .orderBy(folders.sortOrder, folders.name);

      console.log(
        `✅ FOLDERS_BY_PARENT_FETCHED: ${siblingFolders.length} folders for parent ${parentId} in workspace ${workspaceId}`
      );
      return { success: true, data: siblingFolders };
    } catch (error) {
      console.error(
        `❌ FOLDERS_BY_PARENT_FETCH_FAILED: Parent ${parentId}, Workspace ${workspaceId}`,
        error
      );
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
   * Delete folder (WITH ALL NESTED CONTENT RECURSIVELY)
   * Note: This only deletes database records. Storage cleanup should be handled by the caller.
   */
  async deleteFolder(folderId: string): Promise<DatabaseResult<void>> {
    try {
      // Get all nested files first
      const nestedFilesResult = await this.getNestedFiles(folderId);
      if (!nestedFilesResult.success) {
        return nestedFilesResult;
      }

      // Get all nested folders
      const nestedFoldersResult = await this.getNestedFolders(folderId);
      if (!nestedFoldersResult.success) {
        return nestedFoldersResult;
      }

      // Delete all nested files from database
      for (const file of nestedFilesResult.data) {
        await db.delete(files).where(eq(files.id, file.id));
      }

      // Delete nested folders (deepest first to avoid foreign key constraints)
      const sortedFolders = nestedFoldersResult.data.sort(
        (a, b) => b.depth - a.depth
      );
      for (const folder of sortedFolders) {
        await db.delete(folders).where(eq(folders.id, folder.id));
      }

      // Finally delete the main folder
      await db.delete(folders).where(eq(folders.id, folderId));

      console.log(
        `✅ FOLDER_DELETED_FROM_DB: ${folderId} (${nestedFilesResult.data.length} files, ${nestedFoldersResult.data.length} nested folders)`
      );
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FOLDER_DELETE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete folder with storage cleanup for all nested files
   */
  async deleteFolderWithStorage(
    folderId: string,
    storageService: any
  ): Promise<DatabaseResult<{ filesDeleted: number; storageDeleted: number; syncedLinkFiles?: number }>> {
    try {
      // Check if this folder has a generated link pointing to it
      // The generated link will be CASCADE deleted, but we need to clean up link files
      const generatedLink = await db
        .select()
        .from(links)
        .where(and(
          eq(links.sourceFolderId, folderId),
          eq(links.linkType, 'generated')
        ))
        .limit(1);

      let linkFilesToCleanup: typeof files.$inferSelect[] = [];
      if (generatedLink.length > 0 && generatedLink[0]) {
        // Get all files uploaded through this generated link
        linkFilesToCleanup = await db
          .select()
          .from(files)
          .where(eq(files.linkId, generatedLink[0].id));
        
        console.log(`🔗 FOUND_GENERATED_LINK_FOR_FOLDER: ${generatedLink[0].id} with ${linkFilesToCleanup.length} files to cleanup`);
      }

      // Get all nested files first
      const nestedFilesResult = await this.getNestedFiles(folderId);
      if (!nestedFilesResult.success) {
        return nestedFilesResult;
      }

      // Get all nested folders
      const nestedFoldersResult = await this.getNestedFolders(folderId);
      if (!nestedFoldersResult.success) {
        return nestedFoldersResult;
      }

      let storageDeleted = 0;
      let syncedLinkFiles = 0;
      const allFiles = nestedFilesResult.data;

      // Delete link files from storage first if any
      if (linkFilesToCleanup.length > 0) {
        const linkStoragePromises = linkFilesToCleanup
          .filter(file => file.storagePath)
          .map(async file => {
            const result = await storageService.deleteFile(
              file.storagePath,
              'shared' // Link files are in shared bucket
            );
            if (result.success) {
              syncedLinkFiles++;
            }
            return result;
          });
        
        await Promise.all(linkStoragePromises);
        console.log(`✅ DELETED_LINK_FILES_FROM_STORAGE: ${syncedLinkFiles} files`);
      }

      // Delete all workspace files from storage (in parallel for performance)
      const storagePromises = allFiles
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

      // Now delete from database using the regular method
      // This will CASCADE delete the generated link if it exists
      const dbResult = await this.deleteFolder(folderId);
      if (!dbResult.success) {
        return { success: false, error: dbResult.error };
      }

      console.log(
        `✅ FOLDER_FULLY_DELETED: ${folderId} (${allFiles.length} files, storage: ${storageDeleted}, syncedLinkFiles: ${syncedLinkFiles})`
      );
      return {
        success: true,
        data: { filesDeleted: allFiles.length, storageDeleted, syncedLinkFiles },
      };
    } catch (error) {
      console.error(`❌ FOLDER_DELETE_WITH_STORAGE_FAILED: ${folderId}`, error);
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
   * Move folder to different parent (WITH FULL NESTED CONTENT)
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

      // Update the folder itself
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

      // Update all nested folder paths
      const updateNestedResult = await this.updateNestedFolderPaths(
        folderId,
        newPath,
        newDepth
      );
      if (!updateNestedResult.success) {
        console.error(
          `Failed to update nested folder paths: ${updateNestedResult.error}`
        );
        // Don't fail the entire operation, but log the error
      }

      console.log(
        `✅ FOLDER_MOVED_WITH_CONTENT: ${folderId} to parent ${newParentId}`
      );
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

  /**
   * Get all nested subfolders within a folder recursively
   */
  async getNestedFolders(
    folderId: string
  ): Promise<DatabaseResult<DbFolder[]>> {
    try {
      // Get immediate child folders
      const childFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.parentFolderId, folderId))
        .orderBy(folders.path);

      const allNestedFolders: DbFolder[] = [...childFolders];

      // Recursively get nested folders for each child
      for (const childFolder of childFolders) {
        const nestedResult = await this.getNestedFolders(childFolder.id);
        if (nestedResult.success) {
          allNestedFolders.push(...nestedResult.data);
        }
      }

      return { success: true, data: allNestedFolders };
    } catch (error) {
      console.error(`❌ NESTED_FOLDERS_FETCH_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all files within a folder and its nested subfolders recursively
   */
  async getNestedFiles(folderId: string): Promise<DatabaseResult<any[]>> {
    try {
      // Get files directly in this folder
      const directFiles = await db
        .select()
        .from(files)
        .where(eq(files.folderId, folderId));

      const allNestedFiles: any[] = [...directFiles];

      // Get all nested subfolders
      const nestedFoldersResult = await this.getNestedFolders(folderId);
      if (nestedFoldersResult.success) {
        // Get files from each nested folder
        for (const nestedFolder of nestedFoldersResult.data) {
          const folderFiles = await db
            .select()
            .from(files)
            .where(eq(files.folderId, nestedFolder.id));
          allNestedFiles.push(...folderFiles);
        }
      }

      return { success: true, data: allNestedFiles };
    } catch (error) {
      console.error(`❌ NESTED_FILES_FETCH_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update paths of all nested folders when parent folder moves
   */
  async updateNestedFolderPaths(
    folderId: string,
    newBasePath: string,
    newDepth: number
  ): Promise<DatabaseResult<void>> {
    try {
      // Get all nested folders
      const nestedFoldersResult = await this.getNestedFolders(folderId);
      if (!nestedFoldersResult.success) {
        return nestedFoldersResult;
      }

      // Update path for each nested folder
      for (const nestedFolder of nestedFoldersResult.data) {
        // Calculate relative path from the moved folder
        const currentPath = nestedFolder.path;
        const pathParts = currentPath.split('/');
        const oldBasePath = pathParts[0] || '';
        const relativePath = currentPath.substring(oldBasePath.length + 1);
        const newPath = relativePath
          ? `${newBasePath}/${relativePath}`
          : newBasePath;

        // Calculate new depth based on path segments
        const newFolderDepth =
          newDepth + (relativePath ? relativePath.split('/').length : 0);

        await db
          .update(folders)
          .set({
            path: newPath,
            depth: newFolderDepth,
            updatedAt: new Date(),
          })
          .where(eq(folders.id, nestedFolder.id));
      }

      console.log(
        `✅ NESTED_PATHS_UPDATED: ${nestedFoldersResult.data.length} nested folders`
      );
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ NESTED_PATHS_UPDATE_FAILED: ${folderId}`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Batch move multiple folders to a new parent
   */
  async batchMoveFolders(
    folderIds: string[],
    newParentId: string | null
  ): Promise<DatabaseResult<void>> {
    try {
      if (folderIds.length === 0) {
        return { success: true, data: undefined };
      }

      // Move each folder individually
      for (const folderId of folderIds) {
        const moveResult = await this.moveFolder(folderId, newParentId);
        if (!moveResult.success) {
          throw new Error(
            `Failed to move folder ${folderId}: ${moveResult.error}`
          );
        }
      }

      console.log(
        `✅ FOLDERS_BATCH_MOVED: ${folderIds.length} folders to parent ${newParentId}`
      );
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`❌ FOLDERS_BATCH_MOVE_FAILED:`, error);
      return { success: false, error: (error as Error).message };
    }
  }
}
