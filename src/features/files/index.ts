// Files Feature Exports
// Export files components, hooks, stores, services, and types
// Following 2025 feature-based architecture principles

// Files components
export * from './components';

// Files composite hooks (eliminate prop drilling)
export {
  useFileCardStore,
  useFolderCardStore,
  useFilesListStore,
  useFilesModalsStore,
  useFilesUploadStore,
  useFilesWorkspaceCompositeStore,
} from './hooks';

// Files stores (core Zustand stores)
export {
  useFilesDataStore,
  useFilesUIStore,
  useFilesModalStore,
  useFilesWorkspaceStore,
} from './store';

// Files services
export * from './services';

// Files constants
export * from './constants';

// Files types
export * from './types';
