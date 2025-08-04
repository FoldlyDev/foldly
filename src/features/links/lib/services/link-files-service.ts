import type { LinkWithFileTree, CopyResult, CopyOptions, TreeNode } from '@/features/files/types';
import { linkFilesTreeService } from './link-files-tree-service';
import { linkFilesCopyService } from './link-files-copy-service';

/**
 * Facade service for managing links with their associated files and folders
 * This service delegates to specialized services for tree building and copy operations
 */
export class LinkFilesService {
  /**
   * Get all links for a user with their file tree structure
   */
  async getLinksWithFiles(userId: string): Promise<LinkWithFileTree[]> {
    return linkFilesTreeService.getLinksWithFiles(userId);
  }

  /**
   * Get total size of files by IDs
   */
  async getFilesTotalSize(fileIds: string[]): Promise<{ totalSize: number }> {
    return linkFilesCopyService.getFilesTotalSize(fileIds);
  }

  /**
   * Copy tree nodes (files and folders) from a link to the user's workspace
   * This method preserves folder structure when copying
   */
  async copyTreeNodesToWorkspace(
    nodes: TreeNode[],
    targetFolderId: string | null,
    userId: string,
    workspaceId: string,
    options?: Partial<CopyOptions>
  ): Promise<CopyResult> {
    return linkFilesCopyService.copyTreeNodesToWorkspace(
      nodes,
      targetFolderId,
      userId,
      workspaceId,
      options
    );
  }

  /**
   * Copy files from a link to the user's workspace
   */
  async copyFilesToWorkspace(
    fileIds: string[],
    targetFolderId: string | null,
    userId: string,
    workspaceId: string
  ): Promise<CopyResult> {
    return linkFilesCopyService.copyFilesToWorkspace(
      fileIds,
      targetFolderId,
      userId,
      workspaceId
    );
  }

  /**
   * Build hierarchical tree structure from flat folders and files
   * Exposed for backward compatibility
   */
  buildFileTree(
    foldersData: Array<{ folder: any; batch: any }>,
    filesData: Array<{ file: any; batch: any }>
  ): TreeNode[] {
    return linkFilesTreeService.buildFileTree(foldersData, filesData);
  }

  /**
   * Calculate statistics for a tree node (files count and total size)
   * Exposed for backward compatibility
   */
  calculateNodeStats(
    node: TreeNode,
    callback: (fileCount: number, fileSize: number) => void
  ): void {
    return linkFilesTreeService.calculateNodeStats(node, callback);
  }
}

// Export singleton instance
export const linkFilesService = new LinkFilesService();