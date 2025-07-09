// =============================================================================
// ENUM TYPES - Database Enums as TypeScript Types
// =============================================================================
// 🎯 Based on PostgreSQL enums defined in drizzle/schema.ts

/**
 * Link type enumeration
 * Defines the different types of links in the multi-link architecture
 */
export type LinkType = 'base' | 'custom' | 'generated';

/**
 * File processing status enumeration
 * Tracks the processing state of uploaded files
 */
export type FileProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Batch status enumeration
 * Tracks the upload batch processing state
 */
export type BatchStatus = 'uploading' | 'processing' | 'completed' | 'failed';

/**
 * Subscription tier enumeration
 * Defines user subscription levels and features
 */
export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';

// =============================================================================
// ENUM VALIDATION HELPERS - Runtime validation and constants
// =============================================================================

export const LINK_TYPES: readonly LinkType[] = [
  'base',
  'custom',
  'generated',
] as const;

export const FILE_PROCESSING_STATUSES: readonly FileProcessingStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;

export const BATCH_STATUSES: readonly BatchStatus[] = [
  'uploading',
  'processing',
  'completed',
  'failed',
] as const;

export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = [
  'free',
  'pro',
  'business',
  'enterprise',
] as const;

// =============================================================================
// TYPE GUARDS - Runtime type checking functions
// =============================================================================

/**
 * Type guard to check if a value is a valid LinkType
 */
export const isLinkType = (value: unknown): value is LinkType =>
  typeof value === 'string' && LINK_TYPES.includes(value as LinkType);

/**
 * Type guard to check if a value is a valid FileProcessingStatus
 */
export const isFileProcessingStatus = (
  value: unknown
): value is FileProcessingStatus =>
  typeof value === 'string' &&
  FILE_PROCESSING_STATUSES.includes(value as FileProcessingStatus);

/**
 * Type guard to check if a value is a valid BatchStatus
 */
export const isBatchStatus = (value: unknown): value is BatchStatus =>
  typeof value === 'string' && BATCH_STATUSES.includes(value as BatchStatus);

/**
 * Type guard to check if a value is a valid SubscriptionTier
 */
export const isSubscriptionTier = (value: unknown): value is SubscriptionTier =>
  typeof value === 'string' &&
  SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);

// =============================================================================
// ENUM UTILITIES - Helper functions for working with enums
// =============================================================================

/**
 * Get display label for link type
 */
export const getLinkTypeLabel = (linkType: LinkType): string => {
  const labels: Record<LinkType, string> = {
    base: 'Base Link',
    custom: 'Custom Link',
    generated: 'Generated Link',
  };
  return labels[linkType];
};

/**
 * Get display label for processing status
 */
export const getProcessingStatusLabel = (
  status: FileProcessingStatus
): string => {
  const labels: Record<FileProcessingStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status];
};

/**
 * Get display label for batch status
 */
export const getBatchStatusLabel = (status: BatchStatus): string => {
  const labels: Record<BatchStatus, string> = {
    uploading: 'Uploading',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status];
};

/**
 * Get display label for subscription tier
 */
export const getSubscriptionTierLabel = (tier: SubscriptionTier): string => {
  const labels: Record<SubscriptionTier, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return labels[tier];
};

/**
 * Check if status indicates completion (success or failure)
 */
export const isStatusFinal = (
  status: FileProcessingStatus | BatchStatus
): boolean => {
  return status === 'completed' || status === 'failed';
};

/**
 * Check if status indicates active processing
 */
export const isStatusActive = (
  status: FileProcessingStatus | BatchStatus
): boolean => {
  return status === 'processing' || status === 'uploading';
};

/**
 * Get subscription tier features
 */
export const getSubscriptionFeatures = (tier: SubscriptionTier) => {
  const features = {
    free: {
      maxStorageGB: 2,
      maxFileSize: 100, // MB
      maxLinks: 3,
      customBranding: false,
      analytics: false,
      apiAccess: false,
    },
    pro: {
      maxStorageGB: 50,
      maxFileSize: 500, // MB
      maxLinks: 25,
      customBranding: true,
      analytics: true,
      apiAccess: false,
    },
    business: {
      maxStorageGB: 200,
      maxFileSize: 1000, // MB
      maxLinks: 100,
      customBranding: true,
      analytics: true,
      apiAccess: true,
    },
    enterprise: {
      maxStorageGB: 1000,
      maxFileSize: 5000, // MB
      maxLinks: -1, // unlimited
      customBranding: true,
      analytics: true,
      apiAccess: true,
    },
  };

  return features[tier];
};
