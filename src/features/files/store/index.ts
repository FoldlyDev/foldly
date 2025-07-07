// Files Store Exports
// Export all Zustand stores and selectors
// Following 2025 feature-based architecture principles

// Data store
export * from './files-data-store';

// UI store
export {
  useFilesUIStore,
  hasSelection,
  getSelectedCount,
  isFileSelected,
  isFolderSelected,
  isFolderExpanded,
  hasActiveFilters,
  getActiveFiltersCount,
  getCurrentPath,
  canNavigateBack,
  canNavigateForward,
} from './files-ui-store';

// Modal store
export {
  useFilesModalStore,
  type ModalType,
  type ModalData,
  isModalOpen,
  isAnyModalOpen as isAnyFilesModalOpen,
  getTotalUploadProgress,
  getUploadStatusSummary,
  isUploadInProgress,
  isUploadCompleted,
  hasValidationErrors,
  getValidationError,
  canNavigatePreview,
  isBulkActionInProgress,
  isBulkActionCompleted,
  hasBulkActionErrors,
} from './files-modal-store';

// Workspace store
export * from './files-workspace-store';

// Store utilities
export * from './utils/convert-reducers-to-actions';
