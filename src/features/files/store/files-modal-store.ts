'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools } from 'zustand/middleware';
import { useMemo, useCallback } from 'react';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import type { FileId, FolderId } from '@/types';
import type { FileUpload, Folder } from '../types/database';

// Type aliases for consistency
export type FileData = FileUpload;
export type FolderData = Folder;

// ===== 2025 ZUSTAND BEST PRACTICES =====
// ✅ Pure reducers pattern for modal state only
// ✅ No destructuring in selectors (prevents unnecessary re-renders)
// ✅ Use useShallow for multiple values
// ✅ Branded types for type safety
// ✅ Focused on modal concerns only

// ===== CONSTANTS =====
export const MODAL_TYPE = {
  UPLOAD: 'upload',
  CREATE_FOLDER: 'createFolder',
  FILE_DETAILS: 'fileDetails',
  FOLDER_DETAILS: 'folderDetails',
  SHARE: 'share',
  MOVE: 'move',
  COPY: 'copy',
  RENAME: 'rename',
  DELETE: 'delete',
  ORGANIZE: 'organize',
  SETTINGS: 'settings',
  PREVIEW: 'preview',
  BULK_ACTIONS: 'bulkActions',
} as const satisfies Record<string, string>;

export type ModalType = (typeof MODAL_TYPE)[keyof typeof MODAL_TYPE] | null;

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const satisfies Record<string, string>;

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export const BULK_ACTION_TYPE = {
  MOVE: 'move',
  COPY: 'copy',
  DELETE: 'delete',
  TAG: 'tag',
  SHARE: 'share',
} as const satisfies Record<string, string>;

export type BulkActionType =
  | (typeof BULK_ACTION_TYPE)[keyof typeof BULK_ACTION_TYPE]
  | null;

// Folder colors removed for MVP simplification

export const OPERATION_TYPE = {
  MOVE: 'move',
  COPY: 'copy',
} as const satisfies Record<string, string>;

export type OperationType =
  (typeof OPERATION_TYPE)[keyof typeof OPERATION_TYPE];

// ===== FORM DATA TYPES - Simplified for MVP =====
export interface CreateFolderFormData {
  readonly name: string;
  readonly parentId: FolderId | null;
}

export interface FileUploadData {
  readonly files: File[];
  readonly targetFolderId: FolderId | null;
  readonly overwriteExisting: boolean;
}

export interface MoveFileData {
  readonly itemIds: string[];
  readonly targetFolderId: FolderId | null;
  readonly operation: OperationType;
  readonly createCopy: boolean;
  readonly overwriteExisting: boolean;
}

export interface SharePermissions {
  readonly canView: boolean;
  readonly canEdit: boolean;
  readonly canDownload: boolean;
  readonly expiresAt: Date | null;
}

export interface OrganizeFilesData {
  readonly files: FileData[];
  readonly folders: FolderData[];
  readonly operations: Array<{
    readonly type: 'move' | 'copy' | 'delete';
    readonly itemId: string;
    readonly targetId?: string;
  }>;
}

export interface ModalData {
  readonly fileData?: FileData | null;
  readonly folderData?: FolderData | null;
  readonly selectedFileIds?: readonly FileId[];
  readonly selectedFolderIds?: readonly FolderId[];
  readonly targetFolderId?: FolderId | null;
  readonly formData?: Record<string, any>;
  readonly metadata?: Record<string, any>;
}

// ===== STORE STATE =====
export interface FilesModalState {
  // Current modal
  readonly activeModal: ModalType;
  readonly modalData: ModalData;
  readonly isModalOpen: boolean;

  // Modal stack for nested modals
  modalStack: Array<{ type: ModalType; data: ModalData }>;

  // Form states
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly validationErrors: Record<string, string>;

  // Upload modal specific
  readonly uploadProgress: Record<string, number>;
  readonly uploadStatus: Record<string, UploadStatus>;
  readonly uploadErrors: Record<string, string>;
  readonly uploadFormData: FileUploadData;

