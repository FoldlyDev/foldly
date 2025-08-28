// Workspace Feature Exports
// Export workspace components, hooks, and types

// Workspace actions
export {
  fetchWorkspaceDataAction,
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
export { WorkspaceContainer } from './components';

// Workspace hooks
export { useWorkspaceRealtime, useWorkspaceData } from './hooks';

// Workspace services
export * from './lib/services';
