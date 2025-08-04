import type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkWithStats,
} from '@/lib/database/types/links';
import type { DatabaseResult } from '@/lib/database/types/common';
import { linkCrudService } from './services/link-crud-service';
import { linkQueryService } from './services/link-query-service';
import { linkMetadataService } from './services/link-metadata-service';

/**
 * Main LinksDbService - Facade for all link database operations
 * This maintains backwards compatibility while delegating to specialized services
 */
export class LinksDbService {
  // ===================================
  // CREATE OPERATIONS
  // ===================================

  /**
   * Create a new link with validation and error handling
   */
  async create(linkData: LinkInsert): Promise<DatabaseResult<Link>> {
    return linkCrudService.create(linkData);
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
    return linkQueryService.getByUserId(userId, options);
  }

  /**
   * Get link by ID with statistics
   */
  async getById(linkId: string): Promise<DatabaseResult<LinkWithStats | null>> {
    return linkQueryService.getById(linkId);
  }

  /**
   * Get link by slug and topic combination
   */
  async getBySlugAndTopic(
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<LinkWithStats | null>> {
    return linkQueryService.getBySlugAndTopic(slug, topic);
  }

  /**
   * Get link by user, slug and topic combination
   */
  async getByUserSlugAndTopic(
    userId: string,
    slug: string,
    topic?: string | null
  ): Promise<DatabaseResult<Link | null>> {
    return linkQueryService.getByUserSlugAndTopic(userId, slug, topic);
  }

  // ===================================
  // UPDATE OPERATIONS
  // ===================================

  /**
   * Update a link with new data
   */
  async update(
    linkId: string,
    updates: LinkUpdate
  ): Promise<DatabaseResult<Link>> {
    return linkCrudService.update(linkId, updates);
  }

  /**
   * Cascade update base slug for all related links
   */
  async cascadeUpdateBaseSlug(
    userId: string,
    oldSlug: string,
    newSlug: string
  ): Promise<DatabaseResult<number>> {
    return linkCrudService.cascadeUpdateBaseSlug(userId, oldSlug, newSlug);
  }

  /**
   * Update link statistics (file count, total size, etc.)
   */
  async updateStats(linkId: string): Promise<DatabaseResult<Link>> {
    return linkMetadataService.updateStats(linkId);
  }

  // ===================================
  // DELETE OPERATIONS
  // ===================================

  /**
   * Soft delete a link (set isActive to false)
   */
  async softDelete(linkId: string): Promise<DatabaseResult<Link>> {
    return linkCrudService.softDelete(linkId);
  }

  /**
   * Hard delete a link and all associated data
   */
  async hardDelete(linkId: string): Promise<DatabaseResult<boolean>> {
    return linkCrudService.hardDelete(linkId);
  }

  // ===================================
  // VALIDATION OPERATIONS
  // ===================================

  /**
   * Validate ownership of a link
   */
  async validateOwnership(
    linkId: string,
    userId: string
  ): Promise<DatabaseResult<boolean>> {
    return linkMetadataService.validateOwnership(linkId, userId);
  }

  /**
   * Check if a link has expired
   */
  async isLinkExpired(linkId: string): Promise<DatabaseResult<boolean>> {
    return linkMetadataService.isLinkExpired(linkId);
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Build full URL for a link
   * @deprecated Use getBaseUrl from @/lib/config/url-config directly
   */
  private buildLinkUrl(slug: string, topic?: string | null): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foldly.com';
    return topic ? `${baseUrl}/${slug}/${topic}` : `${baseUrl}/${slug}`;
  }
}

// Export singleton instance for backwards compatibility
export const linksDbService = new LinksDbService();