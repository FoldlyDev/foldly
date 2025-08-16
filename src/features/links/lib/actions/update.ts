'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { linksDbService } from '../db-service';
import { requireAuth, logAudit } from './shared';
import {
  handleFieldErrors,
  type ActionResult,
  type FlexibleLinkUpdate,
  updateLinkActionSchema,
  updateSettingsActionSchema,
} from '../validations';
import type { Link } from '@/lib/database/types/links';
import { brandingStorageService } from '../services/branding-storage-service';

/**
 * Update an existing link
 */
export async function updateLinkAction(
  input: z.infer<typeof updateLinkActionSchema>
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const validatedData = updateLinkActionSchema.parse(input);
    const { id, ...updateData } = validatedData;

    // 3. Verify link ownership
    const existingLink = await linksDbService.getById(id);
    if (!existingLink.success || !existingLink.data) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    if (existingLink.data.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only update your own links',
      };
    }

    // 4. Allow title updates for all link types (including base links)

    // 5. Handle cascade updates for base link slug changes
    if (
      updateData.slug !== undefined &&
      existingLink.data.linkType === 'base'
    ) {
      const oldSlug = existingLink.data.slug;
      const newSlug = updateData.slug;

      if (oldSlug !== newSlug) {
        // Cascade update all user's links to use the new base slug
        const cascadeResult = await linksDbService.cascadeUpdateBaseSlug(
          user.id,
          oldSlug,
          newSlug
        );

        if (!cascadeResult.success) {
          return {
            success: false,
            error:
              cascadeResult.error ||
              'Failed to update base link and related links',
          };
        }

        // Get the updated base link from cascade operation
        let updatedBaseLink = cascadeResult.data.updatedLinks.find(
          link => link.id === id && link.linkType === 'base'
        );

        if (!updatedBaseLink) {
          return {
            success: false,
            error: 'Failed to find updated base link',
          };
        }

        // Apply other non-slug updates to the base link if present
        const otherUpdates: FlexibleLinkUpdate = {};
        if (updateData.title !== undefined)
          otherUpdates.title = updateData.title;
        if (updateData.description !== undefined)
          otherUpdates.description = updateData.description || null;
        if (updateData.requireEmail !== undefined)
          otherUpdates.requireEmail = updateData.requireEmail;
        if (updateData.requirePassword !== undefined)
          otherUpdates.requirePassword = updateData.requirePassword;
        if (updateData.password !== undefined) {
          (otherUpdates as any).passwordHash = updateData.password
            ? Buffer.from(updateData.password).toString('base64')
            : null;
        }
        if (updateData.isActive !== undefined)
          otherUpdates.isActive = updateData.isActive;
        if (updateData.maxFiles !== undefined)
          otherUpdates.maxFiles = updateData.maxFiles;
        if (updateData.maxFileSize !== undefined)
          otherUpdates.maxFileSize = updateData.maxFileSize * 1024 * 1024;
        if (updateData.allowedFileTypes !== undefined)
          otherUpdates.allowedFileTypes = updateData.allowedFileTypes || null;
        if (updateData.expiresAt !== undefined) {
          (otherUpdates as any).expiresAt = updateData.expiresAt;
        }
        if (updateData.branding !== undefined)
          otherUpdates.branding = updateData.branding;

        // If there are other updates, apply them to the base link
        if (Object.keys(otherUpdates).length > 0) {
          const additionalUpdateResult = await linksDbService.update(
            id,
            otherUpdates as any
          );
          if (additionalUpdateResult.success && additionalUpdateResult.data) {
            updatedBaseLink = additionalUpdateResult.data;
          }
        }

        // Audit log for cascade update
        await logAudit({
          userId: user.id,
          action: 'cascade_updated',
          resource: 'link',
          resourceId: id,
          timestamp: new Date(),
          details: {
            oldSlug,
            newSlug,
            updatedLinksCount: cascadeResult.data.updatedCount,
            additionalUpdates: Object.keys(otherUpdates),
          },
        });

        return {
          success: true,
          data: updatedBaseLink,
          meta: {
            isCascadeUpdate: true,
            affectedLinksCount: cascadeResult.data.updatedCount,
            affectedLinkIds: cascadeResult.data.updatedLinks.map(l => l.id),
          },
        };
      }
    }

    // 6. Prepare update data for non-cascade updates
    const linkUpdate: Record<string, any> = {};

    if (updateData.slug !== undefined) linkUpdate.slug = updateData.slug;
    if (updateData.topic !== undefined) {
      linkUpdate.topic = updateData.topic || null;
      // For custom/topic links, sync title with topic
      if (existingLink.data.linkType === 'custom' && updateData.topic) {
        linkUpdate.title = updateData.topic;
      }
    }
    if (updateData.title !== undefined) linkUpdate.title = updateData.title;
    if (updateData.description !== undefined)
      linkUpdate.description = updateData.description || null;
    if (updateData.requireEmail !== undefined)
      linkUpdate.requireEmail = updateData.requireEmail;
    if (updateData.requirePassword !== undefined)
      linkUpdate.requirePassword = updateData.requirePassword;
    if (updateData.password !== undefined)
      linkUpdate.passwordHash = updateData.password
        ? Buffer.from(updateData.password).toString('base64')
        : null;
    if (updateData.isActive !== undefined)
      linkUpdate.isActive = updateData.isActive;
    if (updateData.maxFiles !== undefined)
      linkUpdate.maxFiles = updateData.maxFiles;
    if (updateData.maxFileSize !== undefined)
      linkUpdate.maxFileSize = updateData.maxFileSize * 1024 * 1024;
    if (updateData.allowedFileTypes !== undefined)
      linkUpdate.allowedFileTypes = updateData.allowedFileTypes || null;
    if (updateData.expiresAt !== undefined)
      linkUpdate.expiresAt = updateData.expiresAt
        ? new Date(updateData.expiresAt)
        : null;
    if (updateData.branding !== undefined)
      linkUpdate.branding = updateData.branding;

    // 7. Update link in database
    const result = await linksDbService.update(id, linkUpdate as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update link',
      };
    }

    // 8. Audit log
    await logAudit({
      userId: user.id,
      action: 'updated',
      resource: 'link',
      resourceId: id,
      timestamp: new Date(),
      details: { changes: Object.keys(updateData) },
    });

    // 7. DISABLED: No revalidatePath to prevent page refresh
    // We handle UI updates manually via React state in LinksContainer
    // revalidatePath('/dashboard/links');
    // revalidatePath(`/dashboard/links/${id}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Update link error:', error);

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
 * Update link settings (branding, security, etc.)
 */
