// Files Modal Store - Modal State Management
// Zustand store for modal coordination and data
// Following 2025 TypeScript best practices with pure reducers

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  FileData,
  FolderData,
  FileId,
  FolderId,
  CreateFolderFormData,
  FileUploadData,
  MoveFileData,
  OrganizeFilesData,
} from '../types';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';

// =============================================================================
// MODAL TYPES
// =============================================================================

export type ModalType =
  | 'upload'
  | 'createFolder'
  | 'fileDetails'
  | 'folderDetails'
  | 'share'
  | 'move'
  | 'copy'
  | 'rename'
  | 'delete'
  | 'organize'
  | 'settings'
  | 'preview'
  | 'bulkActions'
  | null;

export interface ModalData {
  readonly fileData?: FileData | null;
  readonly folderData?: FolderData | null;
  readonly selectedFileIds?: FileId[];
  readonly selectedFolderIds?: FolderId[];
  readonly targetFolderId?: FolderId | null;
  readonly formData?: Record<string, any>;
  readonly metadata?: Record<string, any>;
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface FilesModalState {
  // Current modal
  readonly activeModal: ModalType;
  readonly modalData: ModalData;
  readonly isModalOpen: boolean;

  // Modal stack for nested modals
  readonly modalStack: Array<{ type: ModalType; data: ModalData }>;

  // Form states
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly validationErrors: Record<string, string>;

  // Upload modal specific
  readonly uploadProgress: Record<string, number>;
  readonly uploadStatus: Record<
    string,
    'pending' | 'uploading' | 'completed' | 'failed'
  >;
  readonly uploadErrors: Record<string, string>;

  // Create folder modal specific
  readonly createFolderFormData: CreateFolderFormData;

  // File details modal specific
  readonly isEditingDetails: boolean;
  readonly detailsFormData: Partial<FileData>;

  // Share modal specific
  readonly shareLink: string | null;
  readonly sharePermissions: {
    readonly canView: boolean;
    readonly canEdit: boolean;
    readonly canDownload: boolean;
    readonly expiresAt: Date | null;
  };

  // Move/Copy modal specific
  readonly moveFormData: MoveFileData;
  readonly availableFolders: FolderData[];

  // Organize modal specific
  readonly organizeFormData: OrganizeFilesData;
  readonly previewChanges: boolean;

  // Preview modal specific
  readonly previewFile: FileData | null;
  readonly previewIndex: number;
  readonly previewFiles: FileData[];

  // Bulk actions modal specific
  readonly bulkActionType: 'move' | 'copy' | 'delete' | 'tag' | 'share' | null;
  readonly bulkActionProgress: number;
  readonly bulkActionErrors: string[];
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FilesModalState = {
  // Current modal
  activeModal: null,
  modalData: {},
  isModalOpen: false,

  // Modal stack
  modalStack: [],

  // Form states
  isSubmitting: false,
  submitError: null,
  validationErrors: {},

  // Upload modal specific
  uploadProgress: {},
  uploadStatus: {},
  uploadErrors: {},

  // Create folder modal specific
  createFolderFormData: {
    name: '',
    color: 'blue',
    description: '',
    parentId: null,
  },

  // File details modal specific
  isEditingDetails: false,
  detailsFormData: {},

  // Share modal specific
  shareLink: null,
  sharePermissions: {
    canView: true,
    canEdit: false,
    canDownload: true,
    expiresAt: null,
  },

  // Move/Copy modal specific
  moveFormData: {
    itemIds: [],
    targetFolderId: null,
    operation: 'move',
    createCopy: false,
    overwriteExisting: false,
  },
  availableFolders: [],

  // Organize modal specific
  organizeFormData: {
    files: [],
    folders: [],
    operations: [],
  },
  previewChanges: false,

  // Preview modal specific
  previewFile: null,
  previewIndex: 0,
  previewFiles: [],

  // Bulk actions modal specific
  bulkActionType: null,
  bulkActionProgress: 0,
  bulkActionErrors: [],
};

// =============================================================================
// PURE REDUCERS
// =============================================================================

const modalReducers = createReducers<
  FilesModalState,
  {
    // Modal management
    openModal: (
      state: FilesModalState,
      type: ModalType,
      data?: ModalData
    ) => FilesModalState;
    closeModal: (state: FilesModalState) => FilesModalState;
    closeAllModals: (state: FilesModalState) => FilesModalState;
    pushModal: (
      state: FilesModalState,
      type: ModalType,
      data?: ModalData
    ) => FilesModalState;
    popModal: (state: FilesModalState) => FilesModalState;
    updateModalData: (
      state: FilesModalState,
      data: Partial<ModalData>
    ) => FilesModalState;

    // Form states
    setSubmitting: (
      state: FilesModalState,
      submitting: boolean
    ) => FilesModalState;
    setSubmitError: (
      state: FilesModalState,
      error: string | null
    ) => FilesModalState;
    setValidationErrors: (
      state: FilesModalState,
      errors: Record<string, string>
    ) => FilesModalState;
    clearValidationErrors: (state: FilesModalState) => FilesModalState;

    // Upload modal
    setUploadProgress: (
      state: FilesModalState,
      fileId: string,
      progress: number
    ) => FilesModalState;
    setUploadStatus: (
      state: FilesModalState,
      fileId: string,
      status: 'pending' | 'uploading' | 'completed' | 'failed'
    ) => FilesModalState;
    setUploadError: (
      state: FilesModalState,
      fileId: string,
      error: string
    ) => FilesModalState;
    clearUploadData: (state: FilesModalState) => FilesModalState;

    // Create folder modal
    updateCreateFolderForm: (
      state: FilesModalState,
      data: Partial<CreateFolderFormData>
    ) => FilesModalState;
    resetCreateFolderForm: (state: FilesModalState) => FilesModalState;

    // File details modal
    setEditingDetails: (
      state: FilesModalState,
      editing: boolean
    ) => FilesModalState;
    updateDetailsForm: (
      state: FilesModalState,
      data: Partial<FileData>
    ) => FilesModalState;
    resetDetailsForm: (state: FilesModalState) => FilesModalState;

    // Share modal
    setShareLink: (
      state: FilesModalState,
      link: string | null
    ) => FilesModalState;
    updateSharePermissions: (
      state: FilesModalState,
      permissions: Partial<FilesModalState['sharePermissions']>
    ) => FilesModalState;
    resetShareData: (state: FilesModalState) => FilesModalState;

    // Move/Copy modal
    updateMoveForm: (
      state: FilesModalState,
      data: Partial<MoveFileData>
    ) => FilesModalState;
    setAvailableFolders: (
      state: FilesModalState,
      folders: FolderData[]
    ) => FilesModalState;
    resetMoveForm: (state: FilesModalState) => FilesModalState;

    // Organize modal
    updateOrganizeForm: (
      state: FilesModalState,
      data: Partial<OrganizeFilesData>
    ) => FilesModalState;
    setPreviewChanges: (
      state: FilesModalState,
      preview: boolean
    ) => FilesModalState;
    resetOrganizeForm: (state: FilesModalState) => FilesModalState;

    // Preview modal
    setPreviewFile: (
      state: FilesModalState,
      file: FileData | null,
      files?: FileData[],
      index?: number
    ) => FilesModalState;
    setPreviewIndex: (state: FilesModalState, index: number) => FilesModalState;
    navigatePreview: (
      state: FilesModalState,
      direction: 'next' | 'prev'
    ) => FilesModalState;

    // Bulk actions modal
    setBulkActionType: (
      state: FilesModalState,
      type: 'move' | 'copy' | 'delete' | 'tag' | 'share' | null
    ) => FilesModalState;
    setBulkActionProgress: (
      state: FilesModalState,
      progress: number
    ) => FilesModalState;
    addBulkActionError: (
      state: FilesModalState,
      error: string
    ) => FilesModalState;
    clearBulkActionErrors: (state: FilesModalState) => FilesModalState;
    resetBulkAction: (state: FilesModalState) => FilesModalState;
  }
>({
  // Modal management
  openModal: (state, type, data = {}) => ({
    ...state,
    activeModal: type,
    modalData: data,
    isModalOpen: true,
    submitError: null,
    validationErrors: {},
  }),

  closeModal: state => ({
    ...state,
    activeModal: null,
    modalData: {},
    isModalOpen: false,
    isSubmitting: false,
    submitError: null,
    validationErrors: {},
  }),

  closeAllModals: state => ({
    ...state,
    activeModal: null,
    modalData: {},
    isModalOpen: false,
    modalStack: [],
    isSubmitting: false,
    submitError: null,
    validationErrors: {},
  }),

  pushModal: (state, type, data = {}) => ({
    ...state,
    modalStack: [
      ...state.modalStack,
      { type: state.activeModal, data: state.modalData },
    ],
    activeModal: type,
    modalData: data,
    isModalOpen: true,
    submitError: null,
    validationErrors: {},
  }),

  popModal: state => {
    const lastModal = state.modalStack[state.modalStack.length - 1];

    if (!lastModal) {
      return {
        ...state,
        activeModal: null,
        modalData: {},
        isModalOpen: false,
        modalStack: [],
      };
    }

    return {
      ...state,
      activeModal: lastModal.type,
      modalData: lastModal.data,
      modalStack: state.modalStack.slice(0, -1),
      submitError: null,
      validationErrors: {},
    };
  },

  updateModalData: (state, data) => ({
    ...state,
    modalData: {
      ...state.modalData,
      ...data,
    },
  }),

  // Form states
  setSubmitting: (state, submitting) => ({
    ...state,
    isSubmitting: submitting,
  }),

  setSubmitError: (state, error) => ({
    ...state,
    submitError: error,
    isSubmitting: false,
  }),

  setValidationErrors: (state, errors) => ({
    ...state,
    validationErrors: errors,
  }),

  clearValidationErrors: state => ({
    ...state,
    validationErrors: {},
  }),

  // Upload modal
  setUploadProgress: (state, fileId, progress) => ({
    ...state,
    uploadProgress: {
      ...state.uploadProgress,
      [fileId]: progress,
    },
  }),

  setUploadStatus: (state, fileId, status) => ({
    ...state,
    uploadStatus: {
      ...state.uploadStatus,
      [fileId]: status,
    },
  }),

  setUploadError: (state, fileId, error) => ({
    ...state,
    uploadErrors: {
      ...state.uploadErrors,
      [fileId]: error,
    },
  }),

  clearUploadData: state => ({
    ...state,
    uploadProgress: {},
    uploadStatus: {},
    uploadErrors: {},
  }),

  // Create folder modal
  updateCreateFolderForm: (state, data) => ({
    ...state,
    createFolderFormData: {
      ...state.createFolderFormData,
      ...data,
    },
  }),

  resetCreateFolderForm: state => ({
    ...state,
    createFolderFormData: {
      name: '',
      color: 'blue',
      description: '',
      parentId: null,
    },
  }),

  // File details modal
  setEditingDetails: (state, editing) => ({
    ...state,
    isEditingDetails: editing,
  }),

  updateDetailsForm: (state, data) => ({
    ...state,
    detailsFormData: {
      ...state.detailsFormData,
      ...data,
    },
  }),

  resetDetailsForm: state => ({
    ...state,
    detailsFormData: {},
    isEditingDetails: false,
  }),

  // Share modal
  setShareLink: (state, link) => ({
    ...state,
    shareLink: link,
  }),

  updateSharePermissions: (state, permissions) => ({
    ...state,
    sharePermissions: {
      ...state.sharePermissions,
      ...permissions,
    },
  }),

  resetShareData: state => ({
    ...state,
    shareLink: null,
    sharePermissions: {
      canView: true,
      canEdit: false,
      canDownload: true,
      expiresAt: null,
    },
  }),

  // Move/Copy modal
  updateMoveForm: (state, data) => ({
    ...state,
    moveFormData: {
      ...state.moveFormData,
      ...data,
    },
  }),

  setAvailableFolders: (state, folders) => ({
    ...state,
    availableFolders: folders,
  }),

  resetMoveForm: state => ({
    ...state,
    moveFormData: {
      itemIds: [],
      targetFolderId: null,
      operation: 'move',
      createCopy: false,
      overwriteExisting: false,
    },
    availableFolders: [],
  }),

  // Organize modal
  updateOrganizeForm: (state, data) => ({
    ...state,
    organizeFormData: {
      ...state.organizeFormData,
      ...data,
    },
  }),

  setPreviewChanges: (state, preview) => ({
    ...state,
    previewChanges: preview,
  }),

  resetOrganizeForm: state => ({
    ...state,
    organizeFormData: {
      files: [],
      folders: [],
      operations: [],
    },
    previewChanges: false,
  }),

  // Preview modal
  setPreviewFile: (state, file, files = [], index = 0) => ({
    ...state,
    previewFile: file,
    previewFiles: files,
    previewIndex: index,
  }),

  setPreviewIndex: (state, index) => ({
    ...state,
    previewIndex: Math.max(0, Math.min(index, state.previewFiles.length - 1)),
    previewFile: state.previewFiles[index] || null,
  }),

  navigatePreview: (state, direction) => {
    const newIndex =
      direction === 'next'
        ? Math.min(state.previewIndex + 1, state.previewFiles.length - 1)
        : Math.max(state.previewIndex - 1, 0);

    return {
      ...state,
      previewIndex: newIndex,
      previewFile: state.previewFiles[newIndex] || null,
    };
  },

  // Bulk actions modal
  setBulkActionType: (state, type) => ({
    ...state,
    bulkActionType: type,
    bulkActionProgress: 0,
    bulkActionErrors: [],
  }),

  setBulkActionProgress: (state, progress) => ({
    ...state,
    bulkActionProgress: Math.max(0, Math.min(100, progress)),
  }),

  addBulkActionError: (state, error) => ({
    ...state,
    bulkActionErrors: [...state.bulkActionErrors, error],
  }),

  clearBulkActionErrors: state => ({
    ...state,
    bulkActionErrors: [],
  }),

  resetBulkAction: state => ({
    ...state,
    bulkActionType: null,
    bulkActionProgress: 0,
    bulkActionErrors: [],
  }),
});

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesModalStore = create<
  FilesModalState &
    ReturnType<
      typeof convertReducersToActions<FilesModalState, typeof modalReducers>
    >
>()(
  devtools(
    set => ({
      ...initialState,
      ...convertReducersToActions(set, modalReducers),
    }),
    {
      name: 'files-modal-store',
    }
  )
);

// =============================================================================
// COMPUTED SELECTORS
// =============================================================================

/**
 * Check if a specific modal is open
 */
export const isModalOpen = (
  state: FilesModalState,
  type: ModalType
): boolean => {
  return state.isModalOpen && state.activeModal === type;
};

/**
 * Check if any modal is open
 */
export const isAnyModalOpen = (state: FilesModalState): boolean => {
  return state.isModalOpen && state.activeModal !== null;
};

/**
 * Get total upload progress (average of all files)
 */
export const getTotalUploadProgress = (state: FilesModalState): number => {
  const progressValues = Object.values(state.uploadProgress);
  if (progressValues.length === 0) return 0;

  const total = progressValues.reduce((sum, progress) => sum + progress, 0);
  return Math.round(total / progressValues.length);
};

/**
 * Get upload status summary
 */
export const getUploadStatusSummary = (state: FilesModalState) => {
  const statuses = Object.values(state.uploadStatus);
  const total = statuses.length;

  return {
    total,
    pending: statuses.filter(s => s === 'pending').length,
    uploading: statuses.filter(s => s === 'uploading').length,
    completed: statuses.filter(s => s === 'completed').length,
    failed: statuses.filter(s => s === 'failed').length,
  };
};

/**
 * Check if upload is in progress
 */
export const isUploadInProgress = (state: FilesModalState): boolean => {
  return Object.values(state.uploadStatus).some(
    status => status === 'uploading'
  );
};

/**
 * Check if upload is completed
 */
export const isUploadCompleted = (state: FilesModalState): boolean => {
  const statuses = Object.values(state.uploadStatus);
  return (
    statuses.length > 0 &&
    statuses.every(status => status === 'completed' || status === 'failed')
  );
};

/**
 * Check if form has validation errors
 */
export const hasValidationErrors = (state: FilesModalState): boolean => {
  return Object.keys(state.validationErrors).length > 0;
};

/**
 * Get validation error for specific field
 */
export const getValidationError = (
  state: FilesModalState,
  field: string
): string | null => {
  return state.validationErrors[field] || null;
};

/**
 * Check if can navigate preview
 */
export const canNavigatePreview = (state: FilesModalState) => {
  return {
    canGoPrev: state.previewIndex > 0,
    canGoNext: state.previewIndex < state.previewFiles.length - 1,
    total: state.previewFiles.length,
    current: state.previewIndex + 1,
  };
};

/**
 * Check if bulk action is in progress
 */
export const isBulkActionInProgress = (state: FilesModalState): boolean => {
  return (
    state.bulkActionType !== null &&
    state.bulkActionProgress > 0 &&
    state.bulkActionProgress < 100
  );
};

/**
 * Check if bulk action is completed
 */
export const isBulkActionCompleted = (state: FilesModalState): boolean => {
  return state.bulkActionProgress === 100;
};

/**
 * Check if bulk action has errors
 */
export const hasBulkActionErrors = (state: FilesModalState): boolean => {
  return state.bulkActionErrors.length > 0;
};
