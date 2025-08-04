/**
 * Link File Metadata Service - Handles file metadata and organization
 */

import { db } from '@/lib/database/connection';
import { files, batches, folders, users } from '@/lib/database/schemas';
import { eq, and, sql, desc, or, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { calculateSignedUrlExpiry } from '@/lib/utils/signed-url-expiry';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import type { FileTreeNode } from '../../types';

interface PreviousUpload {
  id: string;
  fileName: string;
  originalName: string | null;
  fileSize: number;
  mimeType: string;
  folderId: string | null;
  createdAt: string;
  uploaderName: string;
}

export class LinkFileMetadataService {
  /**
   * Get previous uploads for a link
   */
  async getPreviousUploads(
    linkId: string,
    limit?: number
  ): Promise<DatabaseResult<PreviousUpload[]>> {
    try {
      const query = db
        .select({
          id: files.id,
          fileName: files.fileName,
          originalName: files.originalName,
          fileSize: files.size,
          mimeType: files.mimeType,
          folderId: files.folderId,
          createdAt: files.createdAt,
          uploaderName: batches.uploaderName,
        })
        .from(files)
        .leftJoin(batches, eq(files.batchId, batches.id))
        .where(
          and(
            eq(files.linkId, linkId),
            eq(files.status, 'completed')
          )
        )
        .orderBy(desc(files.createdAt));

      if (limit) {
        query.limit(limit);
      }

      const results = await query;

      const uploads: PreviousUpload[] = results.map(row => ({
        id: row.id,
        fileName: row.fileName,
        originalName: row.originalName,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
        folderId: row.folderId,
        createdAt: row.createdAt.toISOString(),
        uploaderName: row.uploaderName || 'Anonymous',
      }));

      return {
        success: true,
        data: uploads,
      };
    } catch (error) {
      console.error('Error fetching previous uploads:', error);
      return {
        success: false,
        error: 'Failed to fetch previous uploads',
      };
    }
  }

  /**
   * Fetch public files for display
   */
  async fetchPublicFiles(linkId: string): Promise<DatabaseResult<FileTreeNode[]>> {
    try {
      const supabase = getSupabaseClient();

      // Fetch files and folders in parallel
      const [filesData, foldersData] = await Promise.all([
        db
          .select({
            id: files.id,
            name: files.fileName,
            originalName: files.originalName,
            size: files.size,
            mimeType: files.mimeType,
            folderId: files.folderId,
            storagePath: files.storagePath,
            createdAt: files.createdAt,
            uploaderName: batches.uploaderName,
            uploaderEmail: batches.uploaderEmail,
          })
          .from(files)
          .leftJoin(batches, eq(files.batchId, batches.id))
          .where(
            and(
              eq(files.linkId, linkId),
              eq(files.status, 'completed')
            )
          )
          .orderBy(files.sortOrder, files.fileName),
        
        db
          .select()
          .from(folders)
          .where(eq(folders.linkId, linkId))
          .orderBy(folders.sortOrder, folders.name),
      ]);

      // Build folder hierarchy
      const folderMap = new Map<string, FileTreeNode>();
      const rootItems: FileTreeNode[] = [];

      // Process folders first
      foldersData.forEach(folder => {
        const node: FileTreeNode = {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          children: [],
          metadata: {
            createdAt: folder.createdAt.toISOString(),
            color: folder.color || undefined,
          },
        };

        folderMap.set(folder.id, node);

        if (!folder.parentId) {
          rootItems.push(node);
        } else {
          const parent = folderMap.get(folder.parentId);
          if (parent) {
            parent.children?.push(node);
          }
        }
      });

      // Process files
      for (const file of filesData) {
        // Generate signed URL for download
        let signedUrl: string | undefined;
        if (file.storagePath) {
          const expirySeconds = calculateSignedUrlExpiry();
          const { data } = await supabase.storage
            .from('user-uploads')
            .createSignedUrl(file.storagePath, expirySeconds);
          
          signedUrl = data?.signedUrl;
        }

        const fileNode: FileTreeNode = {
          id: file.id,
          name: file.originalName || file.name,
          type: 'file',
          metadata: {
            size: file.size,
            mimeType: file.mimeType,
            createdAt: file.createdAt.toISOString(),
            uploaderName: file.uploaderName || 'Anonymous',
            uploaderEmail: file.uploaderEmail || undefined,
            downloadUrl: signedUrl,
          },
        };

        if (file.folderId) {
          const folder = folderMap.get(file.folderId);
          if (folder) {
            folder.children?.push(fileNode);
          } else {
            // Orphaned file, add to root
            rootItems.push(fileNode);
          }
        } else {
          rootItems.push(fileNode);
        }
      }

      return {
        success: true,
        data: rootItems,
      };
    } catch (error) {
      console.error('Error fetching public files:', error);
      return {
        success: false,
        error: 'Failed to fetch files',
      };
    }
  }

  /**
   * Get file statistics for a link
   */
  async getFileStatistics(linkId: string): Promise<DatabaseResult<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    uploaders: string[];
  }>> {
    try {
      const filesData = await db
        .select({
          size: files.size,
          mimeType: files.mimeType,
          uploaderName: batches.uploaderName,
        })
        .from(files)
        .leftJoin(batches, eq(files.batchId, batches.id))
        .where(
          and(
            eq(files.linkId, linkId),
            eq(files.status, 'completed')
          )
        );

      const stats = {
        totalFiles: filesData.length,
        totalSize: filesData.reduce((sum, file) => sum + file.size, 0),
        fileTypes: {} as Record<string, number>,
        uploaders: [] as string[],
      };

      const uploadersSet = new Set<string>();

      filesData.forEach(file => {
        // Count file types
        const type = file.mimeType.split('/')[0] || 'unknown';
        stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;

        // Collect unique uploaders
        if (file.uploaderName) {
          uploadersSet.add(file.uploaderName);
        }
      });

      stats.uploaders = Array.from(uploadersSet);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error getting file statistics:', error);
      return {
        success: false,
        error: 'Failed to get file statistics',
      };
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    fileId: string,
    metadata: {
      fileName?: string;
      folderId?: string | null;
      sortOrder?: number;
    }
  ): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(files)
        .set({
          ...metadata,
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Error updating file metadata:', error);
      return {
        success: false,
        error: 'Failed to update file metadata',
      };
    }
  }

  /**
   * Get files by batch ID
   */
  async getFilesByBatch(batchId: string): Promise<DatabaseResult<any[]>> {
    try {
      const filesData = await db
        .select()
        .from(files)
        .where(eq(files.batchId, batchId))
        .orderBy(files.sortOrder, files.fileName);

      return {
        success: true,
        data: filesData,
      };
    } catch (error) {
      console.error('Error getting files by batch:', error);
      return {
        success: false,
        error: 'Failed to get batch files',
      };
    }
  }
}

export const linkFileMetadataService = new LinkFileMetadataService();