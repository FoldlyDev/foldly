'use server';

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
import { brandingStorageService } from '../services/branding-storage-service';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';
import { validateSlugLength } from '../utils/slug-normalization';
import { hasFeature } from '@/features/billing/lib/services/clerk-billing-integration';

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

    // 4. Get user storage info for plan-based limits
    const storageInfo = await storageQuotaService.getUserStorageInfo(user.id);
    if (!storageInfo.success || !storageInfo.data) {
      return {
        success: false,
        error: 'Failed to get storage information for link creation',
      };
    }

    // 5. Determine link type and get base link slug for topic links
    const linkType = validatedData.topic ? 'custom' : 'base';

    // Get user's existing links to find base link slug
    const existingLinksResult = await linksDbService.getByUserId(user.id);
    let baseSlug = validatedData.slug || user.username || user.id;

    // 5a. Check plan-based slug length restriction for base links
    if (linkType === 'base') {
      const hasPremiumShortLinks = await hasFeature('premium_short_links');
      console.log('🔍 Create Link Validation:', {
        baseSlug,
        slugLength: baseSlug.length,
        hasPremiumShortLinks,
        linkType
      });

      const lengthValidation = validateSlugLength(baseSlug, hasPremiumShortLinks);
      console.log('🔍 Length Validation Result:', lengthValidation);

      if (!lengthValidation.isValid) {
        return {
          success: false,
          error: lengthValidation.error!,
        };
      }
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
      branding: validatedData.branding ? {
        enabled: validatedData.branding.enabled,
        ...(validatedData.branding.color && { color: validatedData.branding.color }),
        ...(validatedData.branding.imagePath && { imagePath: validatedData.branding.imagePath }),
        ...(validatedData.branding.imageUrl && { imageUrl: validatedData.branding.imageUrl }),
      } : { enabled: false },
      // Initialize stats fields
      totalUploads: 0,
      totalFiles: 0,
      totalSize: 0,
      lastUploadAt: null,
      unreadUploads: 0,
      lastNotificationAt: null,
      sourceFolderId: null
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

/**
 * Create a new link with branding image
 * This action handles both link creation and image upload in sequence
 */
export async function createLinkWithBrandingAction(
  input: z.infer<typeof createLinkActionSchema> & { brandingImageFile?: File }
): Promise<ActionResult<Link>> {
  try {
    // 1. Extract the image file from input
    const { brandingImageFile, ...linkData } = input;
    
    // 2. Create the link first
    const createResult = await createLinkAction(linkData);
    
    if (!createResult.success || !createResult.data) {
      return createResult;
    }
    
    // 3. If there's a branding image, upload it
    if (brandingImageFile && linkData.branding?.enabled) {
      const user = await requireAuth();
      
      try {
        const uploadResult = await brandingStorageService.uploadBrandingImage(
          brandingImageFile,
          user.id,
          createResult.data.id
        );
        
        if (uploadResult.success) {
          // Update the link with the image paths
          const updatedBranding = {
            ...createResult.data.branding,
            imagePath: uploadResult.data!.path,
            imageUrl: uploadResult.data!.publicUrl,
          };
          
          // Update the link in the database
          const updateResult = await linksDbService.update(createResult.data.id, {
            branding: updatedBranding,
          } as any);
          
          if (updateResult.success) {
            return {
              success: true,
              data: updateResult.data,
            };
          }
        }
      } catch (error) {
        console.error('Failed to upload branding image during creation:', error);
        // Don't fail the entire operation if image upload fails
        // The link is already created successfully
      }
    }
    
    // Return the created link (with or without image)
    return createResult;
  } catch (error) {
    console.error('Create link with branding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
