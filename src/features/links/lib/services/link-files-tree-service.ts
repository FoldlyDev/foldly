import { db } from '@/lib/database/connection';
import { files, folders, links, batches } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { TreeNode, LinkWithFileTree } from '@/features/files/types';

/**
 * Service for building and managing file tree structures for links
 */
export class LinkFilesTreeService {
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
            .select({
              folder: folders,
              batch: batches,
            })
            .from(folders)
            .leftJoin(batches, eq(folders.batchId, batches.id))
            .where(eq(folders.linkId, link.id))
            .execute();

          const linkFiles = await db
            .select({
              file: files,
              batch: batches,
            })
            .from(files)
            .leftJoin(batches, eq(files.batchId, batches.id))
            .where(eq(files.linkId, link.id))
            .execute();

          // Build tree structure
          const fileTree = this.buildFileTree(linkFolders, linkFiles);
          
          // Calculate totals
          const totalFiles = linkFiles.length;
          const totalSize = linkFiles.reduce((sum, fileWithBatch) => sum + fileWithBatch.file.fileSize, 0);

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
   * Build hierarchical tree structure from flat folders and files
   */
  buildFileTree(
    foldersData: Array<{ folder: any; batch: any }>,
    filesData: Array<{ file: any; batch: any }>
  ): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create folder nodes
    foldersData.forEach(({ folder, batch }) => {
      const node: TreeNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentFolderId,
        path: folder.path,
        children: [],
        ...(batch && {
          metadata: {
            uploaderName: batch.uploaderName,
            uploaderEmail: batch.uploaderEmail,
          }
        }),
      };
      nodeMap.set(folder.id, node);
    });

    // Create file nodes
    filesData.forEach(({ file, batch }) => {
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
          uploaderName: batch?.uploaderName || undefined,
          uploaderEmail: batch?.uploaderEmail || undefined,
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

  /**
   * Calculate statistics for a tree node (files count and total size)
   */
  calculateNodeStats(
    node: TreeNode,
    callback: (fileCount: number, fileSize: number) => void
  ): void {
    if (node.type === 'file') {
      callback(1, node.size || 0);
    }
    
    if (node.children) {
      node.children.forEach(child => {
        this.calculateNodeStats(child, callback);
      });
    }
  }

  /**
   * Build folder path for new workspace folder
   */
  buildFolderPath(
    folderName: string,
    parentFolderId: string | null,
    folderMapping: Map<string, string>
  ): string {
    if (!parentFolderId) {
      return `/${folderName}`;
    }

    // For now, build simple path - in full implementation,
    // you'd need to look up parent folder paths
    return `/${folderName}`;
  }
}

// Export singleton instance
export const linkFilesTreeService = new LinkFilesTreeService();