// Files Store Exports
// Export all Zustand stores and selectors
// Following 2025 feature-based architecture principles

// Data store
export * from './files-data-store';

// UI store
export {
  useFilesUIStore,
  VIEW_MODE,
  SORT_BY,
  SORT_ORDER,
  FILTER_STATUS,
  FILTER_TYPE,
  filesUISelectors,
} from './files-ui-store';

// Modal store
export {
  useFilesModalStore,
  MODAL_TYPE,
  UPLOAD_STATUS,
  BULK_ACTION_TYPE,
  OPERATION_TYPE,
  type ModalType,
  type ModalData,
  type UploadStatus,
  type BulkActionType,
  type OperationType,
  type CreateFolderFormData,
  type FileUploadData,
  type MoveFileData,
  type SharePermissions,
  type OrganizeFilesData,
  // Hooks
  useFilesActiveModal,
  useFilesModalOpen,
  useFilesModalSubmitting,
  useFilesModalError,
  useFilesModalState,
  useFilesUploadState,
  useFilesCreateFolderForm,
  useFilesDetailsForm,
  useFilesShareState,
  useFilesMoveForm,
  useFilesOrganizeForm,
  useFilesPreviewState,
  useFilesBulkActionState,
  useFilesValidationErrors,
  useFilesModalActions,
  useIsModalOpen,
  useIsAnyModalOpen,
  useModalData,
  useValidationError,
  useUploadProgress,
  useUploadStatus,
  useUploadError,
  useFilesModalStack,
} from './files-modal-store';

// Workspace store
export * from './files-workspace-store';

// Store utilities
export * from './utils/convert-reducers-to-actions';