  // Create folder modal specific
  readonly createFolderFormData: CreateFolderFormData;

  // File details modal specific
  readonly isEditingDetails: boolean;
  readonly detailsFormData: Partial<FileData>;

  // Share modal specific
  readonly shareLink: string | null;
  readonly sharePermissions: SharePermissions;

  // Move/Copy modal specific
  readonly moveFormData: MoveFileData;
  readonly availableFolders: readonly FolderData[];

  // Organize modal specific
  readonly organizeFormData: OrganizeFilesData;
  readonly previewChanges: boolean;

  // Preview modal specific
  readonly previewFile: FileData | null;
  readonly previewIndex: number;
  readonly previewFiles: readonly FileData[];

  // Bulk actions modal specific
  readonly bulkActionType: BulkActionType;
  readonly bulkActionProgress: number;
  readonly bulkActionErrors: readonly string[];
}

// ===== STORE ACTIONS =====
export interface FilesModalActions {
  // Modal management
  readonly openModal: (type: ModalType, data?: ModalData) => void;
  readonly closeModal: () => void;
  readonly closeAllModals: () => void;
  readonly pushModal: (type: ModalType, data?: ModalData) => void;
  readonly popModal: () => void;
  readonly updateModalData: (data: Partial<ModalData>) => void;

  // Form states
  readonly setSubmitting: (submitting: boolean) => void;
  readonly setSubmitError: (error: string | null) => void;
  readonly setValidationErrors: (errors: Record<string, string>) => void;
  readonly clearValidationErrors: () => void;

  // Upload modal
  readonly updateUploadFormData: (data: Partial<FileUploadData>) => void;
  readonly setUploadProgress: (fileId: string, progress: number) => void;
  readonly setUploadStatus: (fileId: string, status: UploadStatus) => void;
  readonly setUploadError: (fileId: string, error: string) => void;
  readonly clearUploadData: () => void;

  // Create folder modal
  readonly updateCreateFolderForm: (
    data: Partial<CreateFolderFormData>
  ) => void;
  readonly resetCreateFolderForm: () => void;

  // File details modal
  readonly setEditingDetails: (editing: boolean) => void;
  readonly updateDetailsForm: (data: Partial<FileData>) => void;
  readonly resetDetailsForm: () => void;

  // Share modal
  readonly setShareLink: (link: string | null) => void;
  readonly updateSharePermissions: (
    permissions: Partial<SharePermissions>
  ) => void;
  readonly resetShareData: () => void;

  // Move/Copy modal
  readonly updateMoveForm: (data: Partial<MoveFileData>) => void;
  readonly setAvailableFolders: (folders: readonly FolderData[]) => void;
  readonly resetMoveForm: () => void;

  // Organize modal
  readonly updateOrganizeForm: (data: Partial<OrganizeFilesData>) => void;
  readonly setPreviewChanges: (preview: boolean) => void;
  readonly resetOrganizeForm: () => void;

  // Preview modal
  readonly setPreviewFile: (
    file: FileData | null,
    files?: readonly FileData[],
    index?: number
  ) => void;
  readonly setPreviewIndex: (index: number) => void;
  readonly navigatePreview: (direction: 'next' | 'prev') => void;

  // Bulk actions modal
  readonly setBulkActionType: (type: BulkActionType) => void;
  readonly setBulkActionProgress: (progress: number) => void;
  readonly addBulkActionError: (error: string) => void;
  readonly clearBulkActionErrors: () => void;
  readonly resetBulkAction: () => void;

  // Utility
  readonly reset: () => void;
}

