import { eq, and, desc, count, sql, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { links, files, batches, users, folders } from '@/lib/database/schemas';
import type {
  Link,
  LinkWithStats,
} from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import { getBaseUrl } from '@/lib/config/url-config';

/**
 * Database link with flat statistics (as returned by queries)
 * This matches what the database service naturally returns before UI transformation
 */
interface DbLinkWithStats extends Omit<Link, 'branding'> {
  // Branding can be null from database
  branding: {
    enabled: boolean;
    color?: string;
    image?: string;
  } | null;

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
 * Service for querying and retrieving links with statistics
 */
export class LinkQueryService {
  /**
   * Build full URL for a link
   */
  private buildLinkUrl(slug: string, topic?: string | null): string {
    const baseUrl = getBaseUrl();
    return topic ? `${baseUrl}/${slug}/${topic}` : `${baseUrl}/${slug}`;
  }

  /**
   * UI-ready link type for feature layer consumption
   * Transforms flat stats into nested structure expected by UI
   */
  private adaptDbLinkForUI(dbLink: DbLinkWithStats): LinkWithStats {
    return {
      ...dbLink,
      // Ensure branding is always an object, never null
      branding: dbLink.branding || { enabled: false },
      // Include user info if available
      username: dbLink.username,
      avatarUrl: dbLink.avatarUrl,
      stats: {
        // Use totalFiles from links table which includes all files (not just linkId files)
        fileCount: dbLink.totalFiles,
        batchCount: dbLink.batchCount,
        folderCount: dbLink.folderCount || 0,
        totalViewCount: 0, // View tracking not implemented - placeholder for future
        uniqueViewCount: 0, // View tracking not implemented - placeholder for future
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
    };
  }

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
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          branding: links.branding,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          unreadUploads: links.unreadUploads,
          lastNotificationAt: links.lastNotificationAt,
          sourceFolderId: links.sourceFolderId,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Use subqueries to avoid cartesian product in counts
          fileCount: sql<number>`(SELECT COUNT(*) FROM ${files} WHERE ${files.linkId} = ${links.id})`,
          batchCount: sql<number>`(SELECT COUNT(*) FROM ${batches} WHERE ${batches.linkId} = ${links.id})`,
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
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
      const linksWithStats = dbLinksWithStats.map(link => this.adaptDbLinkForUI(link));

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
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          branding: links.branding,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          unreadUploads: links.unreadUploads,
          lastNotificationAt: links.lastNotificationAt,
          sourceFolderId: links.sourceFolderId,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Use subqueries to avoid cartesian product in counts
          fileCount: sql<number>`(SELECT COUNT(*) FROM ${files} WHERE ${files.linkId} = ${links.id})`,
          batchCount: sql<number>`(SELECT COUNT(*) FROM ${batches} WHERE ${batches.linkId} = ${links.id})`,
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
        .where(eq(links.id, linkId))
        .groupBy(links.id, users.id);

      const [row] = await result;

      if (!row) {
        return {
          success: true,
          data: null,
        };
      }

      // Transform to service-specific type
      const dbLinkWithStats: DbLinkWithStats = {
        ...row,
        fileCount: Number(row.fileCount),
        batchCount: Number(row.batchCount),
        totalSize: Number(row.totalSize),
        fullUrl: this.buildLinkUrl(row.slug, row.topic),
        username: row.username || undefined,
        avatarUrl: row.avatarUrl || undefined,
      };

      return {
        success: true,
        data: this.adaptDbLinkForUI(dbLinkWithStats),
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
   * Get link by slug and topic combination
   */
  async getBySlugAndTopic(
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<LinkWithStats | null>> {
    try {
      const whereCondition = topic
        ? and(eq(links.slug, slug), eq(links.topic, topic))
        : and(eq(links.slug, slug), sql`${links.topic} IS NULL`);

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
          isActive: links.isActive,
          maxFiles: links.maxFiles,
          maxFileSize: links.maxFileSize,
          allowedFileTypes: links.allowedFileTypes,
          expiresAt: links.expiresAt,
          branding: links.branding,
          totalUploads: links.totalUploads,
          totalFiles: links.totalFiles,
          totalSize: links.totalSize,
          lastUploadAt: links.lastUploadAt,
          unreadUploads: links.unreadUploads,
          lastNotificationAt: links.lastNotificationAt,
          sourceFolderId: links.sourceFolderId,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          // User info
          username: users.username,
          avatarUrl: users.avatarUrl,
          // Use subqueries to avoid cartesian product in counts
          fileCount: sql<number>`(SELECT COUNT(*) FROM ${files} WHERE ${files.linkId} = ${links.id})`,
          batchCount: sql<number>`(SELECT COUNT(*) FROM ${batches} WHERE ${batches.linkId} = ${links.id})`,
        })
        .from(links)
        .leftJoin(users, eq(links.userId, users.id))
        .where(whereCondition)
        .groupBy(links.id, users.id);

      const [row] = await result;

      if (!row) {
        return {
          success: true,
          data: null,
        };
      }

      // Transform to service-specific type
      const dbLinkWithStats: DbLinkWithStats = {
        ...row,
        fileCount: Number(row.fileCount),
        batchCount: Number(row.batchCount),
        totalSize: Number(row.totalSize),
        fullUrl: this.buildLinkUrl(row.slug, row.topic),
        username: row.username || undefined,
        avatarUrl: row.avatarUrl || undefined,
      };

      return {
        success: true,
        data: this.adaptDbLinkForUI(dbLinkWithStats),
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
   * Get link by user, slug and topic combination
   */
  async getByUserSlugAndTopic(
    userId: string,
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<Link | null>> {
    try {
      const whereCondition = topic
        ? and(
            eq(links.userId, userId),
            eq(links.slug, slug),
            eq(links.topic, topic)
          )
        : and(
            eq(links.userId, userId),
            eq(links.slug, slug),
            sql`${links.topic} IS NULL`
          );

      const link = await db.query.links.findFirst({
        where: whereCondition,
      });

      return {
        success: true,
        data: link ? {
          ...link,
          // Ensure branding is always an object, never null
          branding: link.branding || { enabled: false },
        } : null,
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

  /**
   * Get detailed link statistics with correct counts
   * This method properly counts batches, files, and folders
   */
  async getLinkDetailsWithStats(linkId: string): Promise<DatabaseResult<LinkWithStats | null>> {
    try {
      // First get the link data
      const linkData = await db.query.links.findFirst({
        where: eq(links.id, linkId),
        with: {
          user: true,
        },
      });

      if (!linkData) {
        return {
          success: true,
          data: null,
        };
      }

      // Get actual batch count (upload sessions)
      const batchCountResult = await db
        .select({ count: count() })
        .from(batches)
        .where(eq(batches.linkId, linkId));

      // Get actual file count
      const fileCountResult = await db
        .select({ count: count() })
        .from(files)
        .where(eq(files.linkId, linkId));

      // Get actual folder count
      const folderCountResult = await db
        .select({ count: count() })
        .from(folders)
        .where(eq(folders.linkId, linkId));

      const batchCount = Number(batchCountResult[0]?.count || 0);
      const fileCount = Number(fileCountResult[0]?.count || 0);
      const folderCount = Number(folderCountResult[0]?.count || 0);

      // Create the response with accurate stats
      const linkWithStats: LinkWithStats = {
        ...linkData,
        // Ensure branding is always an object, never null
        branding: linkData.branding || { enabled: false },
        stats: {
          // Use totalFiles from links table which includes all files
          fileCount: linkData.totalFiles,
          batchCount: batchCount,  // This is the actual number of upload sessions
          folderCount: folderCount,
          totalViewCount: 0, // View tracking not implemented - placeholder for future
          uniqueViewCount: 0, // View tracking not implemented - placeholder for future
          averageFileSize:
            linkData.totalFiles > 0 ? linkData.totalSize / linkData.totalFiles : 0,
          storageUsedPercentage:
            linkData.maxFileSize > 0
              ? (linkData.totalSize / linkData.maxFileSize) * 100
              : 0,
          isNearLimit:
            linkData.maxFileSize > 0
              ? linkData.totalSize / linkData.maxFileSize > 0.8
              : false,
        },
      };

      return {
        success: true,
        data: linkWithStats,
      };
    } catch (error) {
      console.error('Failed to get link details with stats:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATABASE_ERROR',
      };
    }
  }
}

export const linkQueryService = new LinkQueryService();