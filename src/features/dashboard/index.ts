// ===== 2025 FEATURE-BASED DASHBOARD ARCHITECTURE =====

// 🏗️ Layout Components - Dashboard Structure
export { DashboardNavigation } from './components/layout/dashboard-navigation';

// 🔧 Section Components - Modular Dashboard Sections
export { DashboardHeader } from './components/sections/dashboard-header';
export { AnalyticsCards } from './components/sections/analytics-cards';
export { QuickActions } from './components/sections/quick-actions';

// 👁️ View Components - Layout & Container Logic
export {
  DashboardContainer,
  HomeContainer,
} from './components/views/dashboard-container';
export { EmptyState } from './components/views/empty-state';
export {
  DashboardLayoutWrapper,
  useNavigationContext,
} from './components/views/dashboard-layout-wrapper';
