// Workspace Feature Exports
// Export workspace components, hooks, and types

// Workspace actions
export {
  fetchWorkspaceTreeAction,
  moveItemAction,
  updateItemOrderAction,
  batchMoveItemsAction,
  batchDeleteItemsAction,
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
  renameFileAction,
  deleteFileAction,
  downloadFileAction,
  type ActionResult,
} from './lib/actions';

// Workspace components
export {
  WorkspaceTree,
  WorkspaceContainer,
} from './components';

// Workspace hooks
export {
  useWorkspaceTree,
  useWorkspaceRealtime,
  useWorkspaceUI,
} from './hooks';

// Workspace services
export * from './services';