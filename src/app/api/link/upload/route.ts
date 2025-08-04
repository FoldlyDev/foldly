import { NextRequest, NextResponse } from 'next/server';
import { validateClientIP } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { createErrorResponse, createSuccessResponse, ERROR_CODES, type ErrorCode } from '@/lib/types/error-response';
import { createBatchAction, completeBatchAction } from '@/features/link-upload/lib/actions';
import { createLinkFolderAction } from '@/features/link-upload/lib/actions/link-folder-actions';
import { linkUploadService } from '@/features/link-upload/lib/services';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/database/connection';
import { files as filesTable, batches, links, users } from '@/lib/database/schemas';
import { eq, and, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for batch uploads

// Initialize Supabase client for direct storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ensure storage buckets exist
async function ensureStorageBuckets() {
  try {
    // Check if 'shared' bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const sharedBucketExists = buckets?.some(b => b.name === 'shared');
    
    if (!sharedBucketExists) {
      // Create the shared bucket for link uploads
      const { error } = await supabase.storage.createBucket('shared', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: null // Allow all file types
      });
      
      if (error && !error.message?.includes('already exists')) {
        console.error('Failed to create shared bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
  }
}

interface UploadedFile {
  id: string;
  fileName: string;
  parentFolderId?: string | null;
}

interface CreatedFolder {
  id: string;
  name: string;
  parentFolderId?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    logger.debug('Link batch upload request received');
    
    // Ensure storage buckets exist
    await ensureStorageBuckets();
    
    // Extract and validate client IP for security audit
    const headers = Object.fromEntries(req.headers.entries());
    const clientIp = validateClientIP(headers);
    
    if (!clientIp) {
      logger.logSecurityEvent(
        'Link upload attempt with invalid IP',
        'medium',
        { headers: Object.keys(headers) }
      );
      return NextResponse.json(
        createErrorResponse('Invalid client IP', ERROR_CODES.INVALID_IP),
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    
    // Extract link data
    const linkId = formData.get('linkId') as string;
    const uploaderName = formData.get('uploaderName') as string || 'Anonymous';
    const uploaderEmail = formData.get('uploaderEmail') as string | null;
    const uploaderMessage = formData.get('uploaderMessage') as string | null;
    
    if (!linkId) {
      return NextResponse.json(
        createErrorResponse('Link ID is required', ERROR_CODES.INVALID_INPUT),
        { status: 400 }
      );
    }

    // Parse folders data
    const foldersJson = formData.get('folders') as string;
    const folders: CreatedFolder[] = foldersJson ? JSON.parse(foldersJson) : [];
    
    // Extract files from FormData
    const files: File[] = [];
    const fileMetadata: UploadedFile[] = [];
    
    // Get all file entries from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_')) {
        const index = key.split('_')[1];
        const file = value as File;
        files.push(file);
        
        // Get corresponding metadata
        const metadata = formData.get(`metadata_${index}`) as string;
        if (metadata) {
          fileMetadata.push(JSON.parse(metadata));
        }
      }
    }

    console.log('📊 Files extracted from FormData:', {
      filesCount: files.length,
      fileNames: files.map(f => f.name),
      metadataCount: fileMetadata.length,
      metadataDetails: fileMetadata
    });

    logger.debug('Upload request data', {
      linkId,
      metadata: {
        filesCount: files.length,
        foldersCount: folders.length,
        uploaderName,
        clientIp
      }
    });

    // Track results
    const results = {
      batchId: '',
      uploadedFiles: 0,
      createdFolders: 0,
      totalProcessed: 0,
      errors: [] as Array<{ itemId: string; itemName: string; error: string }>
    };

    // Map staging IDs to database IDs for folders
    const folderIdMap = new Map<string, string>();

    try {
      // Step 1: Create batch if we have files or folders
      let batchId: string | undefined;
      let batchResult: any;
      
      if (files.length > 0 || folders.length > 0) {
        if (files.length === 0) {
          // Create a minimal batch for folder-only uploads
          batchResult = await createBatchAction({
            linkId,
            files: [],
            uploaderName,
            ...(uploaderEmail && { uploaderEmail }),
            ...(uploaderMessage && { uploaderMessage }),
          });
        } else {
          // Normal batch creation with files
          batchResult = await createBatchAction({
            linkId,
            files: files.map((file, index) => ({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              uploaderName: uploaderName,
            })),
            uploaderName,
            ...(uploaderEmail && { uploaderEmail }),
            ...(uploaderMessage && { uploaderMessage }),
          });
        }
        
        if (!batchResult.success) {
          throw new Error(batchResult.error || 'Failed to create upload batch');
        }
        
        console.log('📊 Batch creation result:', {
          batchId: batchResult.data.batchId,
          filesInBatch: batchResult.data.files?.length || 0,
          batchFiles: batchResult.data.files
        });
        
        batchId = batchResult.data.batchId;
        results.batchId = batchId || '';
      }

      // Step 2: Create all folders in hierarchical order
      // First, organize folders by depth to create parents before children
      const foldersByDepth = new Map<number, typeof folders>();
      const calculateDepth = (folder: any, depth = 0): number => {
        if (!folder.parentFolderId) return depth;
        const parent = folders.find(f => f.id === folder.parentFolderId);
        if (!parent) return depth;
        return calculateDepth(parent, depth + 1);
      };
      
      let maxDepth = 0;
      for (const folder of folders) {
        const depth = calculateDepth(folder);
        maxDepth = Math.max(maxDepth, depth);
        if (!foldersByDepth.has(depth)) {
          foldersByDepth.set(depth, []);
        }
        foldersByDepth.get(depth)!.push(folder);
      }
      
      // Process folders level by level
      for (let depth = 0; depth <= maxDepth; depth++) {
        const foldersAtDepth = foldersByDepth.get(depth) || [];
        
        for (let i = 0; i < foldersAtDepth.length; i++) {
          const folder = foldersAtDepth[i];
          if (!folder) continue;
          
          try {
            // Resolve parent folder ID if it exists
            let parentFolderId: string | undefined = undefined;
            if (folder.parentFolderId) {
              if (folderIdMap.has(folder.parentFolderId)) {
                parentFolderId = folderIdMap.get(folder.parentFolderId);
              } else {
                parentFolderId = folder.parentFolderId;
              }
            }
            
            const result = await createLinkFolderAction(
              linkId,
              folder.name,
              parentFolderId,
              batchId,
              i // sortOrder based on position
            );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to create folder');
          }
          
          // Map staging ID to database ID
          if (result.success && 'data' in result && result.data?.folderId) {
            folderIdMap.set(folder.id, result.data.folderId);
          } else if (!result.success) {
            throw new Error('error' in result ? result.error : 'Failed to create folder');
          }
          
            results.createdFolders++;
            results.totalProcessed++;
          } catch (error) {
            results.errors.push({
              itemId: folder?.id || `folder_${i}`,
              itemName: folder?.name || 'Unknown folder',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            results.totalProcessed++;
          }
        }
      }

      // Step 3: Upload all files grouped by parent folder to maintain sort order
      console.log(`📊 Starting file upload phase: ${files.length} files to process, batchId: ${batchId}`);
      if (files.length > 0 && batchId) {
        // Group files by parent folder
        const filesByParent = new Map<string | undefined, Array<{file: File, metadata: any, index: number}>>();
        
        for (let i = 0; i < files.length; i++) {
          const parentKey = fileMetadata[i]?.parentFolderId || 'root';
          if (!filesByParent.has(parentKey)) {
            filesByParent.set(parentKey, []);
          }
          filesByParent.get(parentKey)!.push({
            file: files[i] as File,
            metadata: fileMetadata[i],
            index: i
          });
        }
        
        // Process files for each parent, maintaining sort order
        for (const [parentKey, filesInParent] of filesByParent) {
          for (let sortIndex = 0; sortIndex < filesInParent.length; sortIndex++) {
            const fileData = filesInParent[sortIndex];
            if (!fileData) continue;
            const { file, metadata, index: i } = fileData;
            
            console.log(`📊 Processing file ${i}: ${file.name} (parent: ${parentKey}, sortOrder: ${sortIndex})`);
            
            if (!file) {
              results.errors.push({
                itemId: metadata?.id || `file_${i}`,
                itemName: 'Unknown file',
                error: 'File data not found',
              });
              results.totalProcessed++;
              continue;
            }
            
            try {
              // Resolve parent folder ID if it exists
              let parentFolderId = metadata?.parentFolderId;
              if (parentFolderId && folderIdMap.has(parentFolderId)) {
                parentFolderId = folderIdMap.get(parentFolderId);
              }
            
            // Get batch info for user ID
            const [batch] = await db
              .select()
              .from(batches)
              .where(eq(batches.id, batchId))
              .limit(1);

            if (!batch) {
              throw new Error('Batch not found');
            }

            const userId = batch.userId;

            // Generate unique file path
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `${userId}/${linkId}/${timestamp}_${sanitizedName}`;
            
            console.log('📊 Storage upload details:', {
              storagePath,
              userId,
              linkId: linkId,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            });

            // Create file record first with all required fields including storage path
            const fileExtension = file.name.split('.').pop() || '';
            const fileId = crypto.randomUUID();
            
            const [fileRecord] = await db
              .insert(filesTable)
              .values({
                id: fileId,
                linkId: linkId,
                batchId: batchId,
                userId: userId,
                fileName: file.name,
                originalName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                extension: fileExtension,
                storagePath: storagePath, // Set the storage path before upload
                storageProvider: 'supabase',
                processingStatus: 'processing',
                folderId: parentFolderId || null,
                sortOrder: sortIndex,
                isPublic: true,
                isSafe: true,
                virusScanResult: 'clean',
                uploaderName: uploaderName,
                downloadCount: 0,
              })
              .returning({ id: filesTable.id });

            if (!fileRecord) {
              throw new Error('Failed to create file record');
            }

            // Convert File to ArrayBuffer then to Uint8Array for Supabase
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('shared')
              .upload(storagePath, uint8Array, {
                contentType: file.type,
                upsert: false,
              });

            if (uploadError) {
              // Delete the file record if upload fails
              await db.delete(filesTable).where(eq(filesTable.id, fileId));
              
              console.error('❌ Supabase storage upload error:', {
                error: uploadError,
                message: uploadError.message,
                statusCode: (uploadError as any).statusCode,
                path: storagePath,
                fileId: fileId,
                fileName: file.name
              });
              throw new Error(`Failed to upload file to storage: ${uploadError.message || 'Unknown error'}`);
            }

            // Update file status to completed after successful upload
            await db
              .update(filesTable)
              .set({
                processingStatus: 'completed',
                updatedAt: new Date(),
              })
              .where(eq(filesTable.id, fileId));

            // Update user storage usage
            await db
              .update(users)
              .set({
                storageUsed: sql`${users.storageUsed} + ${file.size}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));

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

            // Update batch processed files count
            await db
              .update(batches)
              .set({
                processedFiles: sql`${batches.processedFiles} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(batches.id, batchId));
            
              results.uploadedFiles++;
              results.totalProcessed++;
              console.log(`✅ File uploaded successfully: ${file.name} (Total uploaded: ${results.uploadedFiles}, sortOrder: ${sortIndex})`);
            } catch (error) {
              console.error(`❌ Failed to upload file ${i}: ${file.name}`, error);
              results.errors.push({
                itemId: metadata?.id || `file_${i}`,
                itemName: file?.name || 'Unknown file',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              results.totalProcessed++;
            }
          }
        }

        // Step 4: Complete the batch
        if (batchId) {
          await completeBatchAction(batchId);
        }
      }

      logger.info('Link batch upload completed', {
        linkId,
        batchId,
        metadata: {
          uploadedFiles: results.uploadedFiles,
          createdFolders: results.createdFolders,
          errors: results.errors.length
        }
      });

      return NextResponse.json(
        createSuccessResponse({
          ...results,
          progress: {
            total: files.length + folders.length,
            completed: results.totalProcessed,
            failed: results.errors.length,
            errors: results.errors,
          }
        })
      );
    } catch (error) {
      logger.error('Link batch upload processing failed', error, {
        linkId,
        metadata: { 
          filesCount: files.length,
          foldersCount: folders.length 
        }
      });
      
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : 'Batch upload failed',
          ERROR_CODES.INTERNAL_ERROR
        ),
        { status: 500 }
      );
    }
  } catch (error) {
    logger.critical('Link batch upload API error', error, {
      action: 'link_batch_upload'
    });
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Upload failed',
        ERROR_CODES.INTERNAL_ERROR
      ),
      { status: 500 }
    );
  }
}