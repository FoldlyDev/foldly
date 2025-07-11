'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { linksDbService } from '../db-service';
import { requireAuth, logAudit } from './shared';
import {
  handleFieldErrors,
  type ActionResult,
  deleteLinkActionSchema,
  bulkDeleteActionSchema,
} from '../validations';

/**
 * Delete a link
 */
export async function deleteLinkAction(
  linkId: string
): Promise<ActionResult<void>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate link ID
    const linkIdSchema = z.string().uuid('Invalid link ID');
    const validatedId = linkIdSchema.parse(linkId);

    // 3. Verify link ownership
    const existingLink = await linksDbService.getById(validatedId);
    if (!existingLink.success || !existingLink.data) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    if (existingLink.data.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only delete your own links',
      };
    }

    // 4. Delete link from database (using soft delete)
    const result = await linksDbService.softDelete(validatedId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete link',
      };
    }

    // 5. Audit log
    await logAudit({
      userId: user.id,
      action: 'deleted',
      resource: 'link',
      resourceId: validatedId,
      timestamp: new Date(),
      details: { title: existingLink.data.title },
    });

    // 6. Revalidate relevant paths
    revalidatePath('/dashboard/links');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete link error:', error);

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

/**
 * Bulk delete links
 */
export async function bulkDeleteLinksAction(
  linkIds: string[]
): Promise<ActionResult<void>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const linkIdsSchema = z.array(z.string().uuid('Invalid link ID'));
    const validatedIds = linkIdsSchema.parse(linkIds);

    if (validatedIds.length === 0) {
      return {
        success: false,
        error: 'No links specified for deletion',
      };
    }

    // 3. Verify ownership of all links
    const ownershipResults = await Promise.all(
      validatedIds.map(id => linksDbService.getById(id))
    );

    const unauthorizedLinks = ownershipResults.filter(result => {
      return !result.success || !result.data || result.data.userId !== user.id;
    });

    if (unauthorizedLinks.length > 0) {
      return {
        success: false,
        error: 'Unauthorized: You can only delete your own links',
      };
    }

    // 4. Delete all links
    const deletionResults = await Promise.all(
      validatedIds.map(id => linksDbService.softDelete(id))
    );

    const failedDeletions = deletionResults.filter(result => !result.success);

    if (failedDeletions.length > 0) {
      return {
        success: false,
        error: `Failed to delete ${failedDeletions.length} links`,
      };
    }

    // 5. Audit log
    await logAudit({
      userId: user.id,
      action: 'bulk_deleted',
      resource: 'links',
      resourceId: validatedIds.join(','),
      timestamp: new Date(),
      details: { count: validatedIds.length },
    });

    // 6. Revalidate relevant paths
    revalidatePath('/dashboard/links');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Bulk delete links error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid link IDs',
        fieldErrors: handleFieldErrors(error),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
