// Files Data Store - CRUD Operations and Data Management
// Zustand store for file and folder data operations
// Following 2025 TypeScript best practices with pure reducers

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  FileData,
  FolderData,
  WorkspaceData,
  FileId,
  FolderId,
  WorkspaceId,
  FileFilters,
  FileUploadData,
  CreateFolderFormData,
  MoveFileData,
  OrganizeFilesData,
  BatchId,
} from '../types';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import {
  MOCK_FILES,
  MOCK_FOLDERS,
  MOCK_WORKSPACE,
  generateUniqueName,
  sortFiles,
  sortFolders,
  searchFiles,
  searchFolders,
} from '../utils';

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface FilesDataState {
  // Core data
  readonly files: FileData[];
  readonly folders: FolderData[];
  readonly workspace: WorkspaceData;

  // Loading states
  readonly isLoading: boolean;
  readonly isUploading: boolean;
  readonly isSaving: boolean;
  readonly isDeleting: boolean;

  // Error states
  readonly error: string | null;
  readonly uploadError: string | null;
  readonly saveError: string | null;
  readonly deleteError: string | null;

  // Operation states
  readonly lastOperation: string | null;
  readonly operationTimestamp: number | null;

  // Sync states
  readonly lastSyncAt: Date | null;
  readonly syncInProgress: boolean;
  readonly pendingChanges: number;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FilesDataState = {
  // Core data - Initialize with mock data
  files: MOCK_FILES,
  folders: MOCK_FOLDERS,
  workspace: MOCK_WORKSPACE,

  // Loading states
  isLoading: false,
  isUploading: false,
  isSaving: false,
  isDeleting: false,

  // Error states
  error: null,
  uploadError: null,
  saveError: null,
  deleteError: null,

  // Operation states
  lastOperation: null,
  operationTimestamp: null,

  // Sync states
  lastSyncAt: null,
  syncInProgress: false,
  pendingChanges: 0,
};

// =============================================================================
// PURE REDUCERS
// =============================================================================

const dataReducers = createReducers<
  FilesDataState,
  {
    // Loading states
    setLoading: (state: FilesDataState, isLoading: boolean) => FilesDataState;
    setUploading: (
      state: FilesDataState,
      isUploading: boolean
    ) => FilesDataState;
    setSaving: (state: FilesDataState, isSaving: boolean) => FilesDataState;
    setDeleting: (state: FilesDataState, isDeleting: boolean) => FilesDataState;

    // Error states
    setError: (state: FilesDataState, error: string | null) => FilesDataState;
    setUploadError: (
      state: FilesDataState,
      error: string | null
    ) => FilesDataState;
    setSaveError: (
      state: FilesDataState,
      error: string | null
    ) => FilesDataState;
    setDeleteError: (
      state: FilesDataState,
      error: string | null
    ) => FilesDataState;
    clearErrors: (state: FilesDataState) => FilesDataState;

    // File operations
    addFile: (state: FilesDataState, file: FileData) => FilesDataState;
    addFiles: (state: FilesDataState, files: FileData[]) => FilesDataState;
    updateFile: (
      state: FilesDataState,
      fileId: FileId,
      updates: Partial<FileData>
    ) => FilesDataState;
    removeFile: (state: FilesDataState, fileId: FileId) => FilesDataState;
    removeFiles: (state: FilesDataState, fileIds: FileId[]) => FilesDataState;

    // Folder operations
    addFolder: (state: FilesDataState, folder: FolderData) => FilesDataState;
    updateFolder: (
      state: FilesDataState,
      folderId: FolderId,
      updates: Partial<FolderData>
    ) => FilesDataState;
    removeFolder: (state: FilesDataState, folderId: FolderId) => FilesDataState;

    // Workspace operations
    updateWorkspace: (
      state: FilesDataState,
      updates: Partial<WorkspaceData>
    ) => FilesDataState;

    // Bulk operations
    moveFilesToFolder: (
      state: FilesDataState,
      fileIds: FileId[],
      folderId: FolderId | null
    ) => FilesDataState;
    copyFiles: (
      state: FilesDataState,
      fileIds: FileId[],
      folderId: FolderId | null
    ) => FilesDataState;
    organizeFiles: (
      state: FilesDataState,
      data: OrganizeFilesData
    ) => FilesDataState;

    // Sync operations
    setSyncInProgress: (
      state: FilesDataState,
      inProgress: boolean
    ) => FilesDataState;
    setSyncCompleted: (
      state: FilesDataState,
      timestamp: Date
    ) => FilesDataState;
    setPendingChanges: (state: FilesDataState, count: number) => FilesDataState;

    // Reset operations
    resetData: (state: FilesDataState) => FilesDataState;
    resetErrors: (state: FilesDataState) => FilesDataState;
  }
>({
  // Loading states
  setLoading: (state, isLoading) => ({
    ...state,
    isLoading,
  }),

  setUploading: (state, isUploading) => ({
    ...state,
    isUploading,
  }),

  setSaving: (state, isSaving) => ({
    ...state,
    isSaving,
  }),

  setDeleting: (state, isDeleting) => ({
    ...state,
    isDeleting,
  }),

  // Error states
  setError: (state, error) => ({
    ...state,
    error,
  }),

  setUploadError: (state, error) => ({
    ...state,
    uploadError: error,
  }),

  setSaveError: (state, error) => ({
    ...state,
    saveError: error,
  }),

  setDeleteError: (state, error) => ({
    ...state,
    deleteError: error,
  }),

  clearErrors: state => ({
    ...state,
    error: null,
    uploadError: null,
    saveError: null,
    deleteError: null,
  }),

  // File operations
  addFile: (state, file) => ({
    ...state,
    files: [...state.files, file],
    lastOperation: 'addFile',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  addFiles: (state, files) => ({
    ...state,
    files: [...state.files, ...files],
    lastOperation: 'addFiles',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + files.length,
  }),

  updateFile: (state, fileId, updates) => ({
    ...state,
    files: state.files.map(file =>
      file.id === fileId ? { ...file, ...updates, updatedAt: new Date() } : file
    ),
    lastOperation: 'updateFile',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  removeFile: (state, fileId) => ({
    ...state,
    files: state.files.filter(file => file.id !== fileId),
    lastOperation: 'removeFile',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  removeFiles: (state, fileIds) => ({
    ...state,
    files: state.files.filter(file => !fileIds.includes(file.id)),
    lastOperation: 'removeFiles',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + fileIds.length,
  }),

  // Folder operations
  addFolder: (state, folder) => ({
    ...state,
    folders: [...state.folders, folder],
    lastOperation: 'addFolder',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  updateFolder: (state, folderId, updates) => ({
    ...state,
    folders: state.folders.map(folder =>
      folder.id === folderId
        ? { ...folder, ...updates, updatedAt: new Date() }
        : folder
    ),
    lastOperation: 'updateFolder',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  removeFolder: (state, folderId) => ({
    ...state,
    folders: state.folders.filter(folder => folder.id !== folderId),
    // Also remove files in the folder
    files: state.files.filter(file => file.folderId !== folderId),
    lastOperation: 'removeFolder',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  // Workspace operations
  updateWorkspace: (state, updates) => ({
    ...state,
    workspace: { ...state.workspace, ...updates, updatedAt: new Date() },
    lastOperation: 'updateWorkspace',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + 1,
  }),

  // Bulk operations
  moveFilesToFolder: (state, fileIds, folderId) => ({
    ...state,
    files: state.files.map(file =>
      fileIds.includes(file.id)
        ? { ...file, folderId, updatedAt: new Date() }
        : file
    ),
    lastOperation: 'moveFilesToFolder',
    operationTimestamp: Date.now(),
    pendingChanges: state.pendingChanges + fileIds.length,
  }),

  copyFiles: (state, fileIds, folderId) => {
    const filesToCopy = state.files.filter(file => fileIds.includes(file.id));
    const existingNames = state.files.map(file => file.name);

    const copiedFiles = filesToCopy.map(file => ({
      ...file,
      id: `${file.id}_copy_${Date.now()}` as FileId,
      name: generateUniqueName(file.name, existingNames),
      folderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedAt: new Date(),
    }));

    return {
      ...state,
      files: [...state.files, ...copiedFiles],
      lastOperation: 'copyFiles',
      operationTimestamp: Date.now(),
      pendingChanges: state.pendingChanges + copiedFiles.length,
    };
  },

  organizeFiles: (state, data) => ({
    ...state,
    files: state.files.map(file => {
      const organizedFile = data.files.find(f => f.id === file.id);
      return organizedFile || file;
    }),
    folders: state.folders.map(folder => {
      const organizedFolder = data.folders.find(f => f.id === folder.id);
      return organizedFolder || folder;
    }),
    lastOperation: 'organizeFiles',
    operationTimestamp: Date.now(),
    pendingChanges:
      state.pendingChanges + data.files.length + data.folders.length,
  }),

  // Sync operations
  setSyncInProgress: (state, inProgress) => ({
    ...state,
    syncInProgress: inProgress,
  }),

  setSyncCompleted: (state, timestamp) => ({
    ...state,
    lastSyncAt: timestamp,
    syncInProgress: false,
    pendingChanges: 0,
  }),

  setPendingChanges: (state, count) => ({
    ...state,
    pendingChanges: count,
  }),

  // Reset operations
  resetData: state => ({
    ...state,
    files: MOCK_FILES,
    folders: MOCK_FOLDERS,
    workspace: MOCK_WORKSPACE,
    lastOperation: 'resetData',
    operationTimestamp: Date.now(),
    pendingChanges: 0,
  }),

  resetErrors: state => ({
    ...state,
    error: null,
    uploadError: null,
    saveError: null,
    deleteError: null,
  }),
});

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesDataStore = create<
  FilesDataState &
    ReturnType<
      typeof convertReducersToActions<FilesDataState, typeof dataReducers>
    >
>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        ...convertReducersToActions(set, dataReducers),
      }),
      {
        name: 'files-data-store',
        partialize: state => ({
          files: state.files,
          folders: state.folders,
          workspace: state.workspace,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    ),
    {
      name: 'files-data-store',
    }
  )
);

// =============================================================================
// COMPUTED SELECTORS
// =============================================================================

/**
 * Get file by ID
 */
export const getFileById = (
  state: FilesDataState,
  fileId: FileId
): FileData | null => {
  return state.files.find(file => file.id === fileId) || null;
};

/**
 * Get folder by ID
 */
export const getFolderById = (
  state: FilesDataState,
  folderId: FolderId
): FolderData | null => {
  return state.folders.find(folder => folder.id === folderId) || null;
};

/**
 * Get files by folder ID
 */
export const getFilesByFolderId = (
  state: FilesDataState,
  folderId: FolderId | null
): FileData[] => {
  return state.files.filter(file => file.folderId === folderId);
};

/**
 * Get subfolders by parent ID
 */
export const getSubfoldersByParentId = (
  state: FilesDataState,
  parentId: FolderId | null
): FolderData[] => {
  return state.folders.filter(folder => folder.parentId === parentId);
};

/**
 * Get root folders
 */
export const getRootFolders = (state: FilesDataState): FolderData[] => {
  return state.folders.filter(folder => folder.parentId === null);
};

/**
 * Get files with filters
 */
export const getFilteredFiles = (
  state: FilesDataState,
  filters: FileFilters
): FileData[] => {
  return searchFiles(state.files, filters.query || '', {
    type: filters.types,
    sizeMin: filters.sizeMin,
    sizeMax: filters.sizeMax,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    tags: filters.tags,
    isShared: filters.isShared,
    isPublic: filters.isPublic,
  });
};

/**
 * Get sorted files
 */
export const getSortedFiles = (
  state: FilesDataState,
  sortBy:
    | 'name'
    | 'size'
    | 'type'
    | 'createdAt'
    | 'updatedAt'
    | 'downloadCount' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): FileData[] => {
  return sortFiles(state.files, sortBy, sortOrder);
};

/**
 * Get sorted folders
 */
export const getSortedFolders = (
  state: FilesDataState,
  sortBy:
    | 'name'
    | 'createdAt'
    | 'updatedAt'
    | 'fileCount'
    | 'totalSize' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): FolderData[] => {
  return sortFolders(state.folders, sortBy, sortOrder);
};

/**
 * Get recent files
 */
export const getRecentFiles = (
  state: FilesDataState,
  days: number = 7
): FileData[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return state.files
    .filter(file => file.createdAt >= cutoffDate)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Get shared files
 */
export const getSharedFiles = (state: FilesDataState): FileData[] => {
  return state.files.filter(file => file.isShared);
};

/**
 * Get public files
 */
export const getPublicFiles = (state: FilesDataState): FileData[] => {
  return state.files.filter(file => file.isPublic);
};

/**
 * Get workspace statistics
 */
export const getWorkspaceStats = (state: FilesDataState) => {
  const totalFiles = state.files.length;
  const totalFolders = state.folders.length;
  const totalSize = state.files.reduce((sum, file) => sum + file.size, 0);

  return {
    totalFiles,
    totalFolders,
    totalSize,
    sharedFiles: state.files.filter(file => file.isShared).length,
    publicFiles: state.files.filter(file => file.isPublic).length,
    recentFiles: getRecentFiles(state).length,
    pendingChanges: state.pendingChanges,
    lastSyncAt: state.lastSyncAt,
  };
};

/**
 * Check if any loading state is active
 */
export const isAnyLoading = (state: FilesDataState): boolean => {
  return (
    state.isLoading || state.isUploading || state.isSaving || state.isDeleting
  );
};

/**
 * Check if any error state is active
 */
export const hasAnyError = (state: FilesDataState): boolean => {
  return !!(
    state.error ||
    state.uploadError ||
    state.saveError ||
    state.deleteError
  );
};

/**
 * Get all errors
 */
export const getAllErrors = (state: FilesDataState): string[] => {
  return [
    state.error,
    state.uploadError,
    state.saveError,
    state.deleteError,
  ].filter((error): error is string => error !== null);
};
