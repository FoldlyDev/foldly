import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { links, files, batches } from '@/lib/database/schemas';
import type {
  Link,
  LinkInsert,
  LinkUpdate,
} from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import {
  DATABASE_ERROR_CODES,
  detectConstraintViolation,
  getErrorMessage,
} from '../constants/database-errors';

/**
 * Service for basic CRUD operations on links
 */
export class LinkCrudService {
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

  /**
   * Update a link with new data
   */
  async update(
    linkId: string,
    updates: LinkUpdate
  ): Promise<DatabaseResult<Link>> {
    try {
      // Remove undefined values and add timestamp
      const cleanUpdates = Object.entries(updates).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key as keyof LinkUpdate] = value;
          }
          return acc;
        },
        {} as LinkUpdate
      );

      if (Object.keys(cleanUpdates).length === 0) {
        return {
          success: false,
          error: 'No valid updates provided',
          code: 'VALIDATION_ERROR',
        };
      }

      // Check if slug/topic combination already exists (if updating them)
      if (cleanUpdates.slug || cleanUpdates.topic !== undefined) {
        const existingLink = await db.query.links.findFirst({
          where: and(
            eq(links.slug, cleanUpdates.slug || ''),
            cleanUpdates.topic
              ? eq(links.topic, cleanUpdates.topic)
              : sql`${links.topic} IS NULL`
          ),
        });

        if (existingLink && existingLink.id !== linkId) {
          return {
            success: false,
            error: 'Link with this slug and topic already exists',
            code: 'DUPLICATE_LINK',
          };
        }
      }

      const result = await db
        .update(links)
        .set({
          ...cleanUpdates,
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
      console.error('Failed to update link:', error);

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
   * Soft delete a link (set isActive to false)
   */
  async softDelete(linkId: string): Promise<DatabaseResult<Link>> {
    try {
      const result = await db
        .update(links)
        .set({
          isActive: false,
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
   * Hard delete a link and all associated data
   */
  async hardDelete(linkId: string): Promise<DatabaseResult<boolean>> {
    try {
      // Use transaction to ensure all related data is deleted
      const result = await db.transaction(async tx => {
        // Delete associated files
        await tx.delete(files).where(eq(files.linkId, linkId));

        // Delete associated batches
        await tx.delete(batches).where(eq(batches.linkId, linkId));

        // Delete the link
        const deleteResult = await tx
          .delete(links)
          .where(eq(links.id, linkId))
          .returning();

        return deleteResult.length > 0;
      });

      if (!result) {
        return {
          success: false,
          error: 'Link not found',
          code: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: true,
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

  /**
   * Cascade update base slug for all related links
   */
  async cascadeUpdateBaseSlug(
    userId: string,
    oldSlug: string,
    newSlug: string
  ): Promise<DatabaseResult<number>> {
    try {
      // Update all links with the old base slug
      const result = await db
        .update(links)
        .set({
          slug: newSlug,
          updatedAt: new Date(),
        })
        .where(and(eq(links.userId, userId), eq(links.slug, oldSlug)))
        .returning();

      return {
        success: true,
        data: result.length,
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
}

export const linkCrudService = new LinkCrudService();