// Database Infrastructure Types - Generic database patterns and utilities
// Standard database operations and query patterns for all features
// Following 2025 TypeScript best practices with strict type safety

import type { UserId } from './ids';

// =============================================================================
// DATABASE ENTITY PATTERNS
// =============================================================================

/**
 * Standard timestamp fields for all database entities
 */
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Optional soft delete timestamp
 */
export interface SoftDelete {
  readonly deletedAt?: Date;
}

/**
 * Standard ID field using UUID
 */
export interface WithId {
  readonly id: string; // UUID
}

/**
 * User reference field for entity ownership
 */
export interface WithUserId {
  readonly userId: UserId;
}

/**
 * Base entity combining all common database fields
 */
export type BaseEntity = WithId & WithUserId & Timestamps;

// =============================================================================
// SUPABASE GENERATED TYPES SUPPORT (2025 BEST PRACTICE)
// =============================================================================

/**
 * Generated database types from Supabase CLI
 * Run: npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database/generated.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Generic database schema structure
 * Features should extend this with their specific tables
 */
export interface DatabaseSchema {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      }
    >;
    Views: Record<
      string,
      {
        Row: Record<string, unknown>;
      }
    >;
    Functions: Record<
      string,
      {
        Args: Record<string, unknown>;
        Returns: unknown;
      }
    >;
  };
}

// =============================================================================
// UTILITY TYPES FOR DATABASE OPERATIONS (2025 PATTERNS)
// =============================================================================

/**
 * Utility type for making certain fields required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Utility type for database queries with filters
 */
export interface DatabaseQuery<T> {
  readonly filters?: Partial<T>;
  readonly orderBy?: Array<{
    readonly field: keyof T;
    readonly ascending?: boolean;
  }>;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Result type for database operations
 */
export type DatabaseResult<T> =
  | { success: true; data: T; count?: number }
  | { success: false; error: string; details?: unknown };

/**
 * Paginated database result
 */
export interface PaginatedDatabaseResult<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
  };
}

/**
 * Database relationship loading options
 */
export type RelationshipLoad<T> = {
  readonly [K in keyof T]?: T[K] extends (infer U)[]
    ? boolean | RelationshipLoad<U>
    : T[K] extends object
      ? boolean | RelationshipLoad<T[K]>
      : boolean;
};

/**
 * Generic database client interface
 * Features should extend this with their specific operations
 */
export interface DatabaseClient {
  readonly query: <T>(
    sql: string,
    params?: unknown[]
  ) => Promise<DatabaseResult<T[]>>;
  readonly queryOne: <T>(
    sql: string,
    params?: unknown[]
  ) => Promise<DatabaseResult<T | null>>;
  readonly execute: (
    sql: string,
    params?: unknown[]
  ) => Promise<DatabaseResult<void>>;
}

// =============================================================================
// MIGRATION AND VERSIONING SUPPORT
// =============================================================================

/**
 * Database schema version for migrations
 */
export interface SchemaVersion {
  readonly version: string;
  readonly appliedAt: Date;
  readonly description: string;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  readonly currentVersion: string;
  readonly pendingMigrations: readonly string[];
  readonly lastMigration?: SchemaVersion;
}
