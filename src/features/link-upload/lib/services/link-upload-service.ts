// =============================================================================
// LINK UPLOAD SERVICE - Server-side business logic for link uploads
// =============================================================================

import { db } from '@/lib/database/connection';
import { files, folders, batches, links } from '@/lib/database/schemas';
import { eq, sql, inArray, and, isNull } from 'drizzle-orm';
import { logger } from '@/lib/services/logging/logger';
import type { File, Folder, Link } from '@/lib/database/types';
import type { DatabaseResult } from '@/lib/database/types/common';
import bcrypt from 'bcryptjs';

/**
 * Link upload data structure for tree rendering
 */
export interface LinkUploadTreeData {
  link: Link;
  folders: Folder[];
  files: File[];
}

/**
 * Service for managing link upload operations
 * Handles the complex logic for fetching and organizing files/folders
 * based on link type (base, custom, generated)
 */
export class LinkUploadService {
  /**
   * Get link by slug and optional topic
   * Public access - no auth required
   */
  async getLinkBySlug(
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<Link | null>> {
    try {
      const whereCondition = topic
        ? and(eq(links.slug, slug), eq(links.topic, topic))
        : and(eq(links.slug, slug), isNull(links.topic));

      const result = await db.query.links.findFirst({
        where: whereCondition,
      });

      if (!result) {
        return {
          success: true,
          data: null,
        };
      }

      // Check if link is active
      if (!result.isActive) {
        logger.info('Inactive link accessed', { slug, topic });
        return {
          success: false,
          error: 'This link is no longer active',
          code: 'LINK_INACTIVE',
        };
      }

      // Check if link has expired
      if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
        logger.info('Expired link accessed', { slug, topic });
        return {
          success: false,
          error: 'This link has expired',
          code: 'LINK_EXPIRED',
        };
      }

      // Transform to Link interface type
      const link: Link = {
        ...result,
        branding: result.branding || { enabled: false },
      };

      return {
        success: true,
        data: link,
      };
    } catch (error) {
      logger.error('Failed to get link by slug', error, { slug, topic });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch link',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Get tree data (folders and files) for a link
   * Handles different link types appropriately
   */
  async getLinkTreeData(linkId: string): Promise<DatabaseResult<LinkUploadTreeData>> {
    try {
      // First get the link to determine its type
      const link = await db.query.links.findFirst({
        where: eq(links.id, linkId),
      });

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      let foldersData: Folder[] = [];
      let filesData: File[] = [];

      if (link.linkType === 'generated' && link.sourceFolderId && link.workspaceId) {
        // Generated links show workspace folders and files uploaded through the link
        foldersData = await this.getGeneratedLinkFolders(
          link.workspaceId,
          link.sourceFolderId
        );
        filesData = await this.getGeneratedLinkFiles(linkId);
      } else {
        // Base/custom links show folders and files with linkId set
        foldersData = await this.getBaseLinkFolders(linkId);
        filesData = await this.getBaseLinkFiles(linkId);
      }

      return {
        success: true,
        data: {
          folders: foldersData,
          files: filesData,
        },
      };
    } catch (error) {
      logger.error('Failed to get link tree data', error, { linkId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tree data',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Verify if a user owns a specific link
   * Used to determine if owner redirect should be shown
   */
  async verifyLinkOwnership(
    linkId: string,
    userId: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      const result = await db.query.links.findFirst({
        where: eq(links.id, linkId),
        columns: {
          userId: true,
        },
      });

      if (!result) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      const isOwner = result.userId === userId;

      return {
        success: true,
        data: isOwner,
      };
    } catch (error) {
      logger.error('Failed to verify link ownership', error, { linkId, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify ownership',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Validate password for a protected link
   */
  async validateLinkPassword(
    linkId: string,
    password: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      const result = await db.query.links.findFirst({
        where: eq(links.id, linkId),
      });

      if (!result) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      // No password required
      if (!result.requirePassword || !result.passwordHash) {
        return {
          success: true,
          data: true,
        };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, result.passwordHash);

      if (!isValid) {
        logger.info('Invalid password attempt for link', { linkId });
        return {
          success: false,
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error('Failed to validate link password', error, { linkId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate password',
        code: 'DATABASE_ERROR',
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Get folders for generated links (workspace folders)
   */
  private async getGeneratedLinkFolders(
    workspaceId: string,
    sourceFolderId: string
  ): Promise<Folder[]> {
    // Get all workspace folders
    const allFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.workspaceId, workspaceId));

    // Find the source folder and all its descendants
    const sourceFolder = allFolders.find(f => f.id === sourceFolderId);
    if (!sourceFolder) {
      return [];
    }

    const descendantFolders: Folder[] = [sourceFolder];
    const findDescendants = (parentId: string) => {
      const children = allFolders.filter(f => f.parentFolderId === parentId);
      children.forEach(child => {
        descendantFolders.push(child);
        findDescendants(child.id);
      });
    };

    findDescendants(sourceFolderId);
    return descendantFolders;
  }

  /**
   * Get files for generated links (files uploaded through batches)
   */
  private async getGeneratedLinkFiles(linkId: string): Promise<File[]> {
    // Get all batches for this link
    const linkBatches = await db
      .select({ id: batches.id })
      .from(batches)
      .where(eq(batches.linkId, linkId));

    if (linkBatches.length === 0) {
      return [];
    }

    const batchIds = linkBatches.map(b => b.id);

    // Get all files from these batches
    const filesData = await db
      .select()
      .from(files)
      .where(inArray(files.batchId, batchIds));

    return filesData;
  }

  /**
   * Get folders for base/custom links
   */
  private async getBaseLinkFolders(linkId: string): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(eq(folders.linkId, linkId));
  }

  /**
   * Get files for base/custom links
   */
  private async getBaseLinkFiles(linkId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.linkId, linkId));
  }
}

// Export singleton instance
export const linkUploadService = new LinkUploadService();