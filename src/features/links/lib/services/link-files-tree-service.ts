import { db } from '@/lib/database/connection';
import { files, folders, links, batches } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { TreeNode, LinkWithFileTree } from '@/features/files/types';

// Type definitions
type DbFolder = typeof folders.$inferSelect;
type DbFile = typeof files.$inferSelect;
type DbBatch = typeof batches.$inferSelect;

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
          // For generated links, fetch workspace folders that contain uploaded files
          // For base/custom links, folders have linkId set
          let linkFolders: Array<{ folder: DbFolder }>;
          if (link.linkType === 'generated') {
            // First get all files uploaded through this generated link
            const uploadedFiles = await db
              .select({ folderId: files.folderId })
              .from(batches)
              .innerJoin(files, eq(files.batchId, batches.id))
              .where(eq(batches.linkId, link.id))
              .execute();
            
            // Get unique folder IDs (including source folder)
            const folderIds = new Set<string>();
            if (link.sourceFolderId) {
              folderIds.add(link.sourceFolderId);
            }
            uploadedFiles.forEach(f => {
              if (f.folderId) folderIds.add(f.folderId);
            });
            
            // For generated links, show all folders under the source folder
            if (link.sourceFolderId) {
              // Get all folders that are descendants of the source folder
              const allFolders = await db
                .select({ folder: folders })
                .from(folders)
                .where(eq(folders.workspaceId, link.workspaceId!))
                .execute();
              
              // Find all descendant folders of the source folder
              const descendantFolders = new Set<string>();
              
              const addDescendants = (folderId: string) => {
                allFolders.forEach(({ folder }) => {
                  if (folder.parentFolderId === folderId) {
                    descendantFolders.add(folder.id);
                    addDescendants(folder.id);
                  }
                });
              };
              
              // Start from source folder and find all descendants
              addDescendants(link.sourceFolderId);
              
              // Filter to only descendant folders (excluding the source folder itself)
              linkFolders = allFolders.filter(f => descendantFolders.has(f.folder.id));
              
              console.log(`📊 Generated link folders:`, {
                linkId: link.id,
                sourceFolderId: link.sourceFolderId,
                allFoldersCount: allFolders.length,
                descendantFoldersCount: descendantFolders.size,
                linkFoldersCount: linkFolders.length,
                folderNames: linkFolders.map(f => f.folder.name)
              });
            } else {
              linkFolders = [];
            }
          } else {
            linkFolders = await db
              .select({
                folder: folders,
              })
              .from(folders)
              .where(eq(folders.linkId, link.id))
              .execute();
          }

          // For generated links, files are linked through batch or are in descendant folders
          // For base/custom links, files have linkId set directly
          let linkFiles;
          if (link.linkType === 'generated') {
            // Get the folder IDs we're showing (descendants of source folder)
            const folderIdsToShow = new Set(linkFolders.map(f => f.folder.id));
            if (link.sourceFolderId) {
              folderIdsToShow.add(link.sourceFolderId);
            }
            
            // Get files that either:
            // 1. Were uploaded through this generated link (have batch)
            // 2. Are in the source folder or its descendants
            const uploadedFiles = await db
              .select({
                file: files,
                batch: batches,
              })
              .from(batches)
              .innerJoin(files, eq(files.batchId, batches.id))
              .where(eq(batches.linkId, link.id))
              .execute();
            
            const workspaceFiles = folderIdsToShow.size > 0
              ? await db
                  .select({
                    file: files,
                    batch: batches,
                  })
                  .from(files)
                  .leftJoin(batches, eq(files.batchId, batches.id))
                  .where(sql`${files.workspaceId} = ${link.workspaceId} AND ${files.folderId} IN (${sql.join(Array.from(folderIdsToShow).map(id => sql`${id}`), sql`, `)})`)
                  .execute()
              : [];
            
            // Combine and deduplicate
            const fileMap = new Map<string, { file: DbFile; batch: DbBatch | null }>();
            [...uploadedFiles, ...workspaceFiles].forEach(f => {
              fileMap.set(f.file.id, f);
            });
            linkFiles = Array.from(fileMap.values());
            
            console.log(`📊 Generated link files:`, {
              linkId: link.id,
              sourceFolderId: link.sourceFolderId,
              folderIdsToShow: Array.from(folderIdsToShow),
              uploadedFilesCount: uploadedFiles.length,
              workspaceFilesCount: workspaceFiles.length,
              totalFiles: linkFiles.length,
              fileNames: linkFiles.map(f => f.file.fileName)
            });
          } else {
            linkFiles = await db
              .select({
                file: files,
                batch: batches,
              })
              .from(files)
              .leftJoin(batches, eq(files.batchId, batches.id))
              .where(eq(files.linkId, link.id))
              .execute();
          }

          // Build tree structure
          const fileTree = this.buildFileTree(linkFolders, linkFiles, link.linkType === 'generated' ? link.sourceFolderId : undefined);
          
          // Calculate totals
          const totalFiles = linkFiles.length;
          const totalSize = linkFiles.reduce((sum, fileWithBatch) => sum + fileWithBatch.file.fileSize, 0);
          
          if (link.linkType === 'generated') {
            console.log(`📊 Generated link tree built:`, {
              linkId: link.id,
              linkTitle: link.title,
              treeNodesCount: fileTree.length,
              treeStructure: fileTree.map(node => ({
                name: node.name,
                type: node.type,
                children: node.children?.length || 0
              }))
            });
          }

          return {
            ...link,
            // Ensure branding is always an object, never null
            branding: link.branding || { enabled: false },
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
    foldersData: Array<{ folder: DbFolder }>,
    filesData: Array<{ file: DbFile; batch: DbBatch | null }>,
    excludeParentId?: string | null
  ): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create folder nodes
    foldersData.forEach(({ folder }) => {
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
          ...(batch?.uploaderName && { uploaderName: batch.uploaderName }),
          ...(batch?.uploaderEmail && { uploaderEmail: batch.uploaderEmail }),
        },
      };
      nodeMap.set(file.id, node);
    });

    // Build tree structure
    nodeMap.forEach(node => {
      if (node.parentId && node.parentId !== excludeParentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent && parent.children) {
          parent.children.push(node);
        } else if (!parent) {
          // Parent not in nodeMap, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent or parent is excluded, treat as root
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
    parentFolderId: string | null
  ): string {
    if (!parentFolderId) {
      return `/${folderName}`;
    }

    // Build path by traversing parent folders
    // Note: In a full implementation, you'd need to query parent folder paths
    // from the database. For now, we'll construct a simple hierarchical path.
    const pathSegments = [folderName];
    
    // TODO: Implement proper path construction by querying parent folders
    // This would involve looking up the parent folder's path from the database
    // and appending the current folder name to it
    
    return `/${pathSegments.join('/')}`;
  }
}

// Export singleton instance
export const linkFilesTreeService = new LinkFilesTreeService();