/**
 * Links Feature Store Exports
 * Multiple focused stores following 2025 Zustand architecture patterns
 */

// Main store exports
export {
  useLinksStore,
  // Selector hooks
  useLinksData,
  useLinksLoading,
  useLinksError,
  useLinksSearchQuery,
  useLinksFilter,
  useLinksViewMode,
  useLinksSelectedIds,
  useIsCreateModalOpen,
  // Composite selectors
  useLinksUIState,
  useLinksSelection,
  useLinksModalState,
  useLinksActions,
  useFilteredLinks,
  useLinksPagination,
  // Constants
  VIEW_MODE,
  LINK_FILTER,
  SORT_OPTION,
} from './links-store';

// Focused store exports
export { useLinksDataStore, linksDataSelectors } from './links-data-store';
export { useLinksUIStore, linksUISelectors } from './links-ui-store';
export { useLinksModalStore, linksModalSelectors } from './links-modal-store';

// Utility exports
export {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
export type { Reducer } from './utils/convert-reducers-to-actions';

// Re-export types for convenience
export type {
  Link,
  LinkWithStats,
  LinkInsert,
  LinkUpdate,
  LinkType,
  LinkSortField,
} from '@/lib/supabase/types';
export type { DatabaseId, DatabaseResult } from '@/lib/supabase/types';
