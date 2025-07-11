// ===== 2025 FEATURE-BASED COMPONENT ARCHITECTURE =====

// 📋 Modal Components - User Interactions
export { CreateLinkModal } from './components/modals/CreateLinkModal';
export {
  LinkDetailsModal,
  ShareModal,
  SettingsModal,
} from './components/modals';

// 🔧 Section Components - Modular & Reusable
export { LinkInformationSection } from './components/sections/LinkInformationSection';
export { LinkBrandingSection } from './components/sections/LinkBrandingSection';

// 🎴 Card Components - Data Display
export { LinkCard } from './components/cards/LinkCard';
export { LinksOverviewCards } from './components/cards/LinksOverviewCards';

// 🏷️ Indicator Components - Reusable Status & Type Displays
export {
  LinkTypeIcon,
  LinkStatusIndicator,
  LinkVisibilityIndicator,
} from './components/indicators';

// 👁️ View Components - Layout & Container Logic
export { LinksContainer } from './components/containers/LinksContainer';
export { EmptyLinksState } from './components/views/EmptyLinksState';
export { PopulatedLinksState } from './components/views/PopulatedLinksState';
export { LinkStatsGrid } from './components/views/LinkStatsGrid';

// 🎛️ Manager Components - Application State Management
export { LinksModalManager } from './components/managers/LinksModalManager';

// 🪝 Hooks - State Management
// Legacy hooks removed - replaced by store-based composite hooks

// 🏪 Store - Zustand State Management (Simplified)
export { useModalStore, useUIStore } from './store';

// 🔧 Client-Safe Utilities Only - NO server-only database services

// Client-safe constants (all constants are client-safe)
export * from './lib/constants';

// Note: Server-only services (db-service, actions) should be imported directly
// in server components/actions, not exported from main feature index
// Client-side utilities can be imported directly from './lib/utils' when needed

// 📝 Types - Re-export database types as single source of truth
export type {
  Link,
  LinkWithStats,
  LinkInsert,
  LinkUpdate,
  LinkType,
  DatabaseId,
} from '@/lib/supabase/types';
