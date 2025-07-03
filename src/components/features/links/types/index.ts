// Links Feature Types for Foldly - Link Management and Creation
// Business domain types specific to link functionality
// Following 2025 TypeScript best practices with strict type safety

// =============================================================================
// LINK DOMAIN CONSTANTS
// =============================================================================

/**
 * Link types for the multi-link system
 */
export const LINK_TYPE = {
  BASE: 'base', // General upload area (/username)
  CUSTOM: 'custom', // Topic-specific uploads (/username/topic)
  GENERATED: 'generated', // Right-click folder link creation
} as const satisfies Record<string, string>;

export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];

/**
 * Link error codes specific to link operations
 */
export const LINK_ERROR_CODE = {
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  LINK_EXPIRED: 'LINK_EXPIRED',
  LINK_DISABLED: 'LINK_DISABLED',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  SLUG_ALREADY_EXISTS: 'SLUG_ALREADY_EXISTS',
  INVALID_SLUG_FORMAT: 'INVALID_SLUG_FORMAT',
} as const satisfies Record<string, string>;

export type LinkErrorCode =
  (typeof LINK_ERROR_CODE)[keyof typeof LINK_ERROR_CODE];

// =============================================================================
// FOLDLY URL PATTERNS (BUSINESS DOMAIN SPECIFIC)
// =============================================================================

// Foldly-specific URL patterns for the links feature
export type BaseUploadUrl = `/foldly.io/${string}` & {
  readonly __brand: 'BaseUploadUrl';
};
export type CustomUploadUrl = `/foldly.io/${string}/${string}` & {
  readonly __brand: 'CustomUploadUrl';
};
export type UploadUrl = (BaseUploadUrl | CustomUploadUrl) & {
  readonly __brand: 'UploadUrl';
};

// =============================================================================
// TYPE GUARDS FOR LINKS
// =============================================================================

export const isValidLinkType = (type: unknown): type is LinkType => {
  return (
    typeof type === 'string' &&
    Object.values(LINK_TYPE).includes(type as LinkType)
  );
};

export const isValidLinkErrorCode = (code: unknown): code is LinkErrorCode => {
  return (
    typeof code === 'string' &&
    Object.values(LINK_ERROR_CODE).includes(code as LinkErrorCode)
  );
};

// =============================================================================
// TYPE ADAPTERS AND UTILITIES
// =============================================================================

import type { UploadLink } from './database';
import type { HexColor } from '../../../../types/ids';

/**
 * UI-optimized link data structure - matches LinkCard component expectations
 */
export interface LinkData {
  readonly id: string;
  readonly name: string; // Display name for LinkCard component
  readonly title: string; // Keep both for compatibility
  readonly slug: string;
  readonly topic?: string;
  readonly linkType: LinkType;
  readonly isPublic: boolean;
  readonly status: 'active' | 'paused' | 'expired'; // Required for StatusIndicator
  readonly url: string; // Generated URL for display and copying
  readonly uploads: number; // Renamed from totalUploads for LinkCard compatibility
  readonly views: number; // View count for display
  readonly lastActivity: string; // Human-readable last activity
  readonly expiresAt?: string; // Human-readable expiry
  readonly createdAt: string; // Human-readable creation date
  readonly requireEmail?: boolean; // For settings display
  readonly requirePassword?: boolean; // For password protection
  readonly maxFiles?: number; // Maximum files allowed
  readonly maxFileSize: number; // Maximum file size in bytes
  readonly allowedFileTypes: readonly string[]; // File types allowed for upload
  readonly autoCreateFolders: boolean; // Auto-create folders setting
  readonly settings?: {
    readonly allowMultiple?: boolean;
    readonly maxFileSize?: string;
    readonly customMessage?: string;
  };
  readonly brandColor?: HexColor;
}

/**
 * Adapter function to convert database UploadLink to UI LinkData
 * Generates proper URLs and formats dates for display
 */
export const adaptUploadLinkForUI = (uploadLink: UploadLink): LinkData => {
  // Generate proper URL based on link type
  const baseUrl =
    uploadLink.linkType === 'base'
      ? `foldly.io/${uploadLink.slug}`
      : `foldly.io/${uploadLink.slug}/${uploadLink.topic}`;

  // Determine status based on expiry and current state
  const now = new Date();
  const status =
    uploadLink.expiresAt && uploadLink.expiresAt < now
      ? ('expired' as const)
      : ('active' as const); // Default to active for now

  // Format dates for display
  const formatDate = (date: Date) => {
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Generate display name based on link type
  const displayName =
    uploadLink.linkType === 'base'
      ? 'Personal Collection' // Hardcoded name for base links
      : uploadLink.title;

  return {
    id: uploadLink.id,
    name: displayName, // Used by LinkCard component
    title: uploadLink.title, // Keep for compatibility
    slug: uploadLink.slug,
    ...(uploadLink.topic && { topic: uploadLink.topic }),
    linkType: uploadLink.linkType,
    isPublic: uploadLink.isPublic,
    status,
    url: baseUrl,
    uploads: uploadLink.totalUploads,
    views: Math.floor(uploadLink.totalUploads * 2.5), // Mock view count based on uploads
    lastActivity: uploadLink.lastUploadAt
      ? formatDate(uploadLink.lastUploadAt)
      : formatDate(uploadLink.createdAt),
    ...(uploadLink.expiresAt && {
      expiresAt: uploadLink.expiresAt.toLocaleDateString(),
    }),
    createdAt: formatDate(uploadLink.createdAt),
    ...(uploadLink.requireEmail !== undefined && {
      requireEmail: uploadLink.requireEmail,
    }),
    requirePassword: false, // Default to false
    maxFiles: 100, // Default max files
    maxFileSize: uploadLink.maxFileSize,
    allowedFileTypes: uploadLink.allowedFileTypes || [],
    autoCreateFolders: uploadLink.autoCreateFolders || false,
    settings: {
      allowMultiple: true, // Default setting
      maxFileSize: `${Math.round(uploadLink.maxFileSize / (1024 * 1024))}MB`,
      ...(uploadLink.description || uploadLink.instructions
        ? {
            customMessage: uploadLink.description || uploadLink.instructions,
          }
        : {}),
    },
    ...(uploadLink.brandColor && { brandColor: uploadLink.brandColor }),
  };
};

// =============================================================================
// EXPORT ALL LINKS TYPES
// =============================================================================

export * from './database';
export type * from './index';
