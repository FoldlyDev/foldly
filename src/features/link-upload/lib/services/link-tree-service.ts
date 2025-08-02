/**
 * Link Tree Service - Handles tree data operations for link uploads
 */

import { db } from '@/lib/database/connection';
import { links, folders, files, batches } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';

export class LinkTreeService {
  /**
   * Get link statistics
   */
  async getLinkStats(linkId: string): Promise<DatabaseResult<{ totalFiles: number; totalFolders: number }>> {
    try {
      const fileCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .where(eq(files.linkId, linkId));

      const folderCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(folders)
        .where(eq(folders.linkId, linkId));

      return {
        success: true,
        data: {
          totalFiles: Number(fileCountResult[0]?.count || 0),
          totalFolders: Number(folderCountResult[0]?.count || 0),
        },
      };
    } catch (error) {
      console.error('Error fetching link stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch link stats',
      };
    }
  }

  /**
   * Fetch link tree data for the tree component
   * This fetches actual folders and files from the database
   */
  async fetchLinkTree(linkId: string): Promise<DatabaseResult<{
    link: { id: string; title: string | null; isPublic: boolean };
    folders: Array<{
      id: string;
      name: string;
      parentId?: string;
      linkId: string;
      createdAt: string;
      path: string;
      depth: number;
    }>;
    files: Array<{
      id: string;
      originalName: string;
      parentId?: string;
      linkId: string;
      fileSize: number;
      mimeType: string;
      createdAt: string;
      uploaderName: string;
      storagePath: string;
      processingStatus: string;
    }>;
    stats: {
      totalFiles: number;
      totalFolders: number;
    };
  }>> {
    try {
      // Fetch the link details
      const [linkData] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!linkData) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      // Fetch all folders associated with this link, ordered by sort order
      const foldersResult = await db
        .select()
        .from(folders)
        .where(eq(folders.linkId, linkId))
        .orderBy(folders.sortOrder, folders.path);

      // Fetch all files associated with this link (with batch info for uploader name), ordered by sort order
      const filesResult = await db
        .select({
          file: files,
          batch: batches
        })
        .from(files)
        .leftJoin(batches, eq(files.batchId, batches.id))
        .where(eq(files.linkId, linkId))
        .orderBy(files.sortOrder, files.fileName);

      // Transform database results to tree component format
      const transformedFolders = foldersResult.map(folder => {
        const folderObj: {
          id: string;
          name: string;
          parentId?: string;
          linkId: string;
          createdAt: string;
          path: string;
          depth: number;
        } = {
          id: folder.id,
          name: folder.name,
          linkId: folder.linkId || linkId,
          createdAt: folder.createdAt.toISOString(),
          path: folder.path,
          depth: folder.depth,
        };
        if (folder.parentFolderId) {
          folderObj.parentId = folder.parentFolderId;
        }
        return folderObj;
      });

      const transformedFiles = filesResult.map(result => {
        const fileObj: {
          id: string;
          originalName: string;
          parentId?: string;
          linkId: string;
          fileSize: number;
          mimeType: string;
          createdAt: string;
          uploaderName: string;
          storagePath: string;
          processingStatus: string;
        } = {
          id: result.file.id,
          originalName: result.file.originalName || result.file.fileName,
          linkId: result.file.linkId || linkId,
          fileSize: Number(result.file.fileSize),
          mimeType: result.file.mimeType,
          createdAt: result.file.createdAt.toISOString(),
          uploaderName: result.batch?.uploaderName || 'Anonymous',
          storagePath: result.file.storagePath || '',
          processingStatus: result.file.processingStatus,
        };
        if (result.file.folderId) {
          fileObj.parentId = result.file.folderId;
        }
        return fileObj;
      });

      return {
        success: true,
        data: {
          link: { 
            id: linkData.id, 
            title: linkData.title || 'Upload Link',
            isPublic: linkData.isPublic,
          },
          folders: transformedFolders,
          files: transformedFiles,
          stats: {
            totalFiles: transformedFiles.length,
            totalFolders: transformedFolders.length,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching link tree:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch link tree data',
      };
    }
  }
}

// Export singleton instance
export const linkTreeService = new LinkTreeService();