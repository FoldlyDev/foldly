// Link Upload Feature Database Types - Drizzle Type Inference
// Using proper Drizzle ORM type inference with correct field names from batches schema

import { batches } from '@/lib/database/schemas';

// =============================================================================
// DRIZZLE TYPE INFERENCE - Type-safe database operations
// =============================================================================

/**
 * Upload batch record type inferred from batches table schema
 * Note: Field is 'linkId' not 'uploadLinkId' in the actual schema
 */
export type UploadBatch = typeof batches.$inferSelect;

/**
 * Upload batch input type for insertions inferred from batches table schema
 */
export type CreateUploadBatchInput = typeof batches.$inferInsert;

// =============================================================================
// UTILITY TYPES - For application layer convenience
// =============================================================================

/**
 * Partial update input for upload batches
 */
export type UpdateUploadBatchInput = Partial<CreateUploadBatchInput> & {
  readonly id: string;
};

/**
 * Batch processing statistics (computed type)
 */
export interface BatchStatistics {
  readonly totalBatches: number;
  readonly activeBatches: number;
  readonly completedBatches: number;
  readonly failedBatches: number;
  readonly averageFilesPerBatch: number;
  readonly averageBatchSize: number; // bytes
  readonly processingTimeStats: {
    readonly average: number; // seconds
    readonly min: number;
    readonly max: number;
  };
}
