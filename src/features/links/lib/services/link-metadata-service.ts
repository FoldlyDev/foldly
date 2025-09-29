import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { links, files } from '@/lib/database/schemas';
import type { Link } from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';

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

      const link = result[0]!;
      return {
        success: true,
        data: {
          ...link,
          // Ensure branding is always an object, never null
          branding: link.branding || { enabled: false },
        },
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
   * Update storage usage for a link with quota validation
   * This method should only be called after proper quota checking
   */
  async updateStorageUsage(
    linkId: string,
    userId: string,
    bytesAdded: number
  ): Promise<DatabaseResult<void>> {
    try {
      // Validate quota before updating (safety check)
      const quotaCheck = await storageQuotaService.checkUserQuota(userId, bytesAdded);
      if (!quotaCheck.success || !quotaCheck.data || !quotaCheck.data.allowed) {
        return {
          success: false,
          error: (quotaCheck.success && quotaCheck.data?.message) || quotaCheck.error || 'Storage quota exceeded',
          code: 'QUOTA_EXCEEDED',
        };
      }

      // Update link metadata (only totalSize, not storageUsed)
      await db
        .update(links)
        .set({
          totalSize: sql`${links.totalSize} + ${bytesAdded}`,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId));

      // Update user storage through centralized service
      if (bytesAdded > 0) {
        await storageQuotaService.updateUserStorageUsage(userId, bytesAdded);
      }

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
    brandingUpdate: {
      enabled: boolean;
      color?: string;
      image?: string;
    }
  ): Promise<DatabaseResult<Link>> {
    try {
      const result = await db
        .update(links)
        .set({
          branding: brandingUpdate,
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

      const link = result[0]!;
      return {
        success: true,
        data: {
          ...link,
          // Ensure branding is always an object, never null
          branding: link.branding || { enabled: false },
        },
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