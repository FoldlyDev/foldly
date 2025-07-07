// Query Infrastructure Types - Generic data query patterns
// Standard sorting and filtering for all data operations
// Following 2025 TypeScript best practices with strict type safety

// =============================================================================
// DATA QUERY PATTERNS
// =============================================================================

/**
 * Generic sorting options for data queries
 */
export interface SortOptions {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
  readonly nullsLast?: boolean;
}

/**
 * Generic filter criteria for data queries
 */
export interface FilterCriteria {
  readonly field: string;
  readonly operator:
    | 'eq'
    | 'ne'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'in'
    | 'like'
    | 'between';
  readonly value: unknown;
}
