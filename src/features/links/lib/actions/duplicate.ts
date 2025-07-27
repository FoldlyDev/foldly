'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { linksDbService } from '../db-service';
import { requireAuth, logAudit } from './shared';
import { type ActionResult, duplicateLinkActionSchema } from '../validations';
import type { LinkInsert, Link } from '@/lib/database/types/links';

/**
 * Duplicate a link
 */
export async function duplicateLinkAction(
  linkId: string
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate link ID
    const linkIdSchema = z.string().uuid('Invalid link ID');
    const validatedId = linkIdSchema.parse(linkId);

    // 3. Get original link
    const originalLink = await linksDbService.getById(validatedId);
    if (!originalLink.success || !originalLink.data) {
      return {
        success: false,
        error: 'Original link not found',
      };
    }

    if (originalLink.data.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only duplicate your own links',
      };
    }

    // 4. Prepare duplicate data
    const duplicateData: LinkInsert = {
      userId: originalLink.data.userId,
      workspaceId: originalLink.data.workspaceId,
      slug: originalLink.data.slug,
      topic: originalLink.data.topic ? `${originalLink.data.topic}-copy` : null,
      linkType: originalLink.data.linkType,
      title: `${originalLink.data.title} (Copy)`,
      description: originalLink.data.description,
      requireEmail: originalLink.data.requireEmail,
      requirePassword: originalLink.data.requirePassword,
      passwordHash: originalLink.data.passwordHash,
      isPublic: originalLink.data.isPublic,
      isActive: originalLink.data.isActive,
      maxFiles: originalLink.data.maxFiles,
      maxFileSize: originalLink.data.maxFileSize,
      allowedFileTypes: originalLink.data.allowedFileTypes,
      expiresAt: originalLink.data.expiresAt,
      brandEnabled: originalLink.data.brandEnabled,
      brandColor: originalLink.data.brandColor,
      // Initialize stats fields
      totalUploads: 0,
      totalFiles: 0,
      totalSize: 0,
      lastUploadAt: null,
    };

    // 5. Create duplicate link
    const result = await linksDbService.create(duplicateData);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to duplicate link',
      };
    }

    // 6. Audit log
    await logAudit({
      userId: user.id,
      action: 'duplicated',
      resource: 'link',
      resourceId: result.data!.id,
      timestamp: new Date(),
      details: { originalId: validatedId, title: duplicateData.title },
    });

    // 7. Revalidate relevant paths
    revalidatePath('/dashboard/links');
    revalidatePath(`/dashboard/links/${result.data!.id}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Duplicate link error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid link ID',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
