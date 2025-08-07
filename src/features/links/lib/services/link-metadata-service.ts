import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { links, files } from '@/lib/database/schemas';
import type { Link } from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';

/**
 * Service for managing link metadata and statistics
 */
export class LinkMetadataService {
  /**
   * Update link statistics (file count, total size, etc.)
   */
  async updateStats(linkId: string): Promise<DatabaseResult<Link>> {
    try {
      // Get current statistics
      const statsResult = await db
        .select({
          totalFiles: sql<number>`COUNT(${files.id})`,
          totalSize: sql<number>`COALESCE(SUM(${files.fileSize}), 0)`,
        })
        .from(files)
        .where(eq(files.linkId, linkId));

      const stats = statsResult[0];

      if (!stats) {
        return {
          success: false,
          error: 'Failed to calculate statistics',
          code: 'DATABASE_ERROR',
        };
      }

      // Update link with new statistics
      const result = await db
        .update(links)
        .set({
          totalFiles: Number(stats.totalFiles),
          totalSize: Number(stats.totalSize),
          storageUsed: Number(stats.totalSize),
          lastUploadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId))
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: result[0]!,
      };
    } catch (error) {
      console.error('Failed to update link statistics:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Validate ownership of a link
   */
  async validateOwnership(
    linkId: string,
    userId: string
  ): Promise<DatabaseResult<boolean>> {
    try {
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

      return {
        success: true,
        data: link.userId === userId,
      };
    } catch (error) {
      console.error('Failed to validate link ownership:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Check if a link has expired
   */
  async isLinkExpired(linkId: string): Promise<DatabaseResult<boolean>> {
    try {
      const link = await db.query.links.findFirst({
        where: eq(links.id, linkId),
        columns: {
          expiresAt: true,
        },
      });

      if (!link) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      const isExpired = link.expiresAt
        ? new Date(link.expiresAt) < new Date()
        : false;

      return {
        success: true,
        data: isExpired,
      };
    } catch (error) {
      console.error('Failed to check link expiration:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Increment upload count for a link
   */
  async incrementUploadCount(linkId: string): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(links)
        .set({
          totalUploads: sql`${links.totalUploads} + 1`,
          lastUploadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Failed to increment upload count:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Update storage usage for a link
   */
  async updateStorageUsage(
    linkId: string,
    bytesAdded: number
  ): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(links)
        .set({
          storageUsed: sql`${links.storageUsed} + ${bytesAdded}`,
          totalSize: sql`${links.totalSize} + ${bytesAdded}`,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Failed to update storage usage:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Update branding settings for a link
   */
  async updateBranding(
    linkId: string,
    branding: {
      brandEnabled?: boolean;
      brandColor?: string;
      brandLogoUrl?: string;
    }
  ): Promise<DatabaseResult<Link>> {
    try {
      const result = await db
        .update(links)
        .set({
          ...branding,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId))
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: result[0]!,
      };
    } catch (error) {
      console.error('Failed to update branding:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }
}

export const linkMetadataService = new LinkMetadataService();