// Analytics Feature Database Types - Access logs and analytics data
// Following 2025 TypeScript best practices with strict type safety

import type {
  BaseEntity,
  EmailAddress,
  LinkId,
  FileId,
  DeepReadonly,
} from '@/types';

import type { AccessType } from './index';

// =============================================================================
// ACCESS LOGS - AUDIT TRAIL SYSTEM
// =============================================================================

/**
 * Link access logging for security and analytics
 */
export interface LinkAccessLog extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id
  readonly fileId?: FileId; // References file_uploads.id for file-specific access

  // Access information
  readonly accessType: AccessType;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly referer?: string;
  readonly country?: string; // GeoIP location
  readonly city?: string; // GeoIP location

  // User context (if authenticated)
  readonly accessorName?: string; // Name provided during access
  readonly accessorEmail?: EmailAddress; // Email if provided

  // Security context
  readonly wasPasswordRequired: boolean;
  readonly passwordAttempts?: number; // Failed attempts before success
  readonly securityFlags?: readonly string[]; // Suspicious activity indicators

  // Session information
  readonly sessionId?: string;
  readonly sessionDuration?: number; // seconds for view/download sessions

  // Metadata
  readonly metadata?: DeepReadonly<Record<string, unknown>>; // Additional context data
} /**
 * Input type for creating access logs (Application Layer)
 */
export interface CreateAccessLogInput {
  readonly uploadLinkId: LinkId;
  readonly fileId?: FileId;
  readonly accessType: AccessType;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly referer?: string;
  readonly accessorName?: string;
  readonly accessorEmail?: EmailAddress;
  readonly wasPasswordRequired?: boolean;
  readonly passwordAttempts?: number;
  readonly securityFlags?: readonly string[];
  readonly sessionId?: string;
  readonly metadata?: DeepReadonly<Record<string, unknown>>;
}

/**
 * Access analytics aggregation
 */
export interface AccessAnalytics {
  readonly totalAccesses: number;
  readonly uniqueVisitors: number;
  readonly topCountries: Array<{
    readonly country: string;
    readonly count: number;
  }>;
  readonly accessTypeDistribution: Record<AccessType, number>;
  readonly suspiciousActivity: {
    readonly flaggedAccesses: number;
    readonly blockedAttempts: number;
    readonly multiplePasswordFailures: number;
  };
  readonly timeDistribution: Array<{
    readonly hour: number;
    readonly count: number;
  }>;
}

/**
 * Dashboard overview aggregation
 */
export interface DashboardOverview {
  readonly totalLinks: number;
  readonly activeLinks: number;
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly recentActivity: Array<{
    readonly type: 'upload' | 'link_created' | 'access';
    readonly description: string;
    readonly timestamp: Date;
    readonly linkId?: LinkId;
    readonly fileId?: FileId;
  }>;
  readonly topLinks: Array<{
    readonly linkId: LinkId;
    readonly title: string;
    readonly uploadCount: number;
    readonly recentActivity: Date;
  }>;
}

// Export all analytics database types
export type * from './database';
