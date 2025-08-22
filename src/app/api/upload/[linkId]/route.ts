import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFileToLinkAction,
  validateLinkForUploadAction,
} from '@/features/link-upload/lib/actions/upload-to-link';
import { linkUploadValidationService } from '@/features/link-upload/lib/services/link-validation';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// UPLOAD API ENDPOINT - Public uploads to shared links
// =============================================================================

/**
 * POST /api/upload/[linkId] - Upload files to a specific link
 * Includes comprehensive real-time validation including expiration checking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    console.log(`🔄 API Upload request to link: ${linkId}`);

    // =============================================================================
    // 1. PARSE MULTIPART FORM DATA
    // =============================================================================

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploaderName = formData.get('uploaderName') as string;
    const uploaderEmail = formData.get('uploaderEmail') as string | null;
    const uploaderMessage = formData.get('uploaderMessage') as string | null;
    const folderId = formData.get('folderId') as string | null;
    const password = formData.get('password') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          code: 'MISSING_FILE',
        },
        { status: 400 }
      );
    }

    if (!uploaderName || uploaderName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Uploader name is required',
          code: 'MISSING_UPLOADER_NAME',
        },
        { status: 400 }
      );
    }

    console.log(
      `📁 File: ${file.name} (${Math.round(file.size / 1024)}KB) by ${uploaderName}`
    );

    // =============================================================================
    // 2. REAL-TIME LINK AND FILE VALIDATION
    // =============================================================================

    // Validate link and file before attempting upload
    const validation = await linkUploadValidationService.validateFileForUpload(
      file,
      linkId
    );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

    if (!validation.data.canUpload) {
      return NextResponse.json(
        {
          success: false,
          error: validation.data.errors[0] || 'Upload not allowed',
          errors: validation.data.errors,
          warnings: validation.data.warnings,
          code: 'UPLOAD_NOT_ALLOWED',
        },
        { status: 403 }
      );
    }

    // Log any warnings
    if (validation.data.warnings.length > 0) {
      console.log(`⚠️ Upload warnings:`, validation.data.warnings);
    }

    // =============================================================================
    // 3. PERFORM UPLOAD
    // =============================================================================

    const uploaderInfo = {
      name: uploaderName.trim(),
      ...(uploaderEmail?.trim() && { email: uploaderEmail.trim() }),
      ...(uploaderMessage?.trim() && { message: uploaderMessage.trim() }),
    };

    const uploadResult = await uploadFileToLinkAction(
      file,
      linkId,
      uploaderInfo,
      folderId || undefined,
      password || undefined
    );

    if (!uploadResult.success) {
      console.error(`❌ Upload failed: ${uploadResult.error}`);

      // Return appropriate HTTP status based on error type
      let statusCode = 500;
      let errorCode = 'UPLOAD_FAILED';

      if (uploadResult.error?.includes('expired')) {
        statusCode = 410; // Gone
        errorCode = 'LINK_EXPIRED';
      } else if (uploadResult.error?.includes('disabled')) {
        statusCode = 403; // Forbidden
        errorCode = 'LINK_DISABLED';
      } else if (uploadResult.error?.includes('limit')) {
        statusCode = 413; // Payload Too Large
        errorCode = 'LIMIT_EXCEEDED';
      } else if (uploadResult.error?.includes('not found')) {
        statusCode = 404; // Not Found
        errorCode = 'LINK_NOT_FOUND';
      } else if (uploadResult.error?.includes('password')) {
        statusCode = 401; // Unauthorized
        errorCode = 'PASSWORD_REQUIRED';
      }

      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error,
          code: errorCode,
        },
        { status: statusCode }
      );
    }

    console.log(`✅ Upload successful: ${uploadResult.data!.fileName}`);

    // =============================================================================
    // 4. RETURN SUCCESS RESPONSE
    // =============================================================================

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: uploadResult.data!.fileId,
        fileName: uploadResult.data!.fileName,
        fileSize: uploadResult.data!.fileSize,
        uploadedAt: uploadResult.data!.uploadedAt,
        uploaderName: uploaderInfo.name,
      },
      quotaInfo: uploadResult.quotaInfo,
      warnings: validation.data.warnings,
    });
  } catch (error) {
    console.error('❌ Upload API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during upload',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/[linkId] - Get upload link information and validation
 * Used by frontend to validate link before showing upload interface
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    console.log(`🔍 API Validation request for link: ${linkId}`);

    // =============================================================================
    // VALIDATE LINK FOR UPLOAD
    // =============================================================================

    const validation = await validateLinkForUploadAction(
      linkId,
      password || undefined
    );

    if (!validation.success) {
      if (validation.error?.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error,
            code: 'LINK_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

    const linkInfo = validation.data;

    // =============================================================================
    // RETURN LINK INFORMATION
    // =============================================================================

    return NextResponse.json({
      success: true,
      data: {
        linkId,
        linkTitle: linkInfo.linkTitle,
        linkType: linkInfo.linkType,
        canUpload: linkInfo.canUpload,
        requiresPassword: linkInfo.requiresPassword,
        requiresEmail: linkInfo.requiresEmail,
        constraints: {
          maxFiles: linkInfo.maxFiles,
          maxFileSize: linkInfo.maxFileSize,
          allowedFileTypes: linkInfo.allowedFileTypes,
          remainingUploads: linkInfo.remainingUploads,
        },
        // Don't expose sensitive information
      },
    });
  } catch (error) {
    console.error('❌ Link validation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during validation',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/upload/[linkId] - CORS preflight for browser uploads
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
