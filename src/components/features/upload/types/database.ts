// Upload Feature Database Types - UploadBatch entity
// Following 2025 TypeScript best practices with strict type safety

import type { BaseEntity } from '../../../../types/database-infrastructure';

import type { EmailAddress, LinkId, FolderId } from '../../../../types/ids';

import type { DeepReadonly } from '../../../../types/utils';

import type { BatchStatus } from '../../../files/types';

// =============================================================================
// UPLOAD BATCHES - BATCH PROCESSING SYSTEM
// =============================================================================

/**
 * Upload batch for grouping related files
 */
export interface UploadBatch extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id

  // Uploader information
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly batchName?: string; // Optional custom batch name
  readonly displayName: string; // Auto-generated: "[Name] (Batch) [Date]"

  // Batch metadata
  readonly status: BatchStatus;
  readonly totalFiles: number;
  readonly processedFiles: number;
  readonly failedFiles: number;
  readonly totalSize: number; // bytes

  // Processing information
  readonly uploadStartedAt: Date;
  readonly uploadCompletedAt?: Date;
  readonly processingCompletedAt?: Date;
  readonly estimatedCompletionAt?: Date;

  // Organization
  readonly targetFolderId?: FolderId; // Default destination folder
  readonly autoOrganized: boolean; // Whether files were auto-organized
  readonly organizationRules?: DeepReadonly<Record<string, unknown>>; // JSON rules used
} /**
 * Input type for creating upload batches (Application Layer)
 */
export interface CreateUploadBatchInput {
  readonly uploadLinkId: LinkId;
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly batchName?: string;
  readonly targetFolderId?: FolderId;
}

/**
 * Batch processing statistics
 */
export interface BatchStatistics {
  readonly totalBatches: number;
  readonly activeBatches: number;
  readonly completedBatches: number;
  readonly failedBatches: number;
  readonly averageFilesPerBatch: number;
  readonly averageBatchSize: number; // bytes
  readonly processingTimeStats: DeepReadonly<{
    readonly average: number; // seconds
    readonly min: number;
    readonly max: number;
  }>;
}

// Export all upload database types
export type * from './database';
