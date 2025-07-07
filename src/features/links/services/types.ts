// Links Service Types
// Interface definitions for the service layer

import type {
  UploadLink,
  CreateUploadLinkInput,
  UpdateUploadLinkInput,
} from '../types';
import type { LinkId, Result, ValidationError } from '@/types';

/**
 * Links API Service Interface
 * Handles direct API communication
 */
export interface LinksApiInterface {
  // CRUD Operations
  getLink(id: LinkId): Promise<Result<UploadLink, ValidationError>>;
  createLink(
    data: CreateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>>;
  updateLink(
    id: LinkId,
    data: UpdateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>>;
  deleteLink(id: LinkId): Promise<Result<boolean, ValidationError>>;
  duplicateLink(id: LinkId): Promise<Result<UploadLink, ValidationError>>;

  // List Operations
  listLinks(
    filters?: LinkFilters
  ): Promise<Result<UploadLink[], ValidationError>>;
  searchLinks(query: string): Promise<Result<UploadLink[], ValidationError>>;
}

/**
 * Links Business Logic Service Interface
 * Handles business rules and validation
 */
export interface LinksServiceInterface {
  // High-level operations
  createLinkWithValidation(
    data: CreateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>>;
  updateLinkWithValidation(
    id: LinkId,
    data: UpdateUploadLinkInput
  ): Promise<Result<UploadLink, ValidationError>>;
  archiveLink(id: LinkId): Promise<Result<boolean, ValidationError>>;

  // Business logic
  validateLinkData(data: Partial<UploadLink>): Result<true, ValidationError>;
  generateUniqueSlug(title: string): Promise<string>;
  checkSlugAvailability(slug: string): Promise<boolean>;
}

/**
 * Link filtering options
 */
export interface LinkFilters {
  isActive?: boolean;
  linkType?: 'base' | 'upload';
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  orderBy?: 'createdAt' | 'title' | 'lastActivity';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
