// ===== 2025 FEATURE-BASED COMPONENT ARCHITECTURE =====

// 📋 Modal Components - User Interactions
export { CreateLinkModalContainer } from './components/containers/CreateLinkModalContainer';
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

// 🏪 Store - Zustand State Management
export { useLinksStore } from './store/links-store';

// 🔧 Services - Business Logic & API
export * from './services';

// 📝 Types - TypeScript Interfaces
export * from './types';
