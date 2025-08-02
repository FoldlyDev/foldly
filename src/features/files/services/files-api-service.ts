// Files API Service - File Operations API
// Service for file CRUD operations and data fetching
// Following 2025 TypeScript best practices

import { FileService } from '@/features/files/lib/services/file-service';
import { FolderService } from '@/features/files/lib/services/folder-service';
import { files, folders } from '@/lib/database/schemas';

// Use the correct types from src/lib/supabase (single source of truth)
type DbFile = typeof files.$inferSelect;
type DbFileInsert = typeof files.$inferInsert;
type DbFileUpdate = Partial<DbFileInsert>;
type DbFolder = typeof folders.$inferSelect;
type DbFolderInsert = typeof folders.$inferInsert;
type DbFolderUpdate = Partial<DbFolderInsert>;

// =============================================================================
// FILES API SERVICE
// =============================================================================

export class FilesApiService {
  // Initialize services
  private static fileService = new FileService();
  private static folderService = new FolderService();

  /**
   * Fetch all files for a workspace
   */
  static async getFiles(workspaceId: string): Promise<DbFile[]> {
    const result = await this.fileService.getFilesByWorkspace(workspaceId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch files');
    }
    return result.data;
  }

  /**
   * Fetch all folders for a workspace
   */
  static async getFolders(workspaceId: string): Promise<DbFolder[]> {
    const result = await this.folderService.getFoldersByWorkspace(workspaceId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch folders');
    }
    return result.data;
  }

  /**
   * Create a new file
   */
  static async createFile(data: DbFileInsert): Promise<DbFile> {
    const result = await this.fileService.createFile(data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create file');
    }
    return result.data;
  }

  /**
   * Update an existing file
   */
  static async updateFile(
    fileId: string,
    updates: DbFileUpdate
  ): Promise<DbFile> {
    const result = await this.fileService.updateFile(fileId, updates);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update file');
    }
    return result.data;
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileId: string): Promise<void> {
    const result = await this.fileService.deleteFile(fileId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(data: DbFolderInsert): Promise<DbFolder> {
    const result = await this.folderService.createFolder(data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create folder');
    }
    return result.data;
  }

  /**
   * Update an existing folder
   */
  static async updateFolder(
    folderId: string,
    updates: DbFolderUpdate
  ): Promise<DbFolder> {
    const result = await this.folderService.updateFolder(folderId, updates);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update folder');
    }
    return result.data;
  }

  /**
   * Delete a folder
   */
  static async deleteFolder(folderId: string): Promise<void> {
    const result = await this.folderService.deleteFolder(folderId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete folder');
    }
  }

  /**
   * Move a file to a different folder
   */
  static async moveFile(
    fileId: string,
    targetFolderId: string | null
  ): Promise<DbFile> {
    const result = await this.fileService.moveFile(fileId, targetFolderId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to move file');
    }
    return result.data;
  }

  /**
   * Copy files to a folder
   */
  static async copyFiles(
    fileIds: string[],
    targetFolderId: string | null
  ): Promise<DbFile[]> {
    // For now, copy = move since we don't have a copy operation in the database service
    const results = await Promise.all(
      fileIds.map(fileId => this.moveFile(fileId, targetFolderId))
    );
    return results;
  }

  /**
   * Get folder statistics
   */
  static async getFolderStats(
    workspaceId: string
  ): Promise<{ folderCount: number; fileCount: number }> {
    const result = await this.folderService.getFolderStats(workspaceId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to get folder stats');
    }
    return result.data;
  }

  /**
   * Get workspace tree data (files and folders combined)
   */
  static async getWorkspaceTreeData(
    workspaceId: string
  ): Promise<{ files: DbFile[]; folders: DbFolder[] }> {
    const result = await this.fileService.getWorkspaceTreeData(workspaceId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to get workspace tree data');
    }
    return result.data;
  }
}

// Export the database types for use in other files
export type {
  DbFile,
  DbFileInsert,
  DbFileUpdate,
  DbFolder,
  DbFolderInsert,
  DbFolderUpdate,
};