// ===== INITIAL STATE =====
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
  uploadFormData: {
    files: [],
    targetFolderId: null,
    overwriteExisting: false,
  },

  // Create folder modal specific
  createFolderFormData: {
    name: '',
    color: FOLDER_COLOR.BLUE,
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
    operation: OPERATION_TYPE.MOVE,
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

// ===== PURE REDUCERS =====
const modalReducers = createReducers<
  FilesModalState,
  {
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

    updateUploadFormData: (
      state: FilesModalState,
      data: Partial<FileUploadData>
    ) => FilesModalState;
    setUploadProgress: (
      state: FilesModalState,
      fileId: string,
      progress: number
    ) => FilesModalState;
    setUploadStatus: (
      state: FilesModalState,
      fileId: string,
      status: UploadStatus
    ) => FilesModalState;
    setUploadError: (
      state: FilesModalState,
      fileId: string,
      error: string
    ) => FilesModalState;
    clearUploadData: (state: FilesModalState) => FilesModalState;

    updateCreateFolderForm: (
      state: FilesModalState,
      data: Partial<CreateFolderFormData>
    ) => FilesModalState;
    resetCreateFolderForm: (state: FilesModalState) => FilesModalState;

    setEditingDetails: (
      state: FilesModalState,
      editing: boolean
    ) => FilesModalState;
    updateDetailsForm: (
      state: FilesModalState,
      data: Partial<FileData>
    ) => FilesModalState;
    resetDetailsForm: (state: FilesModalState) => FilesModalState;

    setShareLink: (
      state: FilesModalState,
      link: string | null
    ) => FilesModalState;
    updateSharePermissions: (
      state: FilesModalState,
      permissions: Partial<SharePermissions>
    ) => FilesModalState;
    resetShareData: (state: FilesModalState) => FilesModalState;

    updateMoveForm: (
      state: FilesModalState,
      data: Partial<MoveFileData>
    ) => FilesModalState;
    setAvailableFolders: (
      state: FilesModalState,
      folders: readonly FolderData[]
    ) => FilesModalState;
    resetMoveForm: (state: FilesModalState) => FilesModalState;

    updateOrganizeForm: (
      state: FilesModalState,
      data: Partial<OrganizeFilesData>
    ) => FilesModalState;
    setPreviewChanges: (
      state: FilesModalState,
      preview: boolean
    ) => FilesModalState;
    resetOrganizeForm: (state: FilesModalState) => FilesModalState;

    setPreviewFile: (
      state: FilesModalState,
      file: FileData | null,
      files?: readonly FileData[],
      index?: number
    ) => FilesModalState;
    setPreviewIndex: (state: FilesModalState, index: number) => FilesModalState;
    navigatePreview: (
      state: FilesModalState,
      direction: 'next' | 'prev'
    ) => FilesModalState;

    setBulkActionType: (
      state: FilesModalState,
      type: BulkActionType
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
  updateUploadFormData: (state, data) => ({
    ...state,
    uploadFormData: {
      ...state.uploadFormData,
      ...data,
    },
  }),

  setUploadProgress: (state, fileId, progress) => ({
    ...state,
    uploadProgress: {
      ...state.uploadProgress,
      [fileId]: Math.max(0, Math.min(100, progress)),
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
    uploadFormData: {
      files: [],
      targetFolderId: null,
      overwriteExisting: false,
    },
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
      color: FOLDER_COLOR.BLUE,
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
      operation: OPERATION_TYPE.MOVE,
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

// ===== STORE DEFINITION =====
export type FilesModalStore = FilesModalState & FilesModalActions;

export const useFilesModalStore = create<FilesModalStore>()(
  devtools(
    set => ({
      ...initialState,
      ...convertReducersToActions(set as any, modalReducers),

      // Additional utility reset method
      reset: () => set(() => ({ ...initialState })),
    }),
    { name: 'FilesModalStore' }
  )
);

// ===== 2025 HOOKS - FOLLOWING BEST PRACTICES =====

// ✅ CORRECT: Select single values to avoid unnecessary re-renders
export const useFilesActiveModal = () =>
  useFilesModalStore(state => state.activeModal);
export const useFilesModalOpen = () =>
  useFilesModalStore(state => state.isModalOpen);
export const useFilesModalSubmitting = () =>
  useFilesModalStore(state => state.isSubmitting);
export const useFilesModalError = () =>
  useFilesModalStore(state => state.submitError);

// ✅ CORRECT: Use useShallow for multiple values when needed
export const useFilesModalState = () =>
  useFilesModalStore(
    useShallow(state => ({
      activeModal: state.activeModal,
      isModalOpen: state.isModalOpen,
      isSubmitting: state.isSubmitting,
      submitError: state.submitError,
      hasValidationErrors: Object.keys(state.validationErrors).length > 0,
    }))
  );

export const useFilesUploadState = () =>
  useFilesModalStore(
    useShallow(state => {
      const progressValues = Object.values(state.uploadProgress);
      const statuses = Object.values(state.uploadStatus);
      const errors = Object.values(state.uploadErrors);

      return {
        uploadProgress: state.uploadProgress,
        uploadStatus: state.uploadStatus,
        uploadErrors: state.uploadErrors,
        uploadFormData: state.uploadFormData,
        totalProgress:
          progressValues.length > 0
            ? Math.round(
                progressValues.reduce((sum, p) => sum + p, 0) /
                  progressValues.length
              )
            : 0,
        isUploading: statuses.some(s => s === UPLOAD_STATUS.UPLOADING),
        isCompleted:
          statuses.length > 0 &&
          statuses.every(
            s => s === UPLOAD_STATUS.COMPLETED || s === UPLOAD_STATUS.FAILED
          ),
        hasErrors: errors.length > 0,
        totalFiles: statuses.length,
        completedFiles: statuses.filter(s => s === UPLOAD_STATUS.COMPLETED)
          .length,
        failedFiles: statuses.filter(s => s === UPLOAD_STATUS.FAILED).length,
      };
    })
  );

export const useFilesCreateFolderForm = () =>
  useFilesModalStore(
    useShallow(state => ({
      formData: state.createFolderFormData,
      isValid: state.createFolderFormData.name.trim() !== '',
    }))
  );

export const useFilesDetailsForm = () =>
  useFilesModalStore(
    useShallow(state => ({
      formData: state.detailsFormData,
      isEditing: state.isEditingDetails,
    }))
  );

export const useFilesShareState = () =>
  useFilesModalStore(
    useShallow(state => ({
      shareLink: state.shareLink,
      permissions: state.sharePermissions,
      hasLink: state.shareLink !== null,
    }))
  );

export const useFilesMoveForm = () =>
  useFilesModalStore(
    useShallow(state => ({
      formData: state.moveFormData,
      availableFolders: state.availableFolders,
      isValid:
        state.moveFormData.itemIds.length > 0 &&
        state.moveFormData.targetFolderId !== null,
    }))
  );

export const useFilesOrganizeForm = () =>
  useFilesModalStore(
    useShallow(state => ({
      formData: state.organizeFormData,
      previewChanges: state.previewChanges,
      hasOperations: state.organizeFormData.operations.length > 0,
    }))
  );

export const useFilesPreviewState = () =>
  useFilesModalStore(
    useShallow(state => ({
      previewFile: state.previewFile,
      previewIndex: state.previewIndex,
      previewFiles: state.previewFiles,
      canGoPrev: state.previewIndex > 0,
      canGoNext: state.previewIndex < state.previewFiles.length - 1,
      totalFiles: state.previewFiles.length,
      currentPosition: state.previewIndex + 1,
    }))
  );

export const useFilesBulkActionState = () =>
  useFilesModalStore(
    useShallow(state => ({
      bulkActionType: state.bulkActionType,
      progress: state.bulkActionProgress,
      errors: state.bulkActionErrors,
      isInProgress:
        state.bulkActionType !== null &&
        state.bulkActionProgress > 0 &&
        state.bulkActionProgress < 100,
      isCompleted: state.bulkActionProgress === 100,
      hasErrors: state.bulkActionErrors.length > 0,
    }))
  );

export const useFilesValidationErrors = () =>
  useFilesModalStore(
    useShallow(state => ({
      errors: state.validationErrors,
      hasErrors: Object.keys(state.validationErrors).length > 0,
    }))
  );

// ✅ CORRECT: Action selectors to avoid passing entire store
export const useFilesModalActions = () =>
  useFilesModalStore(
    useShallow(state => ({
      // Modal management
      openModal: state.openModal,
      closeModal: state.closeModal,
      closeAllModals: state.closeAllModals,
      pushModal: state.pushModal,
      popModal: state.popModal,
      updateModalData: state.updateModalData,

      // Form states
      setSubmitting: state.setSubmitting,
      setSubmitError: state.setSubmitError,
      setValidationErrors: state.setValidationErrors,
      clearValidationErrors: state.clearValidationErrors,

      // Upload
      updateUploadFormData: state.updateUploadFormData,
      setUploadProgress: state.setUploadProgress,
      setUploadStatus: state.setUploadStatus,
      setUploadError: state.setUploadError,
      clearUploadData: state.clearUploadData,

      // Create folder
      updateCreateFolderForm: state.updateCreateFolderForm,
      resetCreateFolderForm: state.resetCreateFolderForm,

      // Details
      setEditingDetails: state.setEditingDetails,
      updateDetailsForm: state.updateDetailsForm,
      resetDetailsForm: state.resetDetailsForm,

      // Share
      setShareLink: state.setShareLink,
      updateSharePermissions: state.updateSharePermissions,
      resetShareData: state.resetShareData,

      // Move/Copy
      updateMoveForm: state.updateMoveForm,
      setAvailableFolders: state.setAvailableFolders,
      resetMoveForm: state.resetMoveForm,

      // Organize
      updateOrganizeForm: state.updateOrganizeForm,
      setPreviewChanges: state.setPreviewChanges,
      resetOrganizeForm: state.resetOrganizeForm,

      // Preview
      setPreviewFile: state.setPreviewFile,
      setPreviewIndex: state.setPreviewIndex,
      navigatePreview: state.navigatePreview,

      // Bulk actions
      setBulkActionType: state.setBulkActionType,
      setBulkActionProgress: state.setBulkActionProgress,
      addBulkActionError: state.addBulkActionError,
      clearBulkActionErrors: state.clearBulkActionErrors,
      resetBulkAction: state.resetBulkAction,

      // Utility
      reset: state.reset,
    }))
  );

// ===== COMPUTED SELECTORS =====
export const useIsModalOpen = (modalType: ModalType) => {
  return useFilesModalStore(
    useCallback(
      state => state.isModalOpen && state.activeModal === modalType,
      [modalType]
    )
  );
};

export const useIsAnyModalOpen = () => {
  return useFilesModalStore(
    state => state.isModalOpen && state.activeModal !== null
  );
};

export const useModalData = <T = ModalData>() => {
  return useFilesModalStore(state => state.modalData as T);
};

export const useValidationError = (field: string) => {
  return useFilesModalStore(
    useCallback(state => state.validationErrors[field] || null, [field])
  );
};

export const useUploadProgress = (fileId: string) => {
  return useFilesModalStore(
    useCallback(state => state.uploadProgress[fileId] || 0, [fileId])
  );
};

export const useUploadStatus = (fileId: string) => {
  return useFilesModalStore(
    useCallback(
      state => state.uploadStatus[fileId] || UPLOAD_STATUS.PENDING,
      [fileId]
    )
  );
};

export const useUploadError = (fileId: string) => {
  return useFilesModalStore(
    useCallback(state => state.uploadErrors[fileId] || null, [fileId])
  );
};

export const useFilesModalStack = () => {
  return useFilesModalStore(
    useMemo(
      () => state => ({
        stack: state.modalStack,
        depth: state.modalStack.length,
        canPop: state.modalStack.length > 0,
      }),
      []
    )
  );
};
