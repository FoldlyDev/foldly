import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFileAction } from '@/features/workspace/lib/actions';
import { validateClientIP } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for uploads

export async function POST(req: NextRequest) {
  try {
    logger.debug('Workspace upload request received');
    
    // Extract and validate client IP for security audit
    const headers = Object.fromEntries(req.headers.entries());
    const clientIp = validateClientIP(headers);
    
    if (!clientIp) {
      logger.logSecurityEvent(
        'Upload attempt with invalid IP',
        'medium',
        { headers: Object.keys(headers) }
      );
      return NextResponse.json(
        createErrorResponse('Invalid client IP', ERROR_CODES.INVALID_IP),
        { status: 400 }
      );
    }
    
    const { userId } = await auth();
    
    if (!userId) {
      logger.warn('Upload attempt without authentication', { clientIp });
      return NextResponse.json(
        createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    logger.debug('Authenticated user for upload', { userId, clientIp });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const folderId = formData.get('folderId') as string | null;
    
    logger.debug('Upload request data', {
      userId,
      metadata: {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        workspaceId,
        folderId,
        clientIp
      }
    });

    if (!file || !workspaceId) {
      logger.warn('Upload validation failed: Missing required fields', {
        userId,
        metadata: {
          hasFile: !!file,
          hasWorkspaceId: !!workspaceId
        }
      });
      return NextResponse.json(
        createErrorResponse(
          'Missing required fields',
          ERROR_CODES.INVALID_INPUT,
          {
            hasFile: !!file,
            hasWorkspaceId: !!workspaceId
          }
        ),
        { status: 400 }
      );
    }

    // Use the workspace-specific upload action with IP for security
    const result = await uploadFileAction(
      file,
      workspaceId,
      folderId || undefined,
      clientIp
    );

    if (!result.success) {
      logger.error('Upload action failed', undefined, {
        userId,
        workspaceId,
        metadata: { error: result.error }
      });
      return NextResponse.json(
        createErrorResponse(result.error || 'Upload failed', result.code),
        { status: 400 }
      );
    }

    logger.info('File uploaded successfully', {
      userId,
      workspaceId,
      fileId: result.data?.id,
      metadata: { 
        fileName: file.name,
        fileSize: file.size 
      }
    });

    return NextResponse.json(
      createSuccessResponse(result.data, { storageInfo: result.storageInfo })
    );
  } catch (error) {
    logger.critical('Workspace upload API error', error, {
      action: 'workspace_upload'
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