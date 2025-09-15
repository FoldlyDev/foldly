import { NextRequest, NextResponse } from 'next/server';
import { validateClientIP } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';
// TODO: Uncomment when actions are re-implemented with new tree
// import { validateLinkAccessAction } from '@/features/link-upload/lib/actions';
import { db } from '@/lib/database/connection';
import { files, batches, links, users } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for uploads

// Initialize Supabase client for direct storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    logger.debug('Link file upload request received');
    
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
    
    // Extract required fields
    const file = formData.get('file') as File;
    const batchId = formData.get('batchId') as string;
    const fileId = formData.get('fileId') as string;
    const folderId = formData.get('folderId') as string | null;
    const linkId = formData.get('linkId') as string;
    // const linkSlug = formData.get('linkSlug') as string;
    // const linkPassword = formData.get('linkPassword') as string | null;

    logger.debug('Upload request data', {
      metadata: {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        batchId,
        fileId,
        linkId,
        folderId,
        clientIp
      }
    });

    if (!file || !batchId || !fileId || !linkId) {
      logger.warn('Upload validation failed: Missing required fields', {
        metadata: {
          hasFile: !!file,
          hasBatchId: !!batchId,
          hasFileId: !!fileId,
          hasLinkId: !!linkId
        }
      });
      return NextResponse.json(
        createErrorResponse(
          'Missing required fields',
          ERROR_CODES.INVALID_INPUT,
          {
            hasFile: !!file,
            hasBatchId: !!batchId,
            hasFileId: !!fileId,
            hasLinkId: !!linkId
          }
        ),
        { status: 400 }
      );
    }

    // TODO: Re-implement link validation with new tree system
    // if (linkSlug) {
    //   const accessResult = await validateLinkAccessAction({
    //     slugParts: linkSlug.split('/')
    //   });
    //   if (!accessResult.success) {
    //     return NextResponse.json(
    //       createErrorResponse(accessResult.error || 'Access denied', ERROR_CODES.UNAUTHORIZED),
    //       { status: 401 }
    //     );
    //   }
    // }

    // For link uploads, we create the file record here (unlike workspace uploads where it's pre-created)
    // The fileId from the client is just a temporary staged ID

    // Get the batch to get the user ID (link owner) and check if it's a generated link
    const batchWithLink = await db
      .select({
        batch: batches,
        link: links,
      })
      .from(batches)
      .innerJoin(links, eq(batches.linkId, links.id))
      .where(eq(batches.id, batchId))
      .limit(1);

    if (!batchWithLink || batchWithLink.length === 0) {
      return NextResponse.json(
        createErrorResponse('Batch not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }

    const batchData = batchWithLink[0];
    if (!batchData) {
      return NextResponse.json(
        createErrorResponse('Batch data not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }
    
    const { batch, link } = batchData;
    const userId = link.userId;
    const isGeneratedLink = link.linkType === 'generated';

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${linkId}/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload directly to Supabase Storage (using 'shared-files' public bucket for link uploads)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shared-files')
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Properly handle Supabase error object
      const errorMessage = uploadError?.message || 'Unknown storage error';
      const errorDetails = {
        fileId,
        fileName: file.name,
        userId,
        linkId,
        storagePath,
        errorMessage,
        errorCode: (uploadError as any)?.code,
        errorDetails: (uploadError as any)?.details,
      };
      
      logger.error('Storage upload error', new Error(errorMessage), errorDetails);
      
      return NextResponse.json(
        createErrorResponse(`Failed to upload file to storage: ${errorMessage}`, ERROR_CODES.STORAGE_ERROR),
        { status: 500 }
      );
    }

    // Create the file record with storage path and status
    const fileExtension = file.name.split('.').pop() || '';
    
    // For generated links, files go to the workspace with the target folder
    // For base/custom links, files stay associated with the link
    const fileValues = {
      batchId,
      linkId: isGeneratedLink ? null : linkId, // Generated links: files belong to workspace
      workspaceId: isGeneratedLink ? link.workspaceId : null, // Generated links: set workspace
      folderId: isGeneratedLink ? (batch.targetFolderId || null) : (folderId || null), // Generated links: use batch target folder
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extension: fileExtension,
      storagePath: uploadData.path,
      storageProvider: 'supabase',
      checksum: null,
      isSafe: true, // Mark as safe for now - real virus scan would be async
      virusScanResult: 'clean',
      processingStatus: 'completed' as const,
      thumbnailPath: null,
      isOrganized: false,
      needsReview: false,
      sortOrder: 0,
      downloadCount: 0,
      lastAccessedAt: null,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.debug('Creating file record', {
      isGeneratedLink,
      linkType: link.linkType,
      targetFolder: batch.targetFolderId,
      fileValues: {
        linkId: fileValues.linkId,
        workspaceId: fileValues.workspaceId,
        folderId: fileValues.folderId,
      }
    });
    
    const [fileRecord] = await db.insert(files).values(fileValues).returning({ id: files.id });

    if (!fileRecord) {
      // Cleanup storage if database insert fails
      await supabase.storage.from('shared-files').remove([storagePath]);
      return NextResponse.json(
        createErrorResponse('Failed to create file record', ERROR_CODES.DATABASE_ERROR),
        { status: 500 }
      );
    }

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
        lastUploadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(links.id, linkId));

    // Update batch processed files count
    const [updatedBatch] = await db
      .update(batches)
      .set({
        processedFiles: sql`${batches.processedFiles} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId))
      .returning({ processedFiles: batches.processedFiles, totalFiles: batches.totalFiles });

    // Check if batch is completed and send broadcast
    if (updatedBatch && updatedBatch.processedFiles === updatedBatch.totalFiles) {
      // Get the link owner's userId to send them a notification
      const linkOwner = await db
        .select({ userId: links.userId, title: links.title })
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (linkOwner[0]) {
        // Send broadcast to the link owner's channel
        const channelName = `files:user:${linkOwner[0].userId}`;
        const channel = supabase.channel(channelName);

        // Subscribe first to ensure the channel is ready
        await new Promise<void>((resolve) => {
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });
        });

        // Now send the broadcast
        await channel.send({
          type: 'broadcast',
          event: 'file_update',
          payload: {
            type: 'batch_completed',
            linkId,
            batchId,
            userId: linkOwner[0].userId,
            uploaderName: batch.uploaderName,
            fileCount: updatedBatch.totalFiles,
            linkTitle: linkOwner[0].title,
          },
        });

        // Clean up the channel
        await supabase.removeChannel(channel);
      }
    }

    logger.info('File uploaded successfully', {
      userId,
      linkId,
      fileId,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        storagePath: uploadData.path
      }
    });

    return NextResponse.json(
      createSuccessResponse({
        id: fileRecord.id,
        path: uploadData.path,
        fileName: file.name,
        fileSize: file.size
      })
    );
  } catch (error) {
    logger.critical('Link file upload API error', error, {
      action: 'link_file_upload'
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