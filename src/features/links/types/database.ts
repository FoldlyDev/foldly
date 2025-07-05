// Links Feature Database Types - UploadLink and LinkSummary entities
// Following 2025 TypeScript best practices with strict type safety

import type { BaseEntity } from '@/types/database-infrastructure';

import type { HexColor, EmailAddress, LinkId, FolderId } from '@/types';

import type { DeepReadonly } from '@/types/utils';

import type { LinkType } from './index';

// =============================================================================
// UPLOAD LINKS - CORE ENTITY
// =============================================================================

/**
 * Enhanced upload links with multi-type support
 * Supports base links (/username), custom topic links (/username/topic), and generated links
 */
export interface UploadLink extends BaseEntity {
  // Link identification and routing
  readonly slug: string; // username part (base for both link types)
  readonly topic?: string; // NULL for base links, topic name for custom links
  readonly title: string;
  readonly description?: string;
  readonly instructions?: string; // Custom instructions for uploaders

  // Link type and behavior
  readonly linkType: LinkType;
  readonly autoCreateFolders: boolean;
  readonly defaultFolderId?: FolderId; // References folders.id

  // Security controls (recipient-managed)
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly passwordHash?: string; // bcrypt hash if password required
  readonly isPublic: boolean; // visibility control
  readonly allowFolderCreation: boolean; // uploader can create folders  // File and upload limits
  readonly maxFiles: number;
  readonly maxFileSize: number; // bytes
  readonly allowedFileTypes?: readonly string[]; // MIME type restrictions
  readonly expiresAt?: Date;

  // Branding and customization (primarily for base links)
  readonly brandingEnabled: boolean;
  readonly brandColor?: HexColor; // Primary brand color
  readonly accentColor?: HexColor; // Secondary/accent brand color
  readonly logoUrl?: string; // Custom logo URL
  readonly customCss?: string; // Custom CSS for advanced styling
  readonly welcomeMessage?: string; // Custom welcome message for uploaders

  // Usage tracking
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number; // bytes
  readonly lastUploadAt?: Date;
}

/**
 * Input type for creating upload links (Application Layer)
 */
export interface CreateUploadLinkInput {
  readonly slug: string;
  readonly topic?: string;
  readonly title: string;
  readonly description?: string;
  readonly instructions?: string;
  readonly linkType?: LinkType;
  readonly autoCreateFolders?: boolean;
  readonly defaultFolderId?: FolderId;
  readonly requireEmail?: boolean;
  readonly requirePassword?: boolean;
  readonly password?: string; // Will be hashed
  readonly isPublic?: boolean;
  readonly allowFolderCreation?: boolean;
  readonly maxFiles?: number;
  readonly maxFileSize?: number;
  readonly allowedFileTypes?: readonly string[];
  readonly expiresAt?: Date;
  readonly brandingEnabled?: boolean;
  readonly brandColor?: HexColor;
  readonly accentColor?: HexColor;
  readonly logoUrl?: string;
  readonly customCss?: string;
  readonly welcomeMessage?: string;
}

/**
 * Simplified input type for creating base links specifically
 */
export interface CreateBaseLinkInput {
  readonly username: string; // Used for slug
  readonly title?: string; // Optional since base links have hardcoded title
  readonly description?: string;
  readonly requireEmail?: boolean;
  readonly requirePassword?: boolean; // Password protection toggle
  readonly password?: string; // Password if required (will be hashed)
  readonly isPublic?: boolean; // Public/Private visibility
  readonly maxFiles?: number;
  readonly expiresAt?: Date; // Optional expiration date
  readonly brandingEnabled?: boolean;
  readonly brandColor?: HexColor;
  readonly accentColor?: HexColor;
  readonly logoUrl?: string;
  readonly customCss?: string;
}

/**
 * Input type for updating upload links (Application Layer)
 */
export interface UpdateUploadLinkInput extends Partial<CreateUploadLinkInput> {
  readonly id: LinkId;
}

/**
 * Comprehensive link summary with analytics
 */
export interface LinkSummary extends UploadLink {
  readonly recentUploads: Array<{
    readonly id: string;
    readonly fileName: string;
    readonly uploaderName: string;
    readonly uploadedAt: Date;
  }>;
  readonly topUploaders: Array<{
    readonly name: string;
    readonly email?: EmailAddress;
    readonly uploadCount: number;
    readonly totalSize: number;
  }>;
  readonly securityMetrics: {
    readonly totalAccesses: number;
    readonly uniqueVisitors: number;
    readonly failedPasswordAttempts: number;
    readonly suspiciousActivity: number;
  };
}

// Export all links database types
export type * from './database';
