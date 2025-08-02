'use server';

import { linkUploadService } from '../services/link-upload-service';

/**
 * Fetch link tree data for the tree component
 * This fetches actual folders and files from the database
 */
export async function fetchLinkTreeAction(linkId: string) {
  try {
    console.log('🔍 fetchLinkTreeAction: Starting for linkId:', linkId);

    // Use service to fetch link tree data
    const result = await linkUploadService.fetchLinkTree(linkId);

    if (!result.success) {
      console.error('❌ fetchLinkTreeAction: Service error:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log('✅ fetchLinkTreeAction: Successfully fetched tree data:', {
      linkId,
      foldersCount: result.data.folders.length,
      filesCount: result.data.files.length,
    });

    // For public link upload feature, always return empty arrays
    // This ensures uploaders always see a clean, empty tree
    // Only link owners in their dashboard can see all files (separate feature)
    return {
      success: true,
      data: {
        link: result.data.link,
        folders: [], // Always empty for public upload links
        files: [],   // Always empty for public upload links
        stats: {
          totalFiles: 0,
          totalFolders: 0,
        },
      },
    };
  } catch (error) {
    console.error('❌ fetchLinkTreeAction: Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch link tree data',
    };
  }
}