import { eq, and, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import {
  links,
  files,
  batches,
  users,
} from '@/lib/database/schemas';
import type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkWithStats,
} from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import { 
  DATABASE_ERROR_CODES, 
  detectConstraintViolation,
  getErrorMessage
} from './constants/database-errors';

// =============================================================================
// SERVICE-SPECIFIC TYPES - Match Database Service Returns
// =============================================================================

/**
 * Database link with flat statistics (as returned by queries)
 * This matches what the database service naturally returns before UI transformation
 */
interface DbLinkWithStats extends Link {
  // Flat statistics (as returned by SQL aggregations)
  fileCount: number;
  batchCount: number;
  folderCount?: number;

  // User info (optional from joins) - matches exact query result types
  username: string | undefined;
  avatarUrl: string | undefined;

  // Computed fields
  fullUrl: string;
}

/**
 * UI-ready link type for feature layer consumption
 * Transforms flat stats into nested structure expected by UI
 */
const adaptDbLinkForUI = (dbLink: DbLinkWithStats): LinkWithStats => ({
  ...dbLink,
  stats: {
    fileCount: dbLink.fileCount,
    batchCount: dbLink.batchCount,
    folderCount: dbLink.folderCount || 0,
    totalViewCount: 0, // Will be populated by analytics service
    uniqueViewCount: 0,
    averageFileSize:
      dbLink.totalFiles > 0 ? dbLink.totalSize / dbLink.totalFiles : 0,
    storageUsedPercentage:
      dbLink.maxFileSize > 0
        ? (dbLink.totalSize / dbLink.maxFileSize) * 100
        : 0,
    isNearLimit:
      dbLink.maxFileSize > 0
        ? dbLink.totalSize / dbLink.maxFileSize > 0.8
        : false,
  },
});

// =============================================================================
// DATABASE SERVICE - Links CRUD Operations
// =============================================================================

export class LinksDbService {
  // ===================================
  // CREATE OPERATIONS
  // ===================================

  /**
   * Create a new link with validation and error handling
   */
  async create(linkData: LinkInsert): Promise<DatabaseResult<Link>> {
    try {
      // Validate required fields
      if (
        !linkData.userId ||
        !linkData.workspaceId ||
        !linkData.slug ||
        !linkData.title
      ) {
        return {
          success: false,
          error: 'Missing required fields: userId, workspaceId, slug, title',
          code: 'VALIDATION_ERROR',
        };
      }

      // Check for duplicate slug/topic combination
      const existingLink = await db.query.links.findFirst({
        where: and(
          eq(links.userId, linkData.userId),
          eq(links.slug, linkData.slug),
          linkData.topic
            ? eq(links.topic, linkData.topic)
            : sql`${links.topic} IS NULL`
        ),
      });

      if (existingLink) {
        return {
          success: false,
          error: 'Link with this slug and topic already exists',
          code: 'DUPLICATE_LINK',
        };
      }

      // Create the link
      const result = await db
        .insert(links)
        .values({
          ...linkData,
          updatedAt: new Date(),
        })
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Failed to create link',
          code: 'DATABASE_ERROR',
        };
      }

