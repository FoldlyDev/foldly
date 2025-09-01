'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { links, files, batches } from '@/lib/database/schemas';
import { eq, and, desc } from 'drizzle-orm';
import type { FilesLinksData, LinkListItem } from '@/features/files/types/links';
import type { FileListItem } from '@/features/files/types/file-operations';
import type { ActionResult } from '@/features/files/types/file-operations';

// Helper functions for file formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('application/pdf')) return 'PDF';
  if (mimeType.startsWith('text/')) return 'Text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
  return 'Other';
}

function canGeneratePreview(mimeType: string): boolean {
  const previewableTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript',
    'application/json', 'application/xml'
  ];
  return previewableTypes.includes(mimeType) || mimeType.startsWith('image/');
}

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
 * Fetch files shared through a specific link
 */
export async function fetchLinkFilesAction(linkId: string): Promise<ActionResult<FileListItem[]>> {
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

    // Fetch files associated with this link
    const linkFiles = await db
      .select({
        id: files.id,
        fileName: files.fileName,
        originalName: files.originalName,
        fileSize: files.fileSize,
        mimeType: files.mimeType,
        folderId: files.folderId,
        thumbnailPath: files.thumbnailPath,
        processingStatus: files.processingStatus,
        downloadCount: files.downloadCount,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(eq(files.linkId, linkId))
      .orderBy(desc(files.createdAt));

    // Transform to FileListItem format with computed fields
    const fileItems: FileListItem[] = linkFiles.map(file => ({
      ...file,
      sizeFormatted: formatFileSize(file.fileSize),
      typeCategory: getFileTypeCategory(file.mimeType),
      hasPreview: canGeneratePreview(file.mimeType),
      downloadUrl: `/api/files/${file.id}/download`,
    }));

    return {
      success: true,
      data: fileItems,
    };
  } catch (error) {
    console.error('Error fetching link files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch files',
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