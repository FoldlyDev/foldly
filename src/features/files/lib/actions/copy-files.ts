'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { users, workspaces } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { linkFilesService } from '@/lib/services/links/link-files-service';
import type { CopyResult, CopyOptions } from '@/features/files/types';

/**
 * Server action to copy files from a link to the user's workspace
 */
export async function copyFilesToWorkspaceAction(
  fileIds: string[],
  targetFolderId: string | null,
  options?: Partial<CopyOptions>
): Promise<{
  success: boolean;
  data?: CopyResult;
  error?: string;
}> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get user's workspace
    const userWorkspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .execute();

    if (!userWorkspace || userWorkspace.length === 0) {
      return {
        success: false,
        error: 'Workspace not found',
      };
    }

    const workspaceId = userWorkspace[0].id;

    // Check storage quota
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!user || user.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const currentUser = user[0];
    const storageLimit = currentUser.storageLimit;
    const storageUsed = currentUser.storageUsed;

    // Get total size of files to copy
    const { totalSize } = await linkFilesService.getFilesTotalSize(fileIds);

    if (storageUsed + totalSize > storageLimit) {
      return {
        success: false,
        error: `Insufficient storage space. You need ${formatBytes(totalSize)} but only have ${formatBytes(storageLimit - storageUsed)} available.`,
      };
    }

    // Copy files
    const result = await linkFilesService.copyFilesToWorkspace(
      fileIds,
      targetFolderId,
      userId,
      workspaceId
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error in copyFilesToWorkspaceAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy files',
    };
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}