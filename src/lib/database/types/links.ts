// =============================================================================
// LINK TYPES - Database Link Entity and Related Types
// =============================================================================
// 🎯 Based on links table in drizzle/schema.ts

import type {
  DatabaseId,
  TimestampFields,
  WithoutSystemFields,
  PartialBy,
} from './common';
import type { LinkType } from './enums';

// =============================================================================
// BASE LINK TYPES - Direct from database schema
// =============================================================================

/**
 * Link entity - exact match to database schema
 */
export interface Link extends TimestampFields {
  id: DatabaseId;
  userId: DatabaseId;
  workspaceId: DatabaseId;

  // URL Components
  slug: string;
  topic: string | null;
  linkType: LinkType;

  // Display
  title: string;
  description: string | null;

  // Security controls
  requireEmail: boolean;
  requirePassword: boolean;
  passwordHash: string | null;
  isActive: boolean;

  // Limits and expiration
  maxFiles: number;
  maxFileSize: number;
  allowedFileTypes: string[] | null;
  expiresAt: Date | null;

  // Branding (Pro+ features)
  branding: {
    enabled: boolean;
    color?: string;
    image?: string;
  };

  // Usage Stats
  totalUploads: number;
  totalFiles: number;
  totalSize: number;
  lastUploadAt: Date | null;

  // Storage Quota Management
  storageUsed: number;
  storageLimit: number;

  // Notification tracking
  unreadUploads: number;
  lastNotificationAt: Date | null;

  // Generated Link Support
  sourceFolderId: DatabaseId | null;
}

/**
 * Link insert type - for creating new links
 */
export type LinkInsert = WithoutSystemFields<Link>;

/**
 * Link update type - for updating existing links
 */
export type LinkUpdate = PartialBy<
  Omit<Link, 'id' | 'userId' | 'workspaceId' | 'createdAt' | 'updatedAt'>,
  | 'slug'
  | 'linkType'
  | 'title'
  | 'requireEmail'
  | 'requirePassword'
  | 'isActive'
  | 'maxFiles'
  | 'maxFileSize'
  | 'branding'
  | 'totalUploads'
  | 'totalFiles'
  | 'totalSize'
  | 'storageUsed'
  | 'storageLimit'
  | 'unreadUploads'
>;

// =============================================================================
// COMPUTED LINK TYPES - With calculated fields and relationships
// =============================================================================

/**
 * Link with statistics - includes calculated stats
 */
export interface LinkWithStats extends Link {
  stats: {
    fileCount: number;
    batchCount: number;
    folderCount: number;
    totalViewCount: number;
    uniqueViewCount: number;
    averageFileSize: number;
    storageUsedPercentage: number;
    isNearLimit: boolean;
  };
}

/**
 * Link with files - includes file relationships
 */
export interface LinkWithFiles extends Link {
  files: Array<{
    id: DatabaseId;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    folderId: DatabaseId | null;
  }>;
}

/**
 * Link with folders - includes folder structure
 */
export interface LinkWithFolders extends Link {
  folders: Array<{
    id: DatabaseId;
    name: string;
    path: string;
    fileCount: number;
    totalSize: number;
    parentFolderId: DatabaseId | null;
  }>;
}

/**
 * Link with user info - includes user relationship
 */
export interface LinkWithUser extends Link {
  user: {
    id: DatabaseId;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Complete link - includes all relationships and computed fields
 */
export interface CompleteLink
  extends LinkWithStats,
    Omit<LinkWithFiles, keyof Link>,
    Omit<LinkWithFolders, keyof Link>,
    Omit<LinkWithUser, keyof Link> {
  // Additional computed fields
  fullUrl: string;
  shortUrl: string;
  qrCodeUrl: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  canUpload: boolean;
  remainingUploads: number;
  remainingStorage: number;
}

// =============================================================================
// LINK UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * Link for listing - condensed info for lists
 */
export interface LinkListItem {
  id: DatabaseId;
  slug: string;
  topic: string | null;
  linkType: LinkType;
  title: string;
  description: string | null;
  isActive: boolean;
  totalFiles: number;
  totalSize: number;
  lastUploadAt: Date | null;
  createdAt: Date;
  fullUrl: string;
  isExpired: boolean;
}

/**
 * Link for sharing - public info safe to share
 */
export interface PublicLinkInfo {
  id: DatabaseId;
  slug: string;
  topic: string | null;
  title: string;
  description: string | null;
  isActive: boolean;
  requireEmail: boolean;
  requirePassword: boolean;
  maxFiles: number;
  maxFileSize: number;
  expiresAt: Date | null;
  branding: {
    enabled: boolean;
    color?: string;
    image?: string;
  };
  user: {
    username: string;
    avatarUrl: string | null;
  };
}

/**
 * Link for analytics - includes analytics data
 */
export interface LinkAnalytics extends Link {
  analytics: {
    views: {
      total: number;
      unique: number;
      daily: Array<{ date: Date; views: number }>;
      weekly: Array<{ week: string; views: number }>;
      monthly: Array<{ month: string; views: number }>;
    };
    uploads: {
      total: number;
      daily: Array<{ date: Date; uploads: number }>;
      weekly: Array<{ week: string; uploads: number }>;
      monthly: Array<{ month: string; uploads: number }>;
    };
    geography: Array<{ country: string; views: number }>;
    referrers: Array<{ source: string; views: number }>;
    devices: Array<{ type: string; views: number }>;
  };
}

// =============================================================================
// LINK FORM TYPES - For form handling and validation
// =============================================================================

/**
 * Link creation form data
 */
export interface LinkCreateForm {
  slug: string;
  topic?: string;
  linkType: LinkType;
  title: string;
  description?: string;
  requireEmail?: boolean;
  requirePassword?: boolean;
  password?: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  expiresAt?: Date;
  branding?: {
    enabled: boolean;
    color?: string;
    image?: string;
  };
}

/**
 * Link update form data
 */
export interface LinkUpdateForm {
  title?: string;
  description?: string;
  requireEmail?: boolean;
  requirePassword?: boolean;
  password?: string;
  isActive?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  expiresAt?: Date;
  branding?: {
    enabled: boolean;
    color?: string;
    image?: string;
  };
}

/**
 * Link branding form data
 */
export interface LinkBrandingForm {
  branding: {
    enabled: boolean;
    color?: string;
    image?: string;
  };
}

// =============================================================================
// LINK VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * Link validation constraints
 */
export interface LinkValidationConstraints {
  slug: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    reservedWords: string[];
  };
  topic: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    reservedWords: string[];
  };
  title: {
    minLength: number;
    maxLength: number;
  };
  description: {
    maxLength: number;
  };
  password: {
    minLength: number;
    maxLength: number;
  };
  maxFiles: {
    min: number;
    max: number;
  };
  maxFileSize: {
    min: number;
    max: number;
  };
  allowedFileTypes: {
    maxItems: number;
    validMimeTypes: string[];
  };
}

