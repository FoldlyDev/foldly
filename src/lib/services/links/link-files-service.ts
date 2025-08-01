import { db } from '@/lib/database/connection';
import { files, folders, links } from '@/lib/database/schemas';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { TreeNode, LinkWithFileTree, CopyResult } from '@/features/files/types';

/**
 * Service for managing links with their associated files and folders
 */
export class LinkFilesService {
  /**
   * Get all links for a user with their file tree structure
   */
  async getLinksWithFiles(userId: string): Promise<LinkWithFileTree[]> {
    try {
      // Get all links for the user
      const userLinks = await db
        .select()
        .from(links)
        .where(eq(links.userId, userId))
        .execute();

      // Get file trees for each link
      const linksWithFiles = await Promise.all(
        userLinks.map(async (link) => {
          const linkFolders = await db
            .select()
            .from(folders)
            .where(eq(folders.linkId, link.id))
            .execute();

          const linkFiles = await db
            .select()
            .from(files)
            .where(eq(files.linkId, link.id))
            .execute();

          // Build tree structure
          const fileTree = this.buildFileTree(linkFolders, linkFiles);
          
          // Calculate totals
          const totalFiles = linkFiles.length;
          const totalSize = linkFiles.reduce((sum, file) => sum + file.fileSize, 0);

          return {
            ...link,
            fileTree,
            totalFiles,
            totalSize,
          };
        })
      );

      return linksWithFiles;
    } catch (error) {
      console.error('Error fetching links with files:', error);
      throw new Error('Failed to fetch links with files');
    }
  }

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

        const userLinkIdSet = new Set(userLinkIds.map(l => l.id));

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
        errors,
        totalSize,
      };
    } catch (error) {
      console.error('Error copying files to workspace:', error);
      throw new Error('Failed to copy files to workspace');
    }
  }

  /**
   * Build hierarchical tree structure from flat folders and files
   */
  private buildFileTree(
    folders: typeof folders.$inferSelect[],
    files: typeof files.$inferSelect[]
  ): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create folder nodes
    folders.forEach(folder => {
      const node: TreeNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentFolderId,
        path: folder.path,
        children: [],
      };
      nodeMap.set(folder.id, node);
    });

    // Create file nodes
    files.forEach(file => {
      const node: TreeNode = {
        id: file.id,
        name: file.fileName,
        type: 'file',
        parentId: file.folderId,
        path: `${file.folderId ? nodeMap.get(file.folderId)?.path + '/' : '/'}${file.fileName}`,
        size: file.fileSize,
        mimeType: file.mimeType,
        metadata: {
          uploadedAt: file.uploadedAt,
          uploaderName: file.uploaderName || undefined,
          uploaderEmail: file.uploaderEmail || undefined,
        },
      };
      nodeMap.set(file.id, node);
    });

    // Build tree structure
    nodeMap.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort nodes
    this.sortNodes(rootNodes);

    return rootNodes;
  }

  /**
   * Sort nodes recursively (folders first, then alphabetically)
   */
  private sortNodes(nodes: TreeNode[]): void {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        this.sortNodes(node.children);
      }
    });
  }
}

// Export singleton instance
export const linkFilesService = new LinkFilesService();