export async function updateLinkSettingsAction(
  input: z.infer<typeof updateSettingsActionSchema>
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const validatedData = updateSettingsActionSchema.parse(input);
    const { id, ...settings } = validatedData;

    // 3. Verify link ownership
    const existingLink = await linksDbService.getById(id);
    if (!existingLink.success || !existingLink.data) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    if (existingLink.data.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only update your own links',
      };
    }

    // 4. Prepare settings update
    const linkUpdate = {
      requireEmail: settings.requireEmail,
      requirePassword: settings.requirePassword,
      passwordHash: settings.password
        ? Buffer.from(settings.password).toString('base64')
        : null,
      expiresAt: settings.expiresAt ? new Date(settings.expiresAt) : null,
      maxFiles: settings.maxFiles,
      maxFileSize: settings.maxFileSize
        ? settings.maxFileSize * 1024 * 1024
        : undefined,
      allowedFileTypes: settings.allowedFileTypes || null,
      branding: settings.branding,
    };

    // 5. Update link in database
    const result = await linksDbService.update(id, linkUpdate as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update link settings',
      };
    }

    // 6. Audit log
    await logAudit({
      userId: user.id,
      action: 'updated_settings',
      resource: 'link',
      resourceId: id,
      timestamp: new Date(),
      details: { settingsChanged: Object.keys(settings) },
    });

    // 7. DISABLED: No revalidatePath to prevent page refresh
    // We handle UI updates manually via React state in LinksContainer
    // revalidatePath('/dashboard/links');
    // revalidatePath(`/dashboard/links/${id}`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Update link settings error:', error);

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
 * Update link branding with image upload
 * Handles file upload to Supabase Storage without affecting user quota
 */
export async function updateLinkBrandingAction(
  linkId: string,
  branding: {
    enabled: boolean;
    color?: string;
    imageFile?: File;
    removeImage?: boolean;
  }
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Verify link ownership
    const existingLink = await linksDbService.getById(linkId);
    if (!existingLink.success || !existingLink.data) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    if (existingLink.data.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only update your own links',
      };
    }

    // 3. Prepare branding update
    interface BrandingUpdate {
      enabled: boolean;
      color?: string;
      imagePath?: string | null;
      imageUrl?: string | null;
    }
    
    let brandingUpdate: BrandingUpdate = {
      enabled: branding.enabled,
      color: branding.color,
    };

    // 4. Handle image operations
    if (branding.imageFile) {
      // Upload new image
      const uploadResult = await brandingStorageService.uploadBrandingImage(
        branding.imageFile,
        user.id,
        linkId
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload branding image',
        };
      }

      // Delete old image if exists
      if (existingLink.data.branding?.imagePath) {
        await brandingStorageService.deleteBrandingImage(
          existingLink.data.branding.imagePath
        );
      }

      brandingUpdate.imagePath = uploadResult.data!.path;
      brandingUpdate.imageUrl = uploadResult.data!.publicUrl;
    } else if (branding.removeImage && existingLink.data.branding?.imagePath) {
      // Remove existing image
      await brandingStorageService.deleteBrandingImage(
        existingLink.data.branding.imagePath
      );
      brandingUpdate.imagePath = null;
      brandingUpdate.imageUrl = null;
    } else if (existingLink.data.branding?.imagePath) {
      // Keep existing image paths
      brandingUpdate.imagePath = existingLink.data.branding.imagePath;
      brandingUpdate.imageUrl = existingLink.data.branding.imageUrl;
    }

    // 5. Update link in database
    const result = await linksDbService.update(linkId, {
      branding: brandingUpdate,
    } as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update link branding',
      };
    }

    // 6. Audit log
    await logAudit({
      userId: user.id,
      action: 'updated_branding',
      resource: 'link',
      resourceId: linkId,
      timestamp: new Date(),
      details: { 
        brandingEnabled: branding.enabled,
        imageUploaded: !!branding.imageFile,
        imageRemoved: !!branding.removeImage,
      },
    });

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Update link branding error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
