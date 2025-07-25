// =============================================================================
// WORKSPACE HOOKS - CENTRALIZED EXPORTS
// =============================================================================

// Core workspace hooks
export { useWorkspaceRealtime } from './use-workspace-realtime';
export { useWorkspaceTree } from './use-workspace-tree';
export { useWorkspaceUI } from './use-workspace-ui';

// Tree selection hooks
export {
  useWorkspaceTreeSelection,
  useWorkspaceTreeSelectionSafe,
} from './use-workspace-tree-selection';

// Note: Removed collaboration-specific hooks for MVP simplicity
// These can be added back when needed for advanced features
