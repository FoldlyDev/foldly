/**
 * Links Feature Store Exports
 * Multiple focused stores following 2025 Zustand architecture patterns
 */

// Store exports
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
} from '@/lib/supabase/types';
export type { DatabaseId } from '@/lib/supabase/types';
