// =============================================================================
// WORKSPACE FEATURE - Public API
// =============================================================================

// Actions
export {
  getWorkspaceByUserId,
  updateWorkspaceAction,
  fetchWorkspaceTreeAction,
  fetchWorkspaceStatsAction,
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
  renameFileAction,
  deleteFileAction,
  moveFileAction,
  downloadFileAction,
  type WorkspaceTreeData,
} from './lib/actions';

// Hooks
export {
  useWorkspaceTree,
  useWorkspaceRealtime,
  useWorkspaceUI,
  useWorkspaceTreeSelection,
  useWorkspaceTreeSelectionSafe,
} from './hooks';

// Components
export {
  WorkspaceTree,
  WorkspaceTreeSelectionProvider,
  WorkspaceToolbar,
  WorkspaceContainer,
} from './components';
