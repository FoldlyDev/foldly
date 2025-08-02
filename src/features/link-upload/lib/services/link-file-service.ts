/**
 * Link File Service - Handles file upload and management operations
 */

import { db } from '@/lib/database/connection';
import { files, batches, links, users } from '@/lib/database/schemas';
import { eq, and, sql, desc, or, ne, lt, inArray, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { calculateSignedUrlExpiry } from '@/lib/utils/signed-url-expiry';
import { FileService } from '@/features/files/lib/services/file-service';
import { StorageService } from '@/features/files/lib/services/storage-service';
import { LinksDbService } from '@/features/links/lib/db-service';
import { canAcceptUploads, isLinkExpired } from '@/lib/database/types/links';
import {
  validateFile,
  type FileConstraints,
} from '@/lib/upload/utils/file-validation';
import { generateUniqueFileName } from '@/lib/upload/utils/file-processing';
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

interface UploadFileParams {
  batchId: string;
  fileId: string;
  file: File;
  folderId?: string;
  sortOrder?: number;
}

interface FileUploadResult {
  id: string;
  path: string;
}

export class LinkFileService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Upload a file to storage and update database records
   */
  async uploadFile(
    params: UploadFileParams
  ): Promise<DatabaseResult<FileUploadResult>> {
    try {
      // Get the file record that was created during batch creation
      const [fileRecord] = await db
        .select()
        .from(files)
        .where(and(
          eq(files.id, params.fileId),
          eq(files.batchId, params.batchId)
        ))
        .limit(1);

      if (!fileRecord) {
        return {
          success: false,
          error: 'File record not found',
        };
      }

      // Get the batch to get the user ID (link owner)
      const [batch] = await db
        .select()
        .from(batches)
        .where(eq(batches.id, params.batchId))
        .limit(1);

      if (!batch) {
        return {
          success: false,
          error: 'Batch not found',
        };
      }

      const userId = batch.userId;

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${userId}/${fileRecord.linkId}/${timestamp}_${sanitizedName}`;

      // Convert File to ArrayBuffer then to Uint8Array for Supabase
      const arrayBuffer = await params.file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('files')
        .upload(storagePath, uint8Array, {
          contentType: params.file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return {
          success: false,
          error: 'Failed to upload file to storage',
        };
      }

      // Update the file record with storage path and status
      const fileExtension = params.file.name.split('.').pop() || '';
      
      const updateData: any = {
        storagePath: uploadData.path,
        storageProvider: 'supabase',
        originalName: params.file.name,
        extension: fileExtension,
        processingStatus: 'completed',
        isSafe: true,
        virusScanResult: 'clean',
        downloadCount: 0,
        updatedAt: new Date(),
      };
      
      // Update folderId if provided
      if (params.folderId !== undefined) {
        updateData.folderId = params.folderId;
      }
      
      // Update sortOrder if provided
      if (params.sortOrder !== undefined) {
        updateData.sortOrder = params.sortOrder;
      }
      
      const updateResult = await db
        .update(files)
        .set(updateData)
        .where(eq(files.id, params.fileId))
        .returning({ id: files.id });

      if (updateResult.length === 0) {
        // Cleanup storage if database update fails
        await this.supabase.storage.from('files').remove([storagePath]);
        return {
          success: false,
          error: 'Failed to update file record',
        };
      }

      // Update user storage usage
      await db
        .update(users)
        .set({
          storageUsed: sql`${users.storageUsed} + ${params.file.size}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Update link statistics
      await db
        .update(links)
        .set({
          totalFiles: sql`${links.totalFiles} + 1`,
          totalSize: sql`${links.totalSize} + ${params.file.size}`,
          storageUsed: sql`${links.storageUsed} + ${params.file.size}`,
          lastUploadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(links.id, fileRecord.linkId!));

      // Update batch processed files count
      await db
        .update(batches)
        .set({
          processedFiles: sql`${batches.processedFiles} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(batches.id, params.batchId));

      return {
        success: true,
        data: {
          id: updateResult[0].id,
          path: uploadData.path,
        },
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }

  /**
   * Fetch previous uploads for a public link
   * Excludes files from the current session (last hour) for the current user
   */
  async getPreviousUploads(
    linkId: string,
    currentUserId?: string | null
  ): Promise<DatabaseResult<{ files: PreviousUpload[] }>> {
    try {
      // Get the current date minus 1 hour to define "current session"
      const sessionCutoff = new Date(Date.now() - 60 * 60 * 1000);

      // Fetch files with proper field names
      let filesCondition;
      
      if (currentUserId) {
        // If user is logged in, exclude their recent files
        filesCondition = and(
          eq(files.linkId, linkId),
          or(
            ne(files.userId, currentUserId), // Files from other users
            lt(files.createdAt, sessionCutoff) // Older files from current user
          )
        );
      } else {
        // If no user, show all files
        filesCondition = eq(files.linkId, linkId);
      }

      const filesResult = await db
        .select({
          id: files.id,
          fileName: files.fileName,
          originalName: files.originalName,
          fileSize: files.fileSize,
          mimeType: files.mimeType,
          folderId: files.folderId,
          linkId: files.linkId,
          createdAt: files.createdAt,
          userId: files.userId,
          storagePath: files.storagePath,
          processingStatus: files.processingStatus,
          uploaderName: batches.uploaderName,
        })
        .from(files)
        .leftJoin(batches, eq(files.batchId, batches.id))
        .where(filesCondition)
        .orderBy(desc(files.createdAt));

      // Transform to a simpler format for the UI
      const transformedFiles: PreviousUpload[] = (filesResult || []).map(file => ({
        id: file.id,
        fileName: file.fileName || 'Unknown',
        originalName: file.originalName || file.fileName || 'Unknown',
        fileSize: Number(file.fileSize || 0),
        mimeType: file.mimeType || 'application/octet-stream',
        folderId: file.folderId,
        createdAt: file.createdAt ? file.createdAt.toISOString() : new Date().toISOString(),
        uploaderName: file.uploaderName || 'Anonymous',
      }));

      return {
        success: true,
        data: {
          files: transformedFiles,
        },
      };
    } catch (error) {
      console.error('Error fetching previous uploads from service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch previous uploads',
      };
    }
  }

  /**
   * Track file download by incrementing download count
   */
  async trackFileDownload(fileId: string): Promise<DatabaseResult<void>> {
    try {
      // Increment download count
      await db
        .update(files)
        .set({
          downloadCount: sql`${files.downloadCount} + 1`,
          lastAccessedAt: new Date(),
        })
        .where(eq(files.id, fileId));

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error tracking download:', error);
      return {
        success: false,
        error: 'Failed to track download',
      };
    }
  }

  /**
   * Upload a file to a public shared link with comprehensive validation
   */
  async uploadFileToLink(
    file: File,
    linkId: string,
    uploaderInfo: { name: string; email?: string; message?: string },
    folderId?: string,
    password?: string
  ): Promise<DatabaseResult<{
    fileId: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    quotaInfo?: any;
  }>> {
    try {
      const linksService = new LinksDbService();
      const linkResult = await linksService.getById(linkId);

      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Upload link not found. Please check the link and try again.',
        };
      }

      const link = linkResult.data;

      // Check if link can accept uploads (includes real-time expiration checking)
      if (!canAcceptUploads(link)) {
        if (isLinkExpired(link)) {
          return {
            success: false,
            error: 'This upload link has expired and can no longer accept files. Please contact the link owner for a new link.',
          };
        } else if (!link.isActive) {
          return {
            success: false,
            error: 'This upload link is currently disabled. Please contact the link owner.',
          };
        } else if (link.totalFiles >= link.maxFiles) {
          return {
            success: false,
            error: `This upload link has reached its maximum file limit (${link.maxFiles} files). No more files can be uploaded.`,
          };
        } else {
          return {
            success: false,
            error: 'This upload link cannot accept files at this time. Please try again later or contact the link owner.',
          };
        }
      }

      // Password validation
      if (link.requirePassword) {
        if (!password) {
          return {
            success: false,
            error: 'This upload link requires a password. Please provide the password to continue.',
          };
        }
        // TODO: Implement password verification against link.passwordHash
      }

      // Email validation
      if (link.requireEmail && !uploaderInfo.email) {
        return {
          success: false,
          error: 'This upload link requires an email address. Please provide your email to continue.',
        };
      }

      // File validation
      const constraints: FileConstraints = {
        maxFileSize: link.maxFileSize,
        ...(link.allowedFileTypes && { allowedFileTypes: link.allowedFileTypes }),
      };

      const validationResult = validateFile(file, constraints);
      
      if (!validationResult.isValid) {
        const errors = validationResult.errors;
        const sizeError = errors.find(e => e.field === 'fileSize');
        if (sizeError) {
          const maxSizeMB = Math.round(link.maxFileSize / (1024 * 1024));
          const fileSizeMB = Math.round(file.size / (1024 * 1024));
          return {
            success: false,
            error: `File too large. This file (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for this upload link.`,
          };
        }
        
        const typeError = errors.find(e => e.field === 'fileType');
        if (typeError && link.allowedFileTypes) {
          return {
            success: false,
            error: `File type not allowed. This upload link only accepts: ${link.allowedFileTypes.join(', ')}`,
          };
        }
        
        return {
          success: false,
          error: errors[0]?.message || 'File validation failed',
        };
      }

      // Initialize storage
      const fileService = new FileService();
      const storageService = new StorageService(this.supabase);
      
      const bucketInit = await storageService.initializeBuckets();
      if (!bucketInit.success) {
        return {
          success: false,
          error: `Upload system unavailable: ${bucketInit.error}`,
        };
      }

      // Check for existing files and generate unique name
      let uniqueFileName = file.name;

      if (folderId) {
        const existingFilesResult = await fileService.getFilesByFolder(folderId);
        if (existingFilesResult.success) {
          const existingFileNames = existingFilesResult.data.map(f => f.fileName);
          uniqueFileName = generateUniqueFileName(file.name, existingFileNames);
        }
      } else {
        // For root files, check existing root files for this link
        const existingRootFilesResult = await db
          .select()
          .from(files)
          .where(
            and(
              eq(files.linkId, linkId),
              isNull(files.folderId)
            )
          );

        if (existingRootFilesResult && existingRootFilesResult.length > 0) {
          const existingFileNames = existingRootFilesResult.map(f => f.fileName);
          const { generateUniqueName } = await import('@/features/files/utils/file-operations');
          uniqueFileName = generateUniqueName(file.name, existingFileNames);
        }
      }

      // Upload file to storage
      const uploadPath = folderId ? `${linkId}/folders/${folderId}` : linkId;

      const uploadResult = await storageService.uploadFileWithQuotaCheck(
        file,
        uploadPath,
        link.userId,
        linkId,
        'shared'
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error,
        };
      }

      // Calculate checksum
      const checksum = await storageService.calculateChecksum(file);

      // Create database record
      const fileData = {
        fileName: uniqueFileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        extension: uniqueFileName.split('.').pop() || '',
        userId: link.userId,
        folderId: folderId || null,
        linkId,
        batchId: `upload_${Date.now()}_${linkId}`,
        storagePath: uploadResult.data!.path,
        storageProvider: 'supabase' as const,
        checksum,
        isSafe: true,
        virusScanResult: 'clean' as const,
        processingStatus: 'completed' as const,
        isOrganized: false,
        needsReview: false,
        downloadCount: 0,
        isPublic: true,
        sharedAt: new Date(),
        uploadedAt: new Date(),
        metadata: {
          uploaderName: uploaderInfo.name,
          uploaderEmail: uploaderInfo.email,
          uploaderMessage: uploaderInfo.message,
          uploadedViaLink: true,
          linkTitle: link.title,
          linkType: link.linkType,
        },
      };

      const createFileResult = await fileService.createFile(fileData);

      if (!createFileResult.success) {
        // Clean up the uploaded file if database creation fails
        await storageService.deleteFile(uploadResult.data!.path, 'shared');
        return {
          success: false,
          error: `Upload failed: ${createFileResult.error}`,
        };
      }

      // Update link statistics
      await db
        .update(links)
        .set({
          totalFiles: sql`${links.totalFiles} + 1`,
          totalSize: sql`${links.totalSize} + ${file.size}`,
          storageUsed: sql`${links.storageUsed} + ${file.size}`,
          lastUploadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId));

      return {
        success: true,
        data: {
          fileId: createFileResult.data!.id,
          fileName: uniqueFileName,
          fileSize: file.size,
          uploadedAt: new Date(),
          quotaInfo: uploadResult.data?.quotaInfo,
        },
      };
    } catch (error) {
      console.error('Upload to link failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed due to an unexpected error',
      };
    }
  }

  /**
   * Fetch public files for a link and organize them in a tree structure
   */
  async fetchPublicFiles(linkId: string): Promise<DatabaseResult<FileTreeNode[]>> {
    try {
      // First fetch the link to get expiry information
      const linkResult = await db
        .select({
          expiresAt: links.expiresAt,
        })
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (linkResult.length === 0) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const linkData = linkResult[0];

      // Fetch all files for this link with batch info
      const filesResult = await db
        .select({
          file: files,
          batch: {
            id: batches.id,
            uploaderName: batches.uploaderName,
            createdAt: batches.createdAt,
          },
        })
        .from(files)
        .innerJoin(batches, eq(files.batchId, batches.id))
        .where(eq(files.linkId, linkId))
        .orderBy(files.createdAt);

      // Organize files by uploader and date
      const tree: FileTreeNode[] = [];
      const uploaderMap = new Map<string, FileTreeNode>();

      for (const { file, batch } of filesResult) {
        // Create uploader folder if doesn't exist
        if (!uploaderMap.has(batch.uploaderName)) {
          const uploaderNode: FileTreeNode = {
            id: `uploader-${batch.uploaderName}`,
            name: batch.uploaderName,
            type: 'folder',
            children: [],
          };
          uploaderMap.set(batch.uploaderName, uploaderNode);
          tree.push(uploaderNode);
        }

        const uploaderNode = uploaderMap.get(batch.uploaderName)!;

        // Create date folder
        const uploadDate = new Date(batch.createdAt ?? file.createdAt);
        const dateStr = uploadDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        
        let dateNode = uploaderNode.children?.find(
          (child) => child.id === `date-${batch.uploaderName}-${dateStr}`
        );

        if (!dateNode) {
          dateNode = {
            id: `date-${batch.uploaderName}-${dateStr}`,
            name: dateStr,
            type: 'folder',
            children: [],
          };
          uploaderNode.children!.push(dateNode);
        }

        // Generate download URL using link-aware expiry
        const supabaseClient = getSupabaseClient();
        const storageService = new StorageService(supabaseClient);
        
        const signedUrlExpiry = calculateSignedUrlExpiry(linkData?.expiresAt || null);
        
        let downloadUrl = '';
        
        if (signedUrlExpiry === undefined) {
          // No expiry - use public URL for unlimited access
          const publicUrlResult = await storageService.getPublicUrl(
            file.storagePath,
            'shared' // Link uploads use shared context
          );
          
          if (publicUrlResult.success) {
            downloadUrl = publicUrlResult.data;
          }
        } else {
          // Use signed URL with calculated expiry
          const downloadResult = await storageService.getDownloadUrl(
            file.storagePath,
            'shared', // Link uploads use shared context
            signedUrlExpiry
          );
          
          if (downloadResult.success) {
            downloadUrl = downloadResult.data.url;
          }
        }

        // Add file to date folder
        const fileNode: FileTreeNode = {
          id: file.id,
          name: file.originalName || file.fileName,
          type: 'file',
          size: Number(file.fileSize),
          mimeType: file.mimeType,
          downloadUrl,
          uploadedAt: new Date(file.uploadedAt || file.createdAt),
          uploaderName: batch.uploaderName,
        };

        dateNode.children!.push(fileNode);
      }

      return {
        success: true,
        data: tree,
      };
    } catch (error) {
      console.error('Error fetching public files:', error);
      return {
        success: false,
        error: 'Failed to fetch files',
      };
    }
  }
}

// Export singleton instance
export const linkFileService = new LinkFileService();