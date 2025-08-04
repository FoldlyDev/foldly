import { db } from '@/lib/database/connection';
import { files, folders, links } from '@/lib/database/schemas';
import { eq, inArray, sql } from 'drizzle-orm';
import type { TreeNode, CopyResult, CopyOptions } from '@/features/files/types';
import { linkFilesTreeService } from './link-files-tree-service';

/**
 * Service for copying files and folders from links to workspaces
 */
export class LinkFilesCopyService {
  /**
   * Get total size of files by IDs
   */
  async getFilesTotalSize(fileIds: string[]): Promise<{ totalSize: number }> {
    try {
      const result = await db
        .select({ totalSize: sql<number>`COALESCE(SUM(${files.fileSize}), 0)` })
        .from(files)
        .where(inArray(files.id, fileIds))
        .execute();

      return { totalSize: Number(result[0]?.totalSize || 0) };
    } catch (error) {
      console.error('Error calculating total file size:', error);
      return { totalSize: 0 };
    }
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
    const errors: Array<{ fileId: string; fileName: string; error: string }> = [];
    let copiedFiles = 0;
    let copiedFolders = 0;
    let totalSize = 0;
    const folderMapping = new Map<string, string>(); // sourceId -> newWorkspaceFolderId

    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // Process nodes in proper order: folders first, then files
        const sortedNodes = [...nodes].sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return 0;
        });

        // First pass: Create all folders in workspace
        for (const node of sortedNodes) {
          if (node.type === 'folder') {
            await this.createFolderInWorkspace(
              tx, 
              node, 
              targetFolderId,
              userId, 
              workspaceId, 
              folderMapping
            );
            copiedFolders++;
          }
        }

        // Second pass: Copy all files to appropriate folders
        const copyResults = { copiedFiles: 0, totalSize: 0 };
        for (const node of sortedNodes) {
          await this.copyNodeToWorkspace(
            tx,
            node,
            targetFolderId,
            userId,
            workspaceId,
            folderMapping,
            errors,
            copyResults
          );
        }
        
        copiedFiles = copyResults.copiedFiles;
        totalSize = copyResults.totalSize;

        // Update user's storage usage
        await tx.execute(sql`
          UPDATE users 
          SET storage_used = storage_used + ${totalSize}
          WHERE id = ${userId}
        `);
      });

      return {
        success: errors.length === 0,
        copiedFiles,
        copiedFolders,
        errors,
        totalSize,
      };
    } catch (error) {
      console.error('Error copying tree nodes to workspace:', error);
      throw new Error('Failed to copy tree nodes to workspace');
    }
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
    const errors: Array<{ fileId: string; fileName: string; error: string }> = [];
    let copiedFiles = 0;
    let totalSize = 0;

    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // Get source files
        const sourceFiles = await tx
          .select()
          .from(files)
          .where(inArray(files.id, fileIds))
          .execute();

        // Verify all files belong to user's links
        const userLinkIds = await tx
          .select({ id: links.id })
          .from(links)
          .where(eq(links.userId, userId))
          .execute();

        const userLinkIdSet = new Set(userLinkIds.map((l: { id: string }) => l.id));

        for (const file of sourceFiles) {
          if (!file.linkId || !userLinkIdSet.has(file.linkId)) {
            errors.push({
              fileId: file.id,
              fileName: file.fileName,
              error: 'Unauthorized access to file',
            });
            continue;
          }

          try {
            // Create copy with new ID and workspace reference
            const newFile = {
              ...file,
              id: crypto.randomUUID(),
              linkId: null,
              workspaceId,
              folderId: targetFolderId,
              copiedFromFileId: file.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Remove fields that shouldn't be copied
            delete (newFile as any).batchId;

            await tx.insert(files).values(newFile).execute();
            
            copiedFiles++;
            totalSize += file.fileSize;
          } catch (error) {
            errors.push({
              fileId: file.id,
              fileName: file.fileName,
              error: error instanceof Error ? error.message : 'Copy failed',
            });
          }
        }

        // Update user's storage usage
        await tx.execute(sql`
          UPDATE users 
          SET storage_used = storage_used + ${totalSize}
          WHERE id = ${userId}
        `);
      });

      return {
        success: errors.length === 0,
        copiedFiles,
        copiedFolders: 0, // File-only copy doesn't copy folders
        errors,
        totalSize,
      };
    } catch (error) {
      console.error('Error copying files to workspace:', error);
      throw new Error('Failed to copy files to workspace');
    }
  }

  /**
   * Create a folder in the workspace with proper hierarchy
   */
  private async createFolderInWorkspace(
    tx: any,
    folderNode: TreeNode,
    targetFolderId: string | null,
    userId: string,
    workspaceId: string,
    folderMapping: Map<string, string>
  ): Promise<void> {
    try {
      // Determine parent folder ID
      let parentFolderId = targetFolderId;
      if (folderNode.parentId && folderMapping.has(folderNode.parentId)) {
        parentFolderId = folderMapping.get(folderNode.parentId)!;
      }

      // Create new folder
      const newFolderId = crypto.randomUUID();
      const newFolder = {
        id: newFolderId,
        userId,
        workspaceId,
        name: folderNode.name,
        parentFolderId,
        path: linkFilesTreeService.buildFolderPath(folderNode.name, parentFolderId, folderMapping),
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tx.insert(folders).values(newFolder).execute();
      
      // Map source folder ID to new workspace folder ID
      folderMapping.set(folderNode.id, newFolderId);

      // Recursively create child folders
      if (folderNode.children) {
        for (const child of folderNode.children) {
          if (child.type === 'folder') {
            await this.createFolderInWorkspace(
              tx,
              child,
              targetFolderId,
              userId,
              workspaceId,
              folderMapping
            );
          }
        }
      }
    } catch (error) {
      console.error('Error creating folder in workspace:', error);
      throw error;
    }
  }

  /**
   * Copy a single node (file or folder) to workspace
   */
  private async copyNodeToWorkspace(
    tx: any,
    node: TreeNode,
    targetFolderId: string | null,
    userId: string,
    workspaceId: string,
    folderMapping: Map<string, string>,
    errors: Array<{ fileId: string; fileName: string; error: string }>,
    copyResults: { copiedFiles: number; totalSize: number }
  ): Promise<void> {
    if (node.type === 'file') {
      try {
        // Get source file
        const sourceFiles = await tx
          .select()
          .from(files)
          .where(eq(files.id, node.id))
          .execute();

        if (sourceFiles.length === 0) {
          errors.push({
            fileId: node.id,
            fileName: node.name,
            error: 'Source file not found',
          });
          return;
        }

        const sourceFile = sourceFiles[0];

        // Verify file belongs to user's links
        const userLinkIds = await tx
          .select({ id: links.id })
          .from(links)
          .where(eq(links.userId, userId))
          .execute();

        const userLinkIdSet = new Set(userLinkIds.map((l: { id: string }) => l.id));

        if (!sourceFile.linkId || !userLinkIdSet.has(sourceFile.linkId)) {
          errors.push({
            fileId: node.id,
            fileName: node.name,
            error: 'Unauthorized access to file',
          });
          return;
        }

        // Determine target folder ID
        let fileFolderId = targetFolderId;
        if (node.parentId && folderMapping.has(node.parentId)) {
          fileFolderId = folderMapping.get(node.parentId)!;
        }

        // Create copy with new ID and workspace reference
        const newFile = {
          ...sourceFile,
          id: crypto.randomUUID(),
          linkId: null,
          workspaceId,
          folderId: fileFolderId,
          copiedFromFileId: sourceFile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Remove fields that shouldn't be copied
        delete (newFile as any).batchId;

        await tx.insert(files).values(newFile).execute();
        
        // Update copy results
        copyResults.copiedFiles++;
        copyResults.totalSize += sourceFile.fileSize;
      } catch (error) {
        errors.push({
          fileId: node.id,
          fileName: node.name,
          error: error instanceof Error ? error.message : 'Copy failed',
        });
      }
    }

    // Recursively copy children
    if (node.children) {
      for (const child of node.children) {
        await this.copyNodeToWorkspace(
          tx,
          child,
          targetFolderId,
          userId,
          workspaceId,
          folderMapping,
          errors,
          copyResults
        );
      }
    }
  }
}

// Export singleton instance
export const linkFilesCopyService = new LinkFilesCopyService();