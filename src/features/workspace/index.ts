// Workspace feature public API

// Actions
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

// Hooks
export {
  useWorkspaceTree,
  useWorkspaceRealtime,
  useWorkspaceUI,
} from './hooks';

// Components
export {
  WorkspaceTree,
  WorkspaceContainer,
} from './components';