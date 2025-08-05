'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { linksDbService } from '../db-service';
import { requireAuth, logAudit } from './shared';
import {
  handleFieldErrors,
  type ActionResult,
  createLinkActionSchema,
} from '../validations';
import type { LinkInsert, Link } from '@/lib/database/types/links';
import { getWorkspaceByUserId } from '@/features/workspace/lib/actions/workspace-actions';
import { getSupabaseClient } from '@/lib/config/supabase-client';

/**
 * Create a new link
 */
export async function createLinkAction(
  input: z.infer<typeof createLinkActionSchema>
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const validatedData = createLinkActionSchema.parse(input);

    // 3. Get user's existing workspace
    const workspaceResult = await getWorkspaceByUserId();
    if (!workspaceResult.success || !workspaceResult.data) {
      return {
        success: false,
        error:
          workspaceResult.error ||
          'No workspace found for user. Please contact support.',
      };
    }

    // 4. Determine link type and get base link slug for topic links
    const linkType = validatedData.topic ? 'custom' : 'base';

    // Get user's existing links to find base link slug
    const existingLinksResult = await linksDbService.getByUserId(user.id);
    let baseSlug = validatedData.slug || user.username || user.id;

    if (linkType === 'base') {
      // Check if user already has a base link (only one allowed per user)
      if (existingLinksResult.success && existingLinksResult.data) {
        const hasBaseLink = existingLinksResult.data.some(
          (link: Link) => link.linkType === 'base'
        );

        if (hasBaseLink) {
          return {
            success: false,
            error:
              'You already have a base link. Only one base link is allowed per user.',
          };
        }
      }
    } else {
      // For topic/custom links, use the existing base link's slug
      if (existingLinksResult.success && existingLinksResult.data) {
        const userBaseLink = existingLinksResult.data.find(
          (link: Link) => link.linkType === 'base' && !link.topic
        );

        if (userBaseLink) {
          baseSlug = userBaseLink.slug;
        } else {
          return {
            success: false,
            error: 'You must create a base link before creating topic links.',
          };
        }
      } else {
        return {
          success: false,
          error: 'You must create a base link before creating topic links.',
        };
      }
    }

    // 5. Prepare link data for database
    const linkData: LinkInsert = {
      userId: user.id,
      workspaceId: workspaceResult.data.id,
      slug: baseSlug, // Use base link slug for all links
      topic: validatedData.topic || null,
      linkType,
      title: validatedData.title,
      description: validatedData.description || null,
      requireEmail: validatedData.requireEmail,
      requirePassword: validatedData.requirePassword,
      passwordHash: validatedData.password
        ? // In production, use proper password hashing
          Buffer.from(validatedData.password).toString('base64')
        : null,
      isActive: validatedData.isActive ?? true, // Default to true if not provided
      maxFiles: validatedData.maxFiles,
      maxFileSize: validatedData.maxFileSize * 1024 * 1024, // Convert MB to bytes
      allowedFileTypes:
        validatedData.allowedFileTypes &&
        validatedData.allowedFileTypes.length > 0
          ? validatedData.allowedFileTypes
          : null,
      expiresAt: validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : null,
      brandEnabled: validatedData.brandEnabled,
      brandColor: validatedData.brandColor || null,
      // Initialize stats fields
      totalUploads: 0,
      totalFiles: 0,
      totalSize: 0,
      lastUploadAt: null,
      // Initialize storage quota fields
      storageUsed: 0,
      storageLimit: 524288000, // 500MB default per link
    };

    // 6. Create link in database
    const result = await linksDbService.create(linkData);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create link',
      };
    }

    // 5. Audit log
    await logAudit({
      userId: user.id,
      action: 'created',
      resource: 'link',
      resourceId: result.data!.id,
      timestamp: new Date(),
      details: { title: linkData.title, linkType: linkData.linkType },
    });

    // 6. Broadcast real-time update for new link creation
    try {
      const supabase = getSupabaseClient();
      const userChannel = supabase.channel(`files:user:${user.id}`);
      await userChannel.send({
        type: 'broadcast',
        event: 'file_update',
        payload: {
          type: 'file_added', // Using file_added to trigger files list refresh
          linkId: result.data!.id,
          userId: user.id,
        },
      });
      console.log('Broadcasted new link creation to files channel');
    } catch (error) {
      console.error('Failed to broadcast link creation:', error);
      // Don't fail the operation if broadcast fails
    }

    // 7. DISABLED: No revalidatePath to prevent page refresh
    // We handle UI updates manually via React state in LinksContainer
    // revalidatePath('/dashboard/links');
    // revalidatePath(`/dashboard/links/${result.data!.id}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Create link error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        fieldErrors: handleFieldErrors(error),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
