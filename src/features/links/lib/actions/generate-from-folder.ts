'use server';

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';

import { db } from '@/lib/database/connection';
import { links, folders, workspaces } from '@/lib/database/schemas';
import { requireAuth, logAudit } from './shared';
import { type ActionResult } from '../validations';
import type { Link } from '@/lib/database/types/links';
import { getSupabaseClient } from '@/lib/config/supabase-client';
import { linkFolderService } from '../services/link-folder-service';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';

/**
 * Schema for generating a link from a folder
 */
const generateLinkFromFolderSchema = z.object({
  folderId: z.string().uuid('Invalid folder ID'),
});

/**
 * Server action to check if a folder already has a generated link
 */
export async function checkFolderHasGeneratedLinkAction(
  folderId: string
): Promise<{ hasLink: boolean }> {
  try {
    const hasLink = await linkFolderService.checkFolderHasGeneratedLink(folderId);
    return { hasLink };
  } catch (error) {
    console.error('Error checking folder generated link:', error);
    return { hasLink: false };
  }
}

/**
 * Generate a link from a workspace folder
 * This creates a generated link type where uploads go directly to the source folder
 */
export async function generateLinkFromFolderAction(
  input: z.infer<typeof generateLinkFromFolderSchema>
): Promise<ActionResult<Link>> {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate input
    const { folderId } = generateLinkFromFolderSchema.parse(input);

    // 3. Get the folder details and verify ownership
    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });

    if (!folder) {
      return {
        success: false,
        error: 'Folder not found',
      };
    }

    // Verify user owns the workspace that contains this folder
    if (!folder.workspaceId) {
      return {
        success: false,
        error: 'Folder does not belong to a workspace',
      };
    }

    // Get user's workspace to verify ownership
    const workspace = await db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.id, folder.workspaceId),
        eq(workspaces.userId, user.id)
      ),
    });

    if (!workspace) {
      return {
        success: false,
        error: 'You do not have permission to generate a link for this folder',
      };
    }

    // 4. Check if folder already has a generated link
    const hasExistingLink = await linkFolderService.checkFolderHasGeneratedLink(folderId);

    if (hasExistingLink) {
      return {
        success: false,
        error: 'This folder already has a generated link',
      };
    }

    // 5. Get user's base link to use the same slug
    const baseLink = await db.query.links.findFirst({
      where: and(
        eq(links.userId, user.id),
        eq(links.linkType, 'base')
      ),
    });

    if (!baseLink) {
      return {
        success: false,
        error: 'You must create a base link before generating folder links',
      };
    }

    // 6. Get current user storage info for plan-based limits
    const storageInfo = await storageQuotaService.getUserStorageInfo(user.id);
    if (!storageInfo.success || !storageInfo.data) {
      return {
        success: false,
        error: 'Failed to get storage information for link generation',
      };
    }

    // 7. Use folder name as the suffix for the generated link
    // Clean the folder name to make it URL-safe
    const generatedSuffix = folder.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
    
    // If the cleaned name is empty, fall back to a random ID
    const finalSuffix = generatedSuffix || nanoid(8).toLowerCase();

    // 7. Create the generated link
    const [newLink] = await db
      .insert(links)
      .values({
        userId: user.id,
        workspaceId: folder.workspaceId,
        slug: baseLink.slug,
        topic: finalSuffix,
        linkType: 'generated',
        title: `Link for ${folder.name}`,
        description: `Uploads to this link go directly to the "${folder.name}" folder`,
        sourceFolderId: folderId,
        // Copy settings from base link as defaults
        requireEmail: baseLink.requireEmail,
        requirePassword: baseLink.requirePassword,
        passwordHash: baseLink.passwordHash,
        isActive: true,
        maxFiles: baseLink.maxFiles,
        maxFileSize: baseLink.maxFileSize,
        allowedFileTypes: baseLink.allowedFileTypes,
        expiresAt: null,
        brandEnabled: baseLink.brandEnabled,
        brandColor: baseLink.brandColor,
        // Initialize stats
        totalUploads: 0,
        totalFiles: 0,
        totalSize: 0,
        lastUploadAt: null,
        unreadUploads: 0,
        lastNotificationAt: null,
      })
      .returning();

    if (!newLink) {
      return {
        success: false,
        error: 'Failed to create generated link',
      };
    }

    // 8. Audit log
    await logAudit({
      userId: user.id,
      action: 'created',
      resource: 'generated_link',
      resourceId: newLink.id,
      timestamp: new Date(),
      details: { 
        folderId,
        folderName: folder.name,
        linkType: 'generated',
        generatedSuffix: finalSuffix,
      },
    });

    // 9. Broadcast real-time update
    try {
      const supabase = getSupabaseClient();
      const userChannel = supabase.channel(`links:user:${user.id}`);
      await userChannel.send({
        type: 'broadcast',
        event: 'link_created',
        payload: {
          type: 'link_created',
          linkId: newLink.id,
          userId: user.id,
          folderId,
          linkType: 'generated',
        },
      });
    } catch (error) {
      console.error('Failed to broadcast link creation:', error);
    }

    return {
      success: true,
      data: newLink,
    };
  } catch (error) {
    console.error('Generate link from folder error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}