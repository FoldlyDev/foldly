// =============================================================================
// BATCH TYPES - Database Batch Entity and Related Types
// =============================================================================
// 🎯 Based on batches table in drizzle/schema.ts

import type {
  DatabaseId,
  TimestampFields,
  WithoutSystemFields,
  PartialBy,
} from './common';
import type { BatchStatus } from './enums';

// =============================================================================
// BASE BATCH TYPES - Direct from database schema
// =============================================================================

/**
 * Batch entity - exact match to database schema
 */
export interface Batch extends TimestampFields {
  id: DatabaseId;
  linkId: DatabaseId;
  userId: DatabaseId;
  folderId: DatabaseId | null;

  // Batch information
  name: string;
  status: BatchStatus;
  totalFiles: number;
  totalSize: number;
  processedFiles: number;
  failedFiles: number;

  // Processing info
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;

  // Metadata
  uploadSessionId: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Batch insert type - for creating new batches
 */
export type BatchInsert = WithoutSystemFields<Batch>;

/**
 * Batch update type - for updating existing batches
 */
export type BatchUpdate = PartialBy<
  Omit<Batch, 'id' | 'linkId' | 'userId' | 'createdAt' | 'updatedAt'>,
  | 'folderId'
  | 'name'
  | 'status'
  | 'totalFiles'
  | 'totalSize'
  | 'processedFiles'
  | 'failedFiles'
  | 'startedAt'
  | 'completedAt'
  | 'errorMessage'
  | 'uploadSessionId'
  | 'metadata'
>;

// =============================================================================
// COMPUTED BATCH TYPES - With calculated fields and relationships
// =============================================================================

/**
 * Batch with files - includes file relationships
 */
export interface BatchWithFiles extends Batch {
  files: Array<{
    id: DatabaseId;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: string;
    uploadedAt: Date;
    processingStartedAt: Date | null;
    processingCompletedAt: Date | null;
    errorMessage: string | null;
  }>;
}

/**
 * Batch summary - condensed info for progress tracking
 */
export interface BatchSummary {
  id: DatabaseId;
  name: string;
  status: BatchStatus;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  successFiles: number;
  progressPercentage: number;
  remainingFiles: number;
  estimatedTimeRemaining: number | null;
  processingSpeed: number; // files per second
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Batch with statistics - includes detailed processing stats
 */
export interface BatchWithStats extends Batch {
  stats: {
    successRate: number;
    failureRate: number;
    averageFileSize: number;
    processingDuration: number | null;
    throughput: number; // bytes per second
    estimatedCompletion: Date | null;
  };
}

// =============================================================================
// BATCH UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * Batch for listing - condensed info for lists
 */
export interface BatchListItem {
  id: DatabaseId;
  name: string;
  status: BatchStatus;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  progressPercentage: number;
  createdAt: Date;
  completedAt: Date | null;
  linkId: DatabaseId;
  userId: DatabaseId;
}

/**
 * Batch progress info - for real-time updates
 */
export interface BatchProgress {
  id: DatabaseId;
  status: BatchStatus;
  processedFiles: number;
  totalFiles: number;
  progressPercentage: number;
  currentFile: string | null;
  estimatedTimeRemaining: number | null;
  processingSpeed: number;
  lastUpdated: Date;
}

/**
 * Batch error info - for error handling
 */
export interface BatchError {
  id: DatabaseId;
  name: string;
  status: BatchStatus;
  errorMessage: string;
  failedFiles: Array<{
    fileName: string;
    errorMessage: string;
    errorCode: string;
  }>;
  createdAt: Date;
  failedAt: Date;
}

// =============================================================================
// BATCH FORM TYPES - For form handling and validation
// =============================================================================

/**
 * Batch creation form data
 */
export interface BatchCreateForm {
  name: string;
  linkId: DatabaseId;
  folderId?: DatabaseId;
  files: File[];
  metadata?: Record<string, unknown>;
}

/**
 * Batch retry form data
 */
export interface BatchRetryForm {
  retryFailedOnly?: boolean;
  newFolderId?: DatabaseId;
}

// =============================================================================
// BATCH VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * Batch validation constraints
 */
export interface BatchValidationConstraints {
  name: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
  totalFiles: {
    min: number;
    max: number;
  };
  totalSize: {
    min: number;
    max: number;
  };
}

/**
 * Batch field validation errors
 */
export interface BatchValidationErrors {
  name?: string[];
  files?: string[];
  totalSize?: string[];
}

// =============================================================================
// BATCH FILTER TYPES - For querying and filtering batches
// =============================================================================

/**
 * Batch filter options
 */
export interface BatchFilterOptions {
  userId?: DatabaseId;
  linkId?: DatabaseId;
  folderId?: DatabaseId;
  status?: BatchStatus | BatchStatus[];
  createdDateRange?: { start: Date; end: Date };
  completedDateRange?: { start: Date; end: Date };
  fileSizeRange?: { min: number; max: number };
  fileCountRange?: { min: number; max: number };
  hasErrors?: boolean;
}

/**
 * Batch sort options
 */
export type BatchSortField =
  | 'name'
  | 'status'
  | 'totalFiles'
  | 'totalSize'
  | 'processedFiles'
  | 'failedFiles'
  | 'createdAt'
  | 'startedAt'
  | 'completedAt';

/**
 * Batch query options
 */
export interface BatchQueryOptions {
  search?: string;
  filters?: BatchFilterOptions;
  sort?: {
    field: BatchSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    files?: boolean;
    stats?: boolean;
  };
}

// =============================================================================
// BATCH HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

/**
 * Calculate batch progress percentage
 */
export const calculateBatchProgress = (
  batch: Pick<Batch, 'processedFiles' | 'totalFiles'>
): number => {
  if (batch.totalFiles === 0) return 0;
  return Math.round((batch.processedFiles / batch.totalFiles) * 100);
};

/**
 * Calculate batch success rate
 */
export const calculateSuccessRate = (
  batch: Pick<Batch, 'processedFiles' | 'failedFiles'>
): number => {
  const totalProcessed = batch.processedFiles + batch.failedFiles;
  if (totalProcessed === 0) return 0;
  return Math.round((batch.processedFiles / totalProcessed) * 100);
};

/**
 * Calculate remaining files
 */
export const calculateRemainingFiles = (
  batch: Pick<Batch, 'totalFiles' | 'processedFiles' | 'failedFiles'>
): number => {
  return batch.totalFiles - batch.processedFiles - batch.failedFiles;
};

/**
 * Calculate processing duration
 */
export const calculateProcessingDuration = (
  batch: Pick<Batch, 'startedAt' | 'completedAt'>
): number | null => {
  if (!batch.startedAt) return null;
  const endTime = batch.completedAt || new Date();
  return endTime.getTime() - batch.startedAt.getTime();
};

/**
 * Calculate processing speed (files per second)
 */
export const calculateProcessingSpeed = (
  batch: Pick<Batch, 'processedFiles' | 'startedAt'>
): number => {
  if (!batch.startedAt || batch.processedFiles === 0) return 0;
  const duration = (new Date().getTime() - batch.startedAt.getTime()) / 1000; // seconds
  return batch.processedFiles / duration;
};

/**
 * Estimate completion time
 */
export const estimateCompletionTime = (
  batch: Pick<
    Batch,
    'processedFiles' | 'totalFiles' | 'failedFiles' | 'startedAt'
  >
): Date | null => {
  if (!batch.startedAt) return null;

  const speed = calculateProcessingSpeed(batch);
  if (speed === 0) return null;

  const remainingFiles = calculateRemainingFiles(batch);
  if (remainingFiles === 0) return new Date();

  const estimatedSeconds = remainingFiles / speed;
  return new Date(Date.now() + estimatedSeconds * 1000);
};

/**
 * Check if batch is active (uploading or processing)
 */
export const isBatchActive = (batch: Pick<Batch, 'status'>): boolean => {
  return batch.status === 'uploading' || batch.status === 'processing';
};

/**
 * Check if batch is completed (success or failed)
 */
export const isBatchCompleted = (batch: Pick<Batch, 'status'>): boolean => {
  return batch.status === 'completed' || batch.status === 'failed';
};

/**
 * Check if batch has errors
 */
export const batchHasErrors = (batch: Pick<Batch, 'failedFiles'>): boolean => {
  return batch.failedFiles > 0;
};

/**
 * Get batch status color
 */
export const getBatchStatusColor = (status: BatchStatus): string => {
  const colors = {
    uploading: '#3b82f6', // blue
    processing: '#f59e0b', // yellow
    completed: '#10b981', // green
    failed: '#ef4444', // red
  };
  return colors[status];
};

/**
 * Format batch duration
 */
export const formatBatchDuration = (durationMs: number): string => {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Generate batch name from files
 */
export const generateBatchName = (files: File[]): string => {
  if (files.length === 1 && files[0]) {
    return files[0].name;
  }
  return `Batch upload (${files.length} files)`;
};
