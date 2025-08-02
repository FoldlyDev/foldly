import { db } from '@/lib/database/connection';
import { files, folders, batches, links, users } from '@/lib/database/schemas';
import { eq, and, ne, desc, or, lt, sql, inArray, isNull } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { BillingService } from '@/features/billing/lib/services';
import { FolderService } from '@/features/files/lib/services/folder-service';
import { StorageService } from '@/features/files/lib/services/storage-service';
import { FileService } from '@/features/files/lib/services/file-service';
import { LinksDbService } from '@/features/links/lib/db-service';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { calculateSignedUrlExpiry } from '@/lib/utils/signed-url-expiry';
import { canAcceptUploads, isLinkExpired } from '@/lib/database/types/links';
import {
  validateFile,
  formatFileSize,
  checkFileType,
  type FileConstraints,
} from '@/lib/upload/utils/file-validation';
import { generateUniqueFileName } from '@/lib/upload/utils/file-processing';
import bcrypt from 'bcryptjs';
import type { LinkWithOwner, FileTreeNode } from '../../types';

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

interface PreviousFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

interface StorageCheckResult {
  hasSpace: boolean;
  currentUsage: number;
  storageLimit: number;
  availableSpace: number;
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderName: string;
}

interface CreateBatchParams {
  linkId: string;
  files: FileData[];
  folderId?: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
}

interface BatchResponse {
  batchId: string;
  files: { id: string; fileName: string }[];
}

interface UploadFileParams {
  batchId: string;
  fileId: string;
  file: File;
}

interface FileUploadResult {
  id: string;
  path: string;
}

