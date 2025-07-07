// Links API Service
// Direct API communication layer

import type {
  UploadLink,
  CreateUploadLinkInput,
  UpdateUploadLinkInput,
} from '../types';
import type { LinkId, Result, ValidationError } from '@/types';

import type { LinksApiInterface, LinkFilters } from './types';

/**
 * Links API Service Implementation
 * Handles all API communication for links feature
 */
export class LinksApiService implements LinksApiInterface {
  private readonly baseUrl = '/api/upload-links';

  /**
   * Get a single link by ID
   */
  async getLink(id: LinkId): Promise<Result<UploadLink, ValidationError>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to fetch link: ${response.statusText}` as ValidationError,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }

  /**
   * Create a new link
   */
  async createLink(
    data: CreateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to create link: ${response.statusText}` as ValidationError,
        };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }
  /**
   * Update an existing link
   */
  async updateLink(
    id: LinkId,
    data: UpdateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to update link: ${response.statusText}` as ValidationError,
        };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }

  /**
   * Delete a link
   */
  async deleteLink(id: LinkId): Promise<Result<boolean, ValidationError>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to delete link: ${response.statusText}` as ValidationError,
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }

  /**
   * Duplicate a link
   */
  async duplicateLink(
    id: LinkId
  ): Promise<Result<UploadLink, ValidationError>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to duplicate link: ${response.statusText}` as ValidationError,
        };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }
  /**
   * List links with optional filters
   */
  async listLinks(
    filters?: LinkFilters
  ): Promise<Result<UploadLink[], ValidationError>> {
    try {
      const url = new URL(this.baseUrl, window.location.origin);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        return {
          success: false,
          error:
            `Failed to list links: ${response.statusText}` as ValidationError,
        };
      }

      const result = await response.json();
      return { success: true, data: result.items || result };
    } catch (error) {
      return {
        success: false,
        error:
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` as ValidationError,
      };
    }
  }

  /**
   * Search links by query
   */
  async searchLinks(
    query: string
  ): Promise<Result<UploadLink[], ValidationError>> {
    return this.listLinks({ search: query });
  }
}

// Export singleton instance
export const linksApiService = new LinksApiService();