/**
 * Link field validation errors
 */
export interface LinkValidationErrors {
  slug?: string[];
  topic?: string[];
  title?: string[];
  description?: string[];
  password?: string[];
  maxFiles?: string[];
  maxFileSize?: string[];
  allowedFileTypes?: string[];
  expiresAt?: string[];
  branding?: string[];
}

// =============================================================================
// LINK FILTER TYPES - For querying and filtering links
// =============================================================================

/**
 * Link filter options
 */
export interface LinkFilterOptions {
  userId?: DatabaseId;
  workspaceId?: DatabaseId;
  linkType?: LinkType | LinkType[];
  isActive?: boolean;
  requireEmail?: boolean;
  requirePassword?: boolean;
  branding?: { enabled: boolean };
  isExpired?: boolean;
  createdDateRange?: { start: Date; end: Date };
  lastUploadDateRange?: { start: Date; end: Date };
  fileSizeRange?: { min: number; max: number };
  fileCountRange?: { min: number; max: number };
}

/**
 * Link sort options
 */
export type LinkSortField =
  | 'slug'
  | 'topic'
  | 'title'
  | 'linkType'
  | 'totalFiles'
  | 'totalSize'
  | 'totalUploads'
  | 'lastUploadAt'
  | 'createdAt'
  | 'updatedAt'
  | 'expiresAt';

/**
 * Link query options
 */
export interface LinkQueryOptions {
  search?: string;
  filters?: LinkFilterOptions;
  sort?: {
    field: LinkSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    user?: boolean;
    stats?: boolean;
    files?: boolean;
    folders?: boolean;
    analytics?: boolean;
  };
}

// =============================================================================
// LINK HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

// generateFullUrl moved to src/features/links/lib/utils.ts to avoid server/client imports

/**
 * Generate short URL for link
 */
export const generateShortUrl = (baseUrl: string, linkId: string): string => {
  return `${baseUrl}/s/${linkId}`;
};

/**
 * Check if link is expired
 */
export const isLinkExpired = (link: Pick<Link, 'expiresAt'>): boolean => {
  if (!link.expiresAt) return false;
  return new Date() > link.expiresAt;
};

/**
 * Check if link is near expiry (within 7 days)
 */
export const isLinkNearExpiry = (link: Pick<Link, 'expiresAt'>): boolean => {
  if (!link.expiresAt) return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return link.expiresAt <= sevenDaysFromNow;
};

/**
 * Check if link can accept uploads
 */
export const canAcceptUploads = (
  link: Pick<Link, 'isActive' | 'expiresAt' | 'totalFiles' | 'maxFiles'>
): boolean => {
  if (!link.isActive) return false;
  if (isLinkExpired(link)) return false;
  if (link.totalFiles >= link.maxFiles) return false;
  return true;
};

/**
 * Calculate remaining uploads
 */
export const calculateRemainingUploads = (
  link: Pick<Link, 'totalFiles' | 'maxFiles'>
): number => {
  return Math.max(0, link.maxFiles - link.totalFiles);
};

/**
 * Calculate remaining storage
 */
export const calculateRemainingStorage = (
  link: Pick<Link, 'totalSize' | 'maxFileSize'>
): number => {
  return Math.max(0, link.maxFileSize - link.totalSize);
};

/**
 * Check if link is near storage limit (>80%)
 */
export const isNearStorageLimit = (
  link: Pick<Link, 'totalSize' | 'maxFileSize'>
): boolean => {
  if (link.maxFileSize === 0) return false;
  return link.totalSize / link.maxFileSize > 0.8;
};

// calculateStoragePercentage is defined in users.ts for user storage calculations

/**
 * Generate QR code URL
 */
export const generateQRCodeUrl = (linkUrl: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkUrl)}`;
};

/**
 * Validate slug format
 */
export const isValidSlug = (slug: string): boolean => {
  const slugPattern = /^[a-zA-Z0-9-_]+$/;
  return slugPattern.test(slug) && slug.length >= 1 && slug.length <= 100;
};

/**
 * Validate topic format
 */
export const isValidTopic = (topic: string): boolean => {
  const topicPattern = /^[a-zA-Z0-9-_]+$/;
  return topicPattern.test(topic) && topic.length >= 1 && topic.length <= 100;
};

/**
 * Validate brand color
 */
export const isValidBrandColor = (color: string): boolean => {
  const colorPattern = /^#[0-9A-Fa-f]{6}$/;
  return colorPattern.test(color);
};

/**
 * Validate brand image URL
 */
export const isValidBrandImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
