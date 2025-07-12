// ===== 2025 FEATURE-BASED DASHBOARD ARCHITECTURE =====

// 🏗️ Layout Components - Dashboard Structure
export { DashboardNavigation } from '../../components/layout/dashboard-navigation';

// 🔧 Section Components - Modular Dashboard Sections
export { WorkspaceHeader } from './components/sections/workspace-header';
export { AnalyticsCards } from './components/sections/analytics-cards';
export { QuickActions } from './components/sections/quick-actions';
export { WorkspaceSettings } from './components/sections/workspace-settings';
export { WorkspaceOverview } from './components/sections/workspace-overview';

// 👁️ View Components - Layout & Container Logic
export {
  WorkspaceContainer,
  HomeContainer,
} from './components/views/workspace-container';
export { EmptyState } from './components/views/empty-state';
export { WorkspaceTreeView } from './components/views/workspace-tree-view';

// 📝 Types - TypeScript type definitions for workspace UI
export type {
  WorkspaceSettingsProps,
  WorkspaceOverviewProps,
  WorkspaceStatsData,
  WorkspaceQuickAction,
  WorkspaceManagementState,
  WorkspaceEditForm,
  UseWorkspaceManagementOptions,
} from './types/workspace-ui';

// 📚 Lib - Actions, Query Keys, and Utilities
export { workspaceQueryKeys, fetchWorkspaceTreeAction } from './lib';
