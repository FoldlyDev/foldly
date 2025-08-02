'use server';

import { auth } from '@clerk/nextjs/server';
import { linkFilesService } from '@/features/links/lib/services/link-files-service';
import type { LinkWithFileTree } from '@/features/files/types';

/**
 * Server action to fetch all links with their file trees for the current user
 */
export async function fetchLinksWithFilesAction(): Promise<{
  success: boolean;
  data?: LinkWithFileTree[];
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

    // Fetch links with files
    const linksWithFiles = await linkFilesService.getLinksWithFiles(userId);

    return {
      success: true,
      data: linksWithFiles,
    };
  } catch (error) {
    console.error('Error in fetchLinksWithFilesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch links with files',
    };
  }
}