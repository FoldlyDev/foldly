'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { linksDbService } from '../db-service';
import { requireAuth, logAudit } from './shared';
import { type ActionResult, toggleLinkActionSchema } from '../validations';
import type { Link } from '@/lib/supabase/types/links';

/**
 * Toggle link active status
 */
export async function toggleLinkActiveAction(
  linkId: string
): Promise<ActionResult<Link>> {
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
        error: 'Unauthorized: You can only modify your own links',
      };
    }

    // 4. Toggle active status
    const newActiveStatus = !existingLink.data.isActive;
    const result = await linksDbService.update(validatedId, {
      isActive: newActiveStatus,
    } as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to toggle link status',
      };
    }

    // 5. Audit log
    await logAudit({
      userId: user.id,
      action: newActiveStatus ? 'activated' : 'deactivated',
      resource: 'link',
      resourceId: validatedId,
      timestamp: new Date(),
      details: { title: existingLink.data.title },
    });

    // 6. Revalidate relevant paths
    revalidatePath('/dashboard/links');
    revalidatePath(`/dashboard/links/${validatedId}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Toggle link active error:', error);

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
