// ===== 2025 FEATURE-BASED COMPONENT ARCHITECTURE =====

// 📋 Modal Components - User Interactions
export { LinkCreationModal } from './components/modals/link-creation-modal';
export { CreateLinkModal } from './components/modals/create-link-modal';
export { LinksModalManager } from './components/modals/links-modal-manager';
export {
  LinkDetailsModal,
  ShareModal,
  SettingsModal,
} from './components/modals/link-modals';

// 🔧 Section Components - Modular & Reusable
export { LinkInformationSection } from './components/sections/link-information-section';
export { LinkBrandingSection } from './components/sections/link-branding-section';
export { LinkStatsGrid } from './components/sections/link-stats-grid';

// 🎴 Card Components - Data Display
export { LinkCard } from './components/cards/link-card';
export { LinksOverviewCards } from './components/cards/links-overview-cards';

// 🏷️ Indicator Components - Reusable Status & Type Displays
export {
  LinkTypeIcon,
  LinkStatusIndicator,
  LinkVisibilityIndicator,
} from './components/indicators';

// 👁️ View Components - Layout & Container Logic
export { LinksContainer } from './components/views/links-container';
export { EmptyLinksState } from './components/views/empty-links-state';
export { PopulatedLinksState } from './components/views/populated-links-state';

// 🪝 Hooks - State Management
// Legacy hooks removed - replaced by store-based composite hooks

// 🏪 Store - Zustand State Management
export { useLinksStore } from './store/links-store';

// 🔧 Services - Business Logic & API
export * from './services';

// 📝 Types - TypeScript Interfaces
export * from './types';
