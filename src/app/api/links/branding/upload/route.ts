import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linksDbService } from '@/features/links/lib/db-service';
import { BrandingStorageService } from '@/features/links/lib/services/branding-storage-service';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/lib/types/error-response';
import { logger } from '@/lib/services/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout for branding uploads

export async function POST(req: NextRequest) {
  try {
    logger.debug('Branding upload request received');
    
    const { userId } = await auth();
    
    if (!userId) {
      logger.warn('Branding upload attempt without authentication');
      return NextResponse.json(
        createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const linkId = formData.get('linkId') as string;
    const enabled = formData.get('enabled') === 'true';
    const color = formData.get('color') as string | null;
    
    logger.debug('Branding upload request data', {
      userId,
      metadata: {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        linkId,
        enabled,
        color
      }
    });

    if (!file || !linkId) {
      logger.warn('Branding upload validation failed: Missing required fields', {
        userId,
        metadata: {
          hasFile: !!file,
          hasLinkId: !!linkId
        }
      });
      return NextResponse.json(
        createErrorResponse(
          'Missing required fields',
          ERROR_CODES.INVALID_INPUT,
          {
            hasFile: !!file,
            hasLinkId: !!linkId
          }
        ),
        { status: 400 }
      );
    }

    // Verify link ownership
    const existingLink = await linksDbService.getById(linkId);
    if (!existingLink.success || !existingLink.data) {
      return NextResponse.json(
        createErrorResponse('Link not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }

    if (existingLink.data.userId !== userId) {
      return NextResponse.json(
        createErrorResponse('Unauthorized: You can only update your own links', ERROR_CODES.UNAUTHORIZED),
        { status: 403 }
      );
    }

    // Create authenticated Supabase client for this request
    const supabaseClient = await createServerSupabaseClient();
    const brandingStorageService = new BrandingStorageService(supabaseClient);
    
    // Upload the branding image with authenticated client
    const uploadResult = await brandingStorageService.uploadBrandingImage(
      file,
      userId,
      linkId
    );

    if (!uploadResult.success) {
      logger.error('Branding upload failed', undefined, {
        userId,
        linkId,
        metadata: { error: uploadResult.error }
      });
      return NextResponse.json(
        createErrorResponse(uploadResult.error || 'Upload failed', ERROR_CODES.UPLOAD_FAILED),
        { status: 400 }
      );
    }

    // Delete old image if exists
    if (existingLink.data.branding?.imagePath) {
      await brandingStorageService.deleteBrandingImage(
        existingLink.data.branding.imagePath
      );
    }

    // Update link with new branding
    const updateResult = await linksDbService.update(linkId, {
      branding: {
        enabled,
        color: color || existingLink.data.branding?.color,
        imagePath: uploadResult.data!.path,
        imageUrl: uploadResult.data!.publicUrl,
      },
    } as any);

    if (!updateResult.success) {
      logger.error('Failed to update link branding', undefined, {
        userId,
        linkId,
        metadata: { error: updateResult.error }
      });
      return NextResponse.json(
        createErrorResponse(updateResult.error || 'Failed to update branding', ERROR_CODES.DATABASE_ERROR),
        { status: 500 }
      );
    }

    logger.info('Branding uploaded successfully', {
      userId,
      linkId,
      metadata: {
        imagePath: uploadResult.data!.path,
        fileSize: file.size
      }
    });

    return NextResponse.json(
      createSuccessResponse({
        link: updateResult.data,
        imagePath: uploadResult.data!.path,
        imageUrl: uploadResult.data!.publicUrl,
      })
    );
  } catch (error) {
    logger.error('Branding upload error', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        createErrorResponse('Link ID is required', ERROR_CODES.INVALID_INPUT),
        { status: 400 }
      );
    }

    // Verify link ownership
    const existingLink = await linksDbService.getById(linkId);
    if (!existingLink.success || !existingLink.data) {
      return NextResponse.json(
        createErrorResponse('Link not found', ERROR_CODES.NOT_FOUND),
        { status: 404 }
      );
    }

    if (existingLink.data.userId !== userId) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED),
        { status: 403 }
      );
    }

    // Delete image if exists
    if (existingLink.data.branding?.imagePath) {
      // Create authenticated Supabase client for deletion
      const supabaseClient = await createServerSupabaseClient();
      const brandingStorageService = new BrandingStorageService(supabaseClient);
      
      await brandingStorageService.deleteBrandingImage(
        existingLink.data.branding.imagePath
      );
    }

    // Update link to remove image references
    const updateResult = await linksDbService.update(linkId, {
      branding: {
        ...existingLink.data.branding,
        imagePath: null,
        imageUrl: null,
      },
    } as any);

    if (!updateResult.success) {
      return NextResponse.json(
        createErrorResponse('Failed to update branding', ERROR_CODES.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        link: updateResult.data,
      })
    );
  } catch (error) {
    logger.error('Branding deletion error', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}