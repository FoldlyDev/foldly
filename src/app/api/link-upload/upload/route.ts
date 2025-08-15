import { NextRequest, NextResponse } from 'next/server';
import { validateClientIP } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';
import { validateLinkAccessAction } from '@/features/link-upload/lib/actions';
import { db } from '@/lib/database/connection';
import { files, batches, links, users } from '@/lib/database/schemas';
import { eq, and, sql } from 'drizzle-orm';
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
    const linkSlug = formData.get('linkSlug') as string;
    const linkPassword = formData.get('linkPassword') as string | null;

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

    // Validate link access if needed
    if (linkSlug) {
      const accessResult = await validateLinkAccessAction({
        slugParts: linkSlug.split('/')
      });
      if (!accessResult.success) {
        return NextResponse.json(
          createErrorResponse(accessResult.error || 'Access denied', ERROR_CODES.UNAUTHORIZED),
          { status: 401 }
        );
      }
    }

    // Get the file record that was created during batch creation
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.batchId, batchId)
      ))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json(
        createErrorResponse('File record not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }

    // Get the batch to get the user ID (link owner)
    const [batchWithLink] = await db
      .select({
        batch: batches,
        link: links,
      })
      .from(batches)
      .innerJoin(links, eq(batches.linkId, links.id))
      .where(eq(batches.id, batchId))
      .limit(1);

    if (!batchWithLink) {
      return NextResponse.json(
        createErrorResponse('Batch not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }

    const { batch, link } = batchWithLink;
    const userId = link.userId;

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${linkId}/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload directly to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload error', uploadError, {
        fileId,
        fileName: file.name,
        userId,
        linkId
      });
      return NextResponse.json(
        createErrorResponse('Failed to upload file to storage', ERROR_CODES.STORAGE_ERROR),
        { status: 500 }
      );
    }

    // Update the file record with storage path and status
    const fileExtension = file.name.split('.').pop() || '';
    
    const updateData: any = {
      storagePath: uploadData.path,
      storageProvider: 'supabase',
      originalName: file.name,
      extension: fileExtension,
      processingStatus: 'completed',
      isSafe: true,
      virusScanResult: 'clean',
      downloadCount: 0,
      updatedAt: new Date(),
    };
    
    // Update folderId if provided
    if (folderId) {
      updateData.folderId = folderId;
    }
    
    const updateResult = await db
      .update(files)
      .set(updateData)
      .where(eq(files.id, fileId))
      .returning({ id: files.id });

    if (updateResult.length === 0) {
      // Cleanup storage if database update fails
      await supabase.storage.from('files').remove([storagePath]);
      return NextResponse.json(
        createErrorResponse('Failed to update file record', ERROR_CODES.DATABASE_ERROR),
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
        id: fileId,
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