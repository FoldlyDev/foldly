'use server';

import { db } from '@/lib/database/connection';
import { batches, links, folders } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/services/logging/logger';
import type { ActionResult } from './link-data-actions';
import bcrypt from 'bcryptjs';

/**
 * Create a batch record for link uploads
 */
export async function createUploadBatchAction(params: {
  linkId: string;
  uploaderName: string;
  uploaderEmail?: string;
  totalFiles: number;
  totalSize: number;
  targetFolderId?: string | null;
}): Promise<ActionResult<{ batchId: string }>> {
  try {
    const {
      linkId,
      uploaderName,
      uploaderEmail,
      totalFiles,
      totalSize,
      targetFolderId,
    } = params;

    // Create batch record
    const [batch] = await db
      .insert(batches)
      .values({
        linkId,
        uploaderName,
        uploaderEmail: uploaderEmail || null,
        targetFolderId: targetFolderId || null,
        totalFiles,
        totalSize,
        processedFiles: 0,
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      data: { batchId: batch?.id || '' },
    };
  } catch (error) {
    logger.error('Failed to create batch', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create batch',
    };
  }
}

/**
 * Create a folder for link uploads
 */
export async function createLinkFolderAction(params: {
  linkId: string;
  name: string;
  parentId?: string | null;
}): Promise<ActionResult<{ folderId: string }>> {
  try {
    const { linkId, name, parentId } = params;

    // Create folder with linkId (not workspaceId)
    const [folder] = await db
      .insert(folders)
      .values({
        name,
        linkId,
        workspaceId: null,
        parentFolderId: parentId || null,
        path: '/', // Will be calculated by the system
        depth: 0, // Will be calculated based on parent
        sortOrder: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      data: { folderId: folder?.id || '' },
    };
  } catch (error) {
    logger.error('Failed to create folder', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder',
    };
  }
}

/**
 * Validate password for a link before allowing upload
 */
export async function validatePasswordAction(
  linkId: string,
  password: string
): Promise<ActionResult<boolean>> {
  try {
    const [link] = await db
      .select({ password: links.passwordHash })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (!link || !link.password) {
      return {
        success: false,
        error: 'Link not found or no password set',
      };
    }

    const isValid = await bcrypt.compare(password, link.password);

    return {
      success: true,
      data: isValid,
    };
  } catch (error) {
    logger.error('Failed to validate password', error);
    return {
      success: false,
      error: 'Failed to validate password',
    };
  }
}

/**
 * Update batch progress
 */
export async function updateBatchProgressAction(params: {
  batchId: string;
  processedFiles: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}): Promise<ActionResult<void>> {
  try {
    const { batchId, processedFiles, status } = params;

    await db
      .update(batches)
      .set({
        processedFiles,
        status,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId));

    return { success: true };
  } catch (error) {
    logger.error('Failed to update batch progress', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update batch',
    };
  }
}
