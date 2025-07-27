/**
 * Links Store Index - 2025 Refactored Architecture
 * Exports simplified stores and hooks for links feature
 */

// Core stores
export { useModalStore } from './modal-store';
export { useUIStore } from './ui-store';

// Modal selectors
export { useCurrentModal, useModalData, useModalLoading } from './modal-store';

// UI selectors - Individual properties to prevent infinite loops
export {
  useViewMode,
  useSearchQuery,
  useFilterType,
  useFilterStatus,
  useSortBy,
  useSortDirection,
} from './ui-store';

// Re-export database types for convenience
export type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkType,
  LinkSortField,
  DatabaseId,
} from '@/lib/database/types';
