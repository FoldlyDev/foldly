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
import type { Link } from '@/lib/supabase/types/links';

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

    // 4. Prepare update data - filter out undefined values
    const linkUpdate: Record<string, any> = {};

    if (updateData.name !== undefined) linkUpdate.title = updateData.name;
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
    if (updateData.isPublic !== undefined)
      linkUpdate.isPublic = updateData.isPublic;
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

    // 5. Update link in database
    const result = await linksDbService.update(id, linkUpdate as any);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update link',
      };
    }

    // 6. Audit log
    await logAudit({
      userId: user.id,
      action: 'updated',
      resource: 'link',
      resourceId: id,
      timestamp: new Date(),
      details: { changes: Object.keys(updateData) },
    });

    // 7. Revalidate relevant paths
    revalidatePath('/dashboard/links');
    revalidatePath(`/dashboard/links/${id}`);

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
  input: z.infer<typeof updateLinkSettingsSchema>
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const validatedData = updateLinkSettingsSchema.parse(input);
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
      isPublic: settings.isPublic,
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
      brandEnabled: settings.brandingEnabled,
      brandColor: settings.brandColor || null,
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

    // 7. Revalidate relevant paths
    revalidatePath('/dashboard/links');
    revalidatePath(`/dashboard/links/${id}`);

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
