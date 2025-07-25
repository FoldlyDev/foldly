// =============================================================================
// POSTGRESQL ENUMS - Database Enum Definitions for Drizzle ORM
// =============================================================================
// 🎯 These define PostgreSQL enums that must be created in the database
// 📚 Based on: https://orm.drizzle.team/docs/sql-schema-declaration
// 📚 Pattern: https://medium.com/@lior_amsalem/enum-with-typescript-zod-and-drizzle-orm-f7449a8b37d5

import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Link type enumeration for multi-link architecture
 * Supports: base (foldly.com/username), custom (foldly.com/username/topic), generated (right-click folder)
 */
export const linkTypeEnum = pgEnum('link_type', [
  'base',
  'custom',
  'generated',
]);

/**
 * File processing status enumeration
 * Tracks the processing state of uploaded files through the security pipeline
 */
export const fileProcessingStatusEnum = pgEnum('file_processing_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

/**
 * Batch status enumeration
 * Tracks the upload batch processing state for grouped file operations
 */
export const batchStatusEnum = pgEnum('batch_status', [
  'uploading',
  'processing',
  'completed',
  'failed',
]);

/**
 * Subscription tier enumeration
 * Defines user subscription levels and feature access in the SaaS model
 */
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'pro',
  'business',
  'enterprise',
]);