      return {
        success: true,
        data: result[0]!,
      };
    } catch (error) {
      console.error('Failed to create link:', error);
      
      // Handle known constraint violations
      if (error instanceof Error) {
        const constraintCode = detectConstraintViolation(error);
        if (constraintCode) {
          return {
            success: false,
            error: getErrorMessage(constraintCode),
            code: constraintCode,
          };
        }
      }
      
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: DATABASE_ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  // ===================================
  // READ OPERATIONS
  // ===================================

  /**
   * Get links by user ID with statistics and pagination
   */
  async getByUserId(
    userId: string,
    options: {
      includeInactive?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DatabaseResult<LinkWithStats[]>> {
    try {
      const { includeInactive = false, limit = 50, offset = 0 } = options;

      const query = db
        .select({
          // Link fields
          id: links.id,
          userId: links.userId,
          workspaceId: links.workspaceId,
          slug: links.slug,
          topic: links.topic,
          linkType: links.linkType,
          title: links.title,
          description: links.description,
          requireEmail: links.requireEmail,
          requirePassword: links.requirePassword,
          passwordHash: links.passwordHash,
          isPublic: links.isPublic,
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          brandEnabled: links.brandEnabled,
          brandColor: links.brandColor,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Statistics
          fileCount: count(files.id),
          batchCount: count(batches.id),
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
        .leftJoin(files, eq(links.id, files.linkId))
        .leftJoin(batches, eq(links.id, batches.linkId))
        .where(
          includeInactive
            ? eq(links.userId, userId)
            : and(eq(links.userId, userId), eq(links.isActive, true))
        )
        .groupBy(links.id, users.id)
        .orderBy(desc(links.createdAt))
        .limit(limit)
        .offset(offset);

      const results = await query;

      // Transform to service-specific type first
      const dbLinksWithStats: DbLinkWithStats[] = results.map(result => ({
        ...result,
        fileCount: Number(result.fileCount),
        batchCount: Number(result.batchCount),
        totalSize: Number(result.totalSize),
        fullUrl: this.buildLinkUrl(result.slug, result.topic),
        username: result.username || undefined,
        avatarUrl: result.avatarUrl || undefined,
      }));

      // Then adapt to UI format
      const linksWithStats = dbLinksWithStats.map(adaptDbLinkForUI);

      return {
        success: true,
        data: linksWithStats,
      };
    } catch (error) {
      console.error('Failed to get links by user ID:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Get link by ID with statistics
   */
  async getById(linkId: string): Promise<DatabaseResult<LinkWithStats | null>> {
    try {
      const result = await db
        .select({
          // Link fields
          id: links.id,
          userId: links.userId,
          workspaceId: links.workspaceId,
          slug: links.slug,
          topic: links.topic,
          linkType: links.linkType,
          title: links.title,
          description: links.description,
          requireEmail: links.requireEmail,
          requirePassword: links.requirePassword,
          passwordHash: links.passwordHash,
          isPublic: links.isPublic,
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          brandEnabled: links.brandEnabled,
          brandColor: links.brandColor,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Statistics
          fileCount: count(files.id),
          batchCount: count(batches.id),
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
        .leftJoin(files, eq(links.id, files.linkId))
        .leftJoin(batches, eq(links.id, batches.linkId))
        .where(eq(links.id, linkId))
        .groupBy(links.id, users.id)
        .limit(1);

      if (!result.length) {
        return {
          success: true,
          data: null,
        };
      }

      const linkData = result[0]!;
      const dbLinkWithStats: DbLinkWithStats = {
        ...linkData,
        fileCount: Number(linkData.fileCount),
        batchCount: Number(linkData.batchCount),
        totalSize: Number(linkData.totalSize),
        fullUrl: this.buildLinkUrl(linkData.slug, linkData.topic),
        username: linkData.username || undefined,
        avatarUrl: linkData.avatarUrl || undefined,
      };

      const linkWithStats = adaptDbLinkForUI(dbLinkWithStats);

      return {
        success: true,
        data: linkWithStats,
      };
    } catch (error) {
      console.error('Failed to get link by ID:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Get link by slug and topic (for public access)
   */
  async getBySlugAndTopic(
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<LinkWithStats | null>> {
    try {
      const result = await db
        .select({
          // Link fields
          id: links.id,
          userId: links.userId,
          workspaceId: links.workspaceId,
          slug: links.slug,
          topic: links.topic,
          linkType: links.linkType,
          title: links.title,
          description: links.description,
          requireEmail: links.requireEmail,
          requirePassword: links.requirePassword,
          passwordHash: links.passwordHash,
          isPublic: links.isPublic,
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          brandEnabled: links.brandEnabled,
          brandColor: links.brandColor,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Statistics
          fileCount: count(files.id),
          batchCount: count(batches.id),
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
        .leftJoin(files, eq(links.id, files.linkId))
        .leftJoin(batches, eq(links.id, batches.linkId))
        .where(
          and(
            eq(links.slug, slug),
            topic ? eq(links.topic, topic) : sql`${links.topic} IS NULL`,
            eq(links.isActive, true),
            eq(links.isPublic, true)
          )
        )
        .groupBy(links.id, users.id)
        .limit(1);

      if (!result.length) {
        return {
          success: true,
          data: null,
        };
      }

      const linkData = result[0]!;
      const dbLinkWithStats: DbLinkWithStats = {
        ...linkData,
        fileCount: Number(linkData.fileCount),
        batchCount: Number(linkData.batchCount),
        totalSize: Number(linkData.totalSize),
        fullUrl: this.buildLinkUrl(linkData.slug, linkData.topic),
        username: linkData.username || undefined,
        avatarUrl: linkData.avatarUrl || undefined,
      };

      const linkWithStats = adaptDbLinkForUI(dbLinkWithStats);

      return {
        success: true,
        data: linkWithStats,
      };
    } catch (error) {
      console.error('Failed to get link by slug and topic:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Get link by user ID, slug and topic (for topic availability validation)
   */
  async getByUserSlugAndTopic(
    userId: string,
    slug: string,
    topic: string
  ): Promise<DatabaseResult<Link | null>> {
    try {
      const result = await db.query.links.findFirst({
        where: and(
          eq(links.userId, userId),
          eq(links.slug, slug),
          eq(links.topic, topic)
        ),
      });

      return {
        success: true,
        data: result || null,
      };
    } catch (error) {
      console.error('Failed to get link by user, slug and topic:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  // ===================================
  // UPDATE OPERATIONS
  // ===================================

  /**
   * Update link with validation and optimistic concurrency control
   */
  async update(
    linkId: string,
    updates: LinkUpdate
  ): Promise<DatabaseResult<Link>> {
    try {
      // Validate the link exists
      const existingLink = await db.query.links.findFirst({
        where: eq(links.id, linkId),
      });

      if (!existingLink) {
        return {
          success: false,
          error: 'Link not found',
          code: 'LINK_NOT_FOUND',
        };
      }

      // Check for duplicate slug/topic if updating slug or topic
      if (updates.slug || updates.topic !== undefined) {
        const newSlug = updates.slug || existingLink.slug;
        const newTopic =
          updates.topic !== undefined ? updates.topic : existingLink.topic;

        const duplicateCheck = await db.query.links.findFirst({
          where: and(
            eq(links.userId, existingLink.userId),
            eq(links.slug, newSlug),
            newTopic ? eq(links.topic, newTopic) : sql`${links.topic} IS NULL`,
            sql`${links.id} != ${linkId}` // Exclude current link
          ),
        });

        if (duplicateCheck) {
          return {
            success: false,
            error: 'Link with this slug and topic already exists',
            code: 'DUPLICATE_LINK',
          };
        }
      }

      // Update the link
      const result = await db
        .update(links)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId))
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Failed to update link',
          code: 'DATABASE_ERROR',
        };
      }

      return {
        success: true,
        data: result[0]!,
      };
    } catch (error) {
      console.error('Failed to update link:', error);
      
      // Handle known constraint violations
      if (error instanceof Error) {
        const constraintCode = detectConstraintViolation(error);
        if (constraintCode) {
          return {
            success: false,
            error: getErrorMessage(constraintCode),
            code: constraintCode,
          };
        }
      }
      
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: DATABASE_ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Cascade update all links when base link slug changes
   * Updates ALL links (custom and generated) to use the new base slug
   */
  async cascadeUpdateBaseSlug(
    userId: string,
    oldSlug: string,
    newSlug: string
  ): Promise<DatabaseResult<{ updatedCount: number; updatedLinks: Link[] }>> {
    try {
      // Update ALL links for this user (base, custom, and generated)
      const updatedLinks = await db
        .update(links)
        .set({
          slug: newSlug,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(links.userId, userId),
            eq(links.slug, oldSlug) // All links with the old slug
          )
        )
        .returning();

      return {
        success: true,
        data: {
          updatedCount: updatedLinks.length,
          updatedLinks,
        },
      };
    } catch (error) {
      console.error('Failed to cascade update base slug:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Update link statistics (for background jobs)
   */
  async updateStats(linkId: string): Promise<DatabaseResult<Link>> {
    try {
      // Get current statistics
      const statsResult = await db
        .select({
          totalFiles: count(files.id),
          totalSize: sql<number>`COALESCE(SUM(${files.fileSize}), 0)`,
          totalUploads: count(sql`DISTINCT ${batches.id}`),
          lastUploadAt: sql<Date | null>`MAX(${batches.createdAt})`,
        })
        .from(links)
        .leftJoin(files, eq(links.id, files.linkId))
        .leftJoin(batches, eq(links.id, batches.linkId))
        .where(eq(links.id, linkId))
        .groupBy(links.id);

      if (!statsResult.length) {
        return {
          success: false,
          error: 'Link not found',
          code: 'LINK_NOT_FOUND',
        };
      }

      const stats = statsResult[0]!;

      // Update the link with new statistics
      const result = await db
        .update(links)
        .set({
          totalFiles: Number(stats.totalFiles),
          totalSize: Number(stats.totalSize),
          totalUploads: Number(stats.totalUploads),
          lastUploadAt: stats.lastUploadAt,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId))
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Failed to update link statistics',
          code: 'DATABASE_ERROR',
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

  // ===================================
  // DELETE OPERATIONS
  // ===================================

  /**
   * Soft delete link (set isActive to false)
   */
  async softDelete(linkId: string): Promise<DatabaseResult<Link>> {
    try {
      const [deletedLink] = await db
        .update(links)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(links.id, linkId))
        .returning();

      if (!deletedLink) {
        return {
          success: false,
          error: 'Link not found',
          code: 'LINK_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: deletedLink,
      };
    } catch (error) {
      console.error('Failed to soft delete link:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Hard delete link (CASCADE will handle related records)
   */
  async hardDelete(linkId: string): Promise<DatabaseResult<boolean>> {
    try {
      // Use transaction for hard delete to ensure consistency
      const result = await db.transaction(async tx => {
        // First verify the link exists
        const existingLink = await tx.query.links.findFirst({
          where: eq(links.id, linkId),
        });

        if (!existingLink) {
          throw new Error('Link not found');
        }

        // Delete the link (CASCADE will handle related records)
        await tx.delete(links).where(eq(links.id, linkId));

        return true;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Failed to hard delete link:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Build full URL for a link
   */
  private buildLinkUrl(slug: string, topic?: string | null): string {
    const baseUrl = 'foldly.com';
    return topic ? `${baseUrl}/${slug}/${topic}` : `${baseUrl}/${slug}`;
  }

  /**
   * Validate link ownership
   */
  async validateOwnership(
    linkId: string,
    userId: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      const link = await db.query.links.findFirst({
        where: and(eq(links.id, linkId), eq(links.userId, userId)),
      });

      return {
        success: true,
        data: !!link,
      };
    } catch (error) {
      console.error('Failed to validate ownership:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }

  /**
   * Check if link is expired
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
          code: 'LINK_NOT_FOUND',
        };
      }

      const isExpired = link.expiresAt
        ? new Date() > new Date(link.expiresAt)
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
}

// Export singleton instance
export const linksDbService = new LinksDbService();