export class LinkUploadService {
  private supabase: ReturnType<typeof createClient>;
  private folderService: FolderService;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.folderService = new FolderService();
  }

  /**
   * Check if user has enough storage space available
   */
  async checkStorageAvailable(
    userId: string,
    requiredSpace: number
  ): Promise<DatabaseResult<StorageCheckResult>> {
    try {
      // Get user's current storage usage
      const userResult = await db
        .select({
          storageUsed: users.storageUsed,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const currentUsage = userResult[0].storageUsed;

      // Get user's storage limit from subscription
      const billingResult = await BillingService.getUserBillingData(userId);
      
      if (!billingResult.success) {
        return {
          success: false,
          error: billingResult.error || 'Failed to get user billing data',
        };
      }

      const storageLimitBytes = billingResult.data.storageLimit;
      const availableSpace = storageLimitBytes - currentUsage;
      const hasSpace = availableSpace >= requiredSpace;

      return {
        success: true,
        data: {
          hasSpace,
          currentUsage,
          storageLimit: storageLimitBytes,
          availableSpace,
        },
      };
    } catch (error) {
      console.error('Error checking storage availability:', error);
      return {
        success: false,
        error: 'Failed to check storage availability',
      };
    }
  }

  /**
   * Create a new upload batch with file records
   */
  async createBatch(
    params: CreateBatchParams
  ): Promise<DatabaseResult<BatchResponse>> {
    try {
      // Get the link to verify it exists and get the owner's userId
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, params.linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      // Use the link owner's userId for the batch
      const userId = link.userId;

      // Calculate total size and file count
      const totalSize = params.files.reduce((sum, file) => sum + file.fileSize, 0);
      const totalFiles = params.files.length;

      // Create the batch record
      const [batch] = await db
        .insert(batches)
        .values({
          linkId: params.linkId,
          userId: userId,
          uploaderName: params.files[0]?.uploaderName || 'Anonymous',
          uploaderEmail: params.uploaderEmail,
          uploaderMessage: params.uploaderMessage,
          totalFiles,
          totalSize,
          status: 'uploading',
          processedFiles: 0,
        })
        .returning({ id: batches.id });

      if (!batch) {
        return {
          success: false,
          error: 'Failed to create batch',
        };
      }

      // Create folder if needed and doesn't exist
      let actualFolderId = params.folderId;
      
      if (params.folderId) {
        // Check if this is a virtual folder that needs to be created
        const folderResult = await this.folderService.getFolderById(params.folderId);
        
        if (!folderResult.success) {
          // Folder doesn't exist, create it for link uploads
          const createResult = await this.folderService.createFolder({
            name: `Upload_${new Date().toISOString().split('T')[0]}`,
            parentFolderId: null,
            workspaceId: null,  // No workspace for link uploads
            linkId: params.linkId,
            userId: userId,
            path: `Upload_${new Date().toISOString().split('T')[0]}`,
            depth: 0,
          });
          
          if (createResult.success && createResult.data) {
            actualFolderId = createResult.data.id;
          } else {
            // If folder creation fails, continue without folder
            console.warn('Failed to create folder for upload, continuing without folder');
            actualFolderId = undefined;
          }
        }
      }

      // Create file records for each file in the batch
      const fileRecords = params.files.map(file => ({
        batchId: batch.id,
        folderId: actualFolderId || null,
        linkId: params.linkId,
        workspaceId: null,  // No workspace for link uploads
        userId: userId,  // Link owner's userId
        fileName: file.fileName,
        originalName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        extension: file.fileName.split('.').pop() || '',
        processingStatus: 'pending' as const,
        storagePath: '',  // Will be set when file is actually uploaded
        storageProvider: 'supabase' as const,
        isSafe: true,
        virusScanResult: 'clean' as const,
        isOrganized: false,
        needsReview: false,
        downloadCount: 0,
      }));

      const createdFiles = await db
        .insert(files)
        .values(fileRecords)
        .returning({ id: files.id, fileName: files.fileName });

      if (createdFiles.length === 0) {
        // Rollback batch if file creation fails
        await db.delete(batches).where(eq(batches.id, batch.id));
        return {
          success: false,
          error: 'Failed to create file records',
        };
      }

      return {
        success: true,
        data: {
          batchId: batch.id,
          files: createdFiles.map(f => ({ id: f.id, fileName: f.fileName })),
        },
      };
    } catch (error) {
      console.error('Error creating batch:', error);
      return {
        success: false,
        error: 'Failed to create upload batch',
      };
    }
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
      
      const updateResult = await db
        .update(files)
        .set({
          storagePath: uploadData.path,
          storageProvider: 'supabase',
          originalName: params.file.name,
          extension: fileExtension,
          processingStatus: 'completed',
          isSafe: true,
          virusScanResult: 'clean',
          downloadCount: 0,
          updatedAt: new Date(),
        })
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
        .where(eq(links.id, fileRecord.linkId));

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
   * Complete a batch upload
   */
  async completeBatch(batchId: string): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(batches)
        .set({
          status: 'completed',
          uploadCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(batches.id, batchId));

      return { success: true };
    } catch (error) {
      console.error('Error completing batch:', error);
      return {
        success: false,
        error: 'Failed to complete batch',
      };
    }
  }

  /**
   * Validate link access based on slug parts
   */
  async validateLinkAccess(
    slugParts: string[]
  ): Promise<DatabaseResult<LinkWithOwner>> {
    try {
      // Validate input
      if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) {
        console.error('Invalid slugParts:', slugParts);
        return {
          success: false,
          error: 'Invalid link format',
        };
      }

      console.log('Validating link access for slugParts:', slugParts);

      let linkResult = null;

      if (slugParts.length === 1) {
        // Single slug - base link only
        const slug = slugParts[0];
        if (!slug) {
          return {
            success: false,
            error: 'Invalid slug',
          };
        }
        
        const baseResult = await db
          .select({
            links: links,
            users: users
          })
          .from(links)
          .innerJoin(users, eq(links.userId, users.id))
          .where(
            and(
              eq(links.slug, slug),
              eq(links.linkType, 'base')
            )
          )
          .limit(1);
        
        if (baseResult.length > 0) {
          linkResult = baseResult[0];
        }
      } else if (slugParts.length === 2) {
        // Two parts - could be custom link OR generated link
        const firstSlug = slugParts[0];
        const secondSlug = slugParts[1];
        
        if (!firstSlug || !secondSlug) {
          return {
            success: false,
            error: 'Invalid slug parts',
          };
        }
        
        // First try custom link (slug + topic)
        const customResult = await db
          .select({
            links: links,
            users: users
          })
          .from(links)
          .innerJoin(users, eq(links.userId, users.id))
          .where(
            and(
              eq(links.slug, firstSlug),
              eq(links.topic, secondSlug),
              eq(links.linkType, 'custom')
            )
          )
          .limit(1);
        
        if (customResult.length > 0) {
          linkResult = customResult[0];
        } else {
          // Try generated link (base slug + generated slug)
          const generatedResult = await db
            .select({
              links: links,
              users: users
            })
            .from(links)
            .innerJoin(users, eq(links.userId, users.id))
            .where(
              and(
                eq(links.slug, secondSlug), // The generated slug is the second part
                eq(links.linkType, 'generated')
              )
            )
            .limit(1);
          
          if (generatedResult.length > 0) {
            linkResult = generatedResult[0];
          }
        }
      } else {
        // Invalid URL structure
        return {
          success: false,
          error: 'Invalid link structure',
        };
      }

      if (!linkResult) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const link = linkResult.links;
      const owner = linkResult.users;

      // Check if link is active
      if (!link.isActive) {
        return {
          success: false,
          error: 'This link is no longer active',
        };
      }

      // Check if link has expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return {
          success: false,
          error: 'This link has expired',
        };
      }

      // Get user's subscription plan
      const billingResult = await BillingService.getUserBillingData(owner.id);
      
      let storageLimit: number;
      let maxFileSize: number;
      
      if (!billingResult.success) {
        console.warn('Failed to get billing data, using free plan defaults:', billingResult.error);
        // Fallback to free plan defaults if billing service fails
        storageLimit = 50 * 1024 * 1024 * 1024; // 50GB in bytes
        maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
      } else {
        storageLimit = billingResult.data.storageLimit;
        maxFileSize = 5 * 1024 * 1024; // Keep 5MB as default for now
      }

      const linkWithOwner: LinkWithOwner = {
        ...link,
        owner: {
          id: owner.id,
          username: owner.username,
          storageUsed: owner.storageUsed,
        },
        subscription: {
          storageLimit: storageLimit,
          maxFileSize: maxFileSize,
        },
      };

      return {
        success: true,
        data: linkWithOwner,
      };
    } catch (error) {
      console.error('Error validating link access:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes('DATABASE_URL')) {
        return {
          success: false,
          error: 'Database connection not configured',
        };
      }
      
      return {
        success: false,
        error: 'Failed to validate link access',
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
  ): Promise<DatabaseResult<{ files: PreviousUpload[]; folders: PreviousFolder[] }>> {
    try {
      // Get the current date minus 1 hour to define "current session"
      const sessionCutoff = new Date(Date.now() - 60 * 60 * 1000);

      // Fetch all folders for this link
      const foldersResult = await db
        .select()
        .from(folders)
        .where(eq(folders.linkId, linkId))
        .orderBy(folders.path);

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
      const transformedFolders: PreviousFolder[] = (foldersResult || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentFolderId,
        createdAt: folder.createdAt ? folder.createdAt.toISOString() : new Date().toISOString(),
      }));

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
          folders: transformedFolders,
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

      return { success: true };
    } catch (error) {
      console.error('Error tracking download:', error);
      return {
        success: false,
        error: 'Failed to track download',
      };
    }
  }

  /**
   * Validate link password
   */
  async validateLinkPassword(
    linkId: string,
    password: string
  ): Promise<DatabaseResult<{ isValid: boolean }>> {
    try {
      // Get link password hash
      const linkResult = await db
        .select({
          passwordHash: links.passwordHash,
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

      const { passwordHash } = linkResult[0];

      if (!passwordHash) {
        return {
          success: true,
          data: { isValid: true }, // No password required
        };
      }

      // Validate password
      const isValid = await bcrypt.compare(password, passwordHash);

      return {
        success: true,
        data: { isValid },
      };
    } catch (error) {
      console.error('Error validating password:', error);
      return {
        success: false,
        error: 'Failed to validate password',
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

      // Fetch all folders associated with this link
      const foldersResult = await db
        .select()
        .from(folders)
        .where(eq(folders.linkId, linkId))
        .orderBy(folders.path);

      // Fetch all files associated with this link (with batch info for uploader name)
      const filesResult = await db
        .select({
          file: files,
          batch: batches
        })
        .from(files)
        .leftJoin(batches, eq(files.batchId, batches.id))
        .where(eq(files.linkId, linkId))
        .orderBy(files.fileName);

      // Transform database results to tree component format
      const transformedFolders = foldersResult.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentFolderId || undefined,
        linkId: folder.linkId || linkId,
        createdAt: folder.createdAt.toISOString(),
        path: folder.path,
        depth: folder.depth,
      }));

      const transformedFiles = filesResult.map(result => ({
        id: result.file.id,
        originalName: result.file.originalName || result.file.fileName,
        parentId: result.file.folderId || undefined,
        linkId: result.file.linkId || linkId,
        fileSize: Number(result.file.fileSize),
        mimeType: result.file.mimeType,
        createdAt: result.file.createdAt.toISOString(),
        uploaderName: result.batch?.uploaderName || 'Anonymous',
        storagePath: result.file.storagePath || '',
        processingStatus: result.file.processingStatus,
      }));

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

  /**
   * Create a new folder in a link
   */
  async createLinkFolder(
    linkId: string,
    folderName: string,
    parentFolderId?: string
  ): Promise<DatabaseResult<{
    id: string;
    name: string;
    parentId?: string;
    linkId: string;
    createdAt: Date;
  }>> {
    try {
      // Get the link to verify it exists and get the owner's userId
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      // Use the link owner's userId
      const userId = link.userId;

      // Calculate proper path and depth
      let folderPath = folderName;
      let depth = 0;

      if (parentFolderId) {
        const parentFolderResult = await this.folderService.getFolderById(parentFolderId);
        if (!parentFolderResult.success || !parentFolderResult.data) {
          return { 
            success: false, 
            error: 'Parent folder not found' 
          };
        }

        const parentFolder = parentFolderResult.data;
        folderPath = `${parentFolder.path}/${folderName}`;
        depth = parentFolder.depth + 1;
      }

      // Create the actual folder in the database
      // For link uploads, folders belong to the link, NOT a workspace
      const result = await this.folderService.createFolder({
        name: folderName,
        parentFolderId: parentFolderId || null,
        workspaceId: null,  // No workspace for link-upload folders
        linkId: linkId,     // Associate with the link ONLY
        userId: userId,
        path: folderPath,
        depth: depth,
      });

      if (!result.success || !result.data) {
        console.error('Failed to create folder:', result.error);
        return {
          success: false,
          error: 'Failed to create folder',
        };
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          parentId: result.data.parentFolderId || undefined,
          linkId: result.data.linkId || linkId,
          createdAt: result.data.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      };
    }
  }

  /**
   * Delete multiple items (files/folders) from a link
   */
  async batchDeleteLinkItems(
    linkId: string,
    itemIds: string[],
    supabaseClient: ReturnType<typeof createClient>
  ): Promise<DatabaseResult<{
    deletedItems: string[];
    deletedCount: number;
    deletedFolders: number;
    deletedFiles: number;
  }>> {
    try {
      // Get the link to verify it exists
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const storageService = new StorageService(supabaseClient);
      let deletedFolders = 0;
      let deletedFiles = 0;

      // Separate folder and file IDs
      const folderIds = itemIds.filter(id => id.startsWith('folder-') || !id.includes('.'));
      const fileIds = itemIds.filter(id => !folderIds.includes(id));

      // Delete folders (which will cascade delete their contents)
      for (const folderId of folderIds) {
        const result = await this.folderService.deleteFolderWithStorage(folderId, storageService);
        if (result.success) {
          deletedFolders++;
        }
      }

      // Delete individual files
      if (fileIds.length > 0) {
        // Get file details for storage deletion
        const filesToDelete = await db
          .select()
          .from(files)
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        // Delete from storage
        for (const file of filesToDelete) {
          if (file.storagePath) {
            await storageService.deleteFile(file.storagePath);
          }
        }

        // Delete from database
        await db
          .delete(files)
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        deletedFiles = fileIds.length;
      }

      return {
        success: true,
        data: {
          deletedItems: itemIds,
          deletedCount: deletedFolders + deletedFiles,
          deletedFolders,
          deletedFiles,
        },
      };
    } catch (error) {
      console.error('Error deleting items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete items',
      };
    }
  }

  /**
   * Move items to a different folder within a link
   */
  async moveLinkItems(
    linkId: string,
    itemIds: string[],
    targetFolderId: string | null
  ): Promise<DatabaseResult<{
    movedItems: string[];
    movedCount: number;
    movedFolders: number;
    movedFiles: number;
    targetFolderId: string | null;
  }>> {
    try {
      // Get the link to verify it exists
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      let movedFolders = 0;
      let movedFiles = 0;

      // Validate target folder if provided
      if (targetFolderId) {
        const targetFolderResult = await this.folderService.getFolderById(targetFolderId);
        if (!targetFolderResult.success || targetFolderResult.data?.linkId !== linkId) {
          return {
            success: false,
            error: 'Invalid target folder',
          };
        }
      }

      // Separate folder and file IDs
      const folderIds = itemIds.filter(id => id.startsWith('folder-') || !id.includes('.'));
      const fileIds = itemIds.filter(id => !folderIds.includes(id));

      // Move folders
      for (const folderId of folderIds) {
        // Update folder's parent
        const result = await this.folderService.updateFolder(folderId, {
          parentFolderId: targetFolderId,
        });
        
        if (result.success) {
          movedFolders++;
          
          // Update the path for the folder and all its descendants
          const folderResult = await this.folderService.getFolderById(folderId);
          if (folderResult.success && folderResult.data) {
            let newPath = folderResult.data.name;
            let newDepth = 0;
            
            if (targetFolderId) {
              const parentResult = await this.folderService.getFolderById(targetFolderId);
              if (parentResult.success && parentResult.data) {
                newPath = `${parentResult.data.path}/${folderResult.data.name}`;
                newDepth = parentResult.data.depth + 1;
              }
            }
            
            // Update the folder's path and depth
            await this.folderService.updateFolder(folderId, {
              path: newPath,
              depth: newDepth,
            });
          }
        }
      }

      // Move files
      if (fileIds.length > 0) {
        await db
          .update(files)
          .set({ folderId: targetFolderId })
          .where(and(
            inArray(files.id, fileIds),
            eq(files.linkId, linkId)
          ));

        movedFiles = fileIds.length;
      }

      return {
        success: true,
        data: {
          movedItems: itemIds,
          movedCount: movedFolders + movedFiles,
          movedFolders,
          movedFiles,
          targetFolderId,
        },
      };
    } catch (error) {
      console.error('Error moving items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move items',
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
   * Validate if a link can accept uploads (without actually uploading)
   */
  async validateLinkForUpload(
    linkId: string,
    password?: string
  ): Promise<DatabaseResult<{
    canUpload: boolean;
    requiresPassword: boolean;
    requiresEmail: boolean;
    maxFiles: number;
    maxFileSize: number;
    allowedFileTypes: string[] | null;
    remainingUploads: number;
    linkTitle: string;
    linkType: string;
  }>> {
    try {
      const linksService = new LinksDbService();
      const linkResult = await linksService.getById(linkId);

      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Upload link not found',
        };
      }

      const link = linkResult.data;
      const canUpload = canAcceptUploads(link);

      return {
        success: true,
        data: {
          canUpload,
          requiresPassword: link.requirePassword,
          requiresEmail: link.requireEmail,
          maxFiles: link.maxFiles,
          maxFileSize: link.maxFileSize,
          allowedFileTypes: link.allowedFileTypes,
          remainingUploads: Math.max(0, link.maxFiles - link.totalFiles),
          linkTitle: link.title,
          linkType: link.linkType,
        },
      };
    } catch (error) {
      console.error('Failed to validate link for upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
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
        const uploadDate = new Date(batch.createdAt);
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
        
        const signedUrlExpiry = calculateSignedUrlExpiry(linkData?.expiresAt);
        
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
          name: file.originalName,
          type: 'file',
          size: Number(file.fileSize),
          mimeType: file.mimeType,
          downloadUrl,
          uploadedAt: new Date(file.uploadedAt),
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
export const linkUploadService = new LinkUploadService();