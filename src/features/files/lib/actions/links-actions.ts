'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { links } from '@/lib/database/schemas';
import { eq, and, desc } from 'drizzle-orm';
import type { FilesLinksData, LinkListItem } from '@/features/files/types/links';
import type { ActionResult } from '@/features/files/types/file-operations';

/**
 * Fetch all user links organized by type with file counts
 */
export async function fetchUserLinksAction(): Promise<ActionResult<FilesLinksData>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch all user links
    const userLinks = await db
      .select({
        id: links.id,
        slug: links.slug,
        topic: links.topic,
        linkType: links.linkType,
        title: links.title,
        description: links.description,
        totalFiles: links.totalFiles,
        totalSize: links.totalSize,
        lastUploadAt: links.lastUploadAt,
        unreadUploads: links.unreadUploads,
        isActive: links.isActive,
        createdAt: links.createdAt,
        sourceFolderId: links.sourceFolderId,
      })
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.createdAt));

    // Transform to LinkListItem format and organize by type
    const linkItems: LinkListItem[] = userLinks.map(link => ({
      id: link.id,
      slug: link.slug,
      topic: link.topic,
      linkType: link.linkType as 'base' | 'custom' | 'generated',
      title: link.title,
      description: link.description,
      isActive: link.isActive,
      totalFiles: link.totalFiles,
      totalSize: link.totalSize,
      lastUploadAt: link.lastUploadAt,
      createdAt: link.createdAt,
      fullUrl: `foldly.com/${link.slug}${link.topic ? `/${link.topic}` : ''}`,
      isExpired: false, // Calculate based on expiry date if needed
    }));

    // Organize links by type
    const baseLink = linkItems.find(link => link.linkType === 'base') || null;
    const topicLinks = linkItems.filter(link => link.linkType === 'custom');
    const generatedLinks = linkItems.filter(link => link.linkType === 'generated');

    // Calculate total stats including unread uploads
    const stats = {
      totalFiles: userLinks.reduce((sum, link) => sum + link.totalFiles, 0),
      totalSize: userLinks.reduce((sum, link) => sum + link.totalSize, 0),
      totalLinks: userLinks.length,
      unreadUploads: userLinks.reduce((sum, link) => sum + link.unreadUploads, 0),
    };

    return {
      success: true,
      data: {
        baseLink,
        topicLinks,
        generatedLinks,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching user links:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch links',
    };
  }
}

/**
 * Fetch files AND folders shared through a specific link
 * Uses centralized file system services like workspace does
 */
export async function fetchLinkContentAction(linkId: string): Promise<ActionResult<{ files: any[], folders: any[] }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify link ownership
    const link = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .limit(1);

    if (!link.length) {
      return { success: false, error: 'Link not found' };
    }

    // Use centralized services to get both files and folders
    const { FileService } = await import('@/lib/services/file-system/file-service');
    const { FolderService } = await import('@/lib/services/file-system/folder-service');
    
    const fileService = new FileService();
    const folderService = new FolderService();

    // Fetch both files and folders in parallel
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByLink(linkId),
      folderService.getFoldersByLink(linkId),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      return { 
        success: false, 
        error: 'Failed to fetch link content' 
      };
    }

    return {
      success: true,
      data: {
        files: filesResult.data || [],
        folders: foldersResult.data || [],
      },
    };
  } catch (error) {
    console.error('Error fetching link content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
  }
}

/**
 * Mark link uploads as read
 */
export async function markLinkUploadsAsReadAction(linkId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(links)
      .set({
        unreadUploads: 0,
        lastNotificationAt: new Date(),
      })
      .where(and(eq(links.id, linkId), eq(links.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error('Error marking uploads as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update link',
    };
  }
}