'use client';

// Files Data Store - CRUD Operations and Data Management
// Zustand store for file and folder data operations
// Following 2025 TypeScript best practices with pure reducers

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FileId, FolderId } from '@/types';
import type {
  FileUpload,
  Folder,
  FileData,
  FolderData,
} from '../types/database';
import {
  MOCK_FILES,
  MOCK_FOLDERS,
  MOCK_WORKSPACE_DATA,
} from '../utils/enhanced-mock-data';

// Constants
export const FILE_STATUS = {
  ACTIVE: 'active',
  PROCESSING: 'processing',
  ERROR: 'error',
  ARCHIVED: 'archived',
} as const;

// Folder colors removed for MVP simplification

// Type aliases for consistency (imported from types)
// Note: FileData and FolderData are now exported from ../types/index.ts

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface FilesDataState {
  // Core data
  files: FileData[];
  folders: FolderData[];

  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;
  uploadError: string | null;
  deleteError: string | null;

  // Actions
  setFiles: (files: FileData[]) => void;
  addFile: (file: FileData) => void;
  addFiles: (files: FileData[]) => void;
  updateFile: (fileId: FileId, updates: Partial<FileData>) => void;
  removeFile: (fileId: FileId) => void;
  removeFiles: (fileIds: FileId[]) => void;

  setFolders: (folders: FolderData[]) => void;
  addFolder: (folder: FolderData) => void;
  updateFolder: (folderId: FolderId, updates: Partial<FolderData>) => void;
  removeFolder: (folderId: FolderId) => void;

  setLoading: (isLoading: boolean) => void;
  setUploading: (isUploading: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;

  setError: (error: string | null) => void;
  setUploadError: (error: string | null) => void;
  setDeleteError: (error: string | null) => void;
  clearErrors: () => void;

  // Additional actions referenced in composite hooks
  fetchWorkspaceData: () => Promise<void>;
  uploadFile: (fileData: Partial<FileData>) => Promise<void>;
  createFolder: (folderData: Partial<FolderData>) => Promise<void>;
  deleteFile: (fileId: FileId) => Promise<void>;
  deleteFolder: (folderId: FolderId) => Promise<void>;

  // Mock data management
  loadMockData: () => void;
  clearAllData: () => void;
  resetToMockData: () => void;

  // Operation status
  operationStatus: Record<string, 'pending' | 'success' | 'error'>;
  workspaceData: any;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFilesDataStore = create<FilesDataState>()(
  devtools(
    (set, get) => ({
      // Initial state with mock data
      files: MOCK_FILES,
      folders: MOCK_FOLDERS,
      isLoading: false,
      isUploading: false,
      isDeleting: false,
      error: null,
      uploadError: null,
      deleteError: null,
      operationStatus: {},
      workspaceData: MOCK_WORKSPACE_DATA,

      // File actions
      setFiles: files => set({ files }),

      addFile: file =>
        set(state => ({
          files: [...state.files, file],
        })),

      addFiles: files =>
        set(state => ({
          files: [...state.files, ...files],
        })),

      updateFile: (fileId, updates) =>
        set(state => ({
          files: state.files.map(file =>
            file.id === fileId ? { ...file, ...updates } : file
          ),
        })),

      removeFile: fileId =>
        set(state => ({
          files: state.files.filter(file => file.id !== fileId),
        })),

      removeFiles: fileIds =>
        set(state => ({
          files: state.files.filter(
            file => !fileIds.includes(file.id as FileId)
          ),
        })),

      // Folder actions
      setFolders: folders => set({ folders }),

      addFolder: folder =>
        set(state => ({
          folders: [...state.folders, folder],
        })),

      updateFolder: (folderId, updates) =>
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, ...updates } : folder
          ),
        })),

      removeFolder: folderId =>
        set(state => ({
          folders: state.folders.filter(folder => folder.id !== folderId),
          files: state.files.filter(file => file.folderId !== folderId),
        })),

      // Loading state actions
      setLoading: isLoading => set({ isLoading }),
      setUploading: isUploading => set({ isUploading }),
      setDeleting: isDeleting => set({ isDeleting }),

      // Error state actions
      setError: error => set({ error }),
      setUploadError: uploadError => set({ uploadError }),
      setDeleteError: deleteError => set({ deleteError }),
      clearErrors: () =>
        set({
          error: null,
          uploadError: null,
          deleteError: null,
        }),

      // Additional actions referenced in composite hooks
      fetchWorkspaceData: async () => {
        try {
          set({ isLoading: true, error: null });
          // TODO: Implement actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch workspace data',
          });
        }
      },

      uploadFile: async fileData => {
        try {
          set({ isUploading: true, uploadError: null });
          // TODO: Implement actual upload logic
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newFile = {
            id: Math.random().toString(36).substring(7) as FileId,
            fileName: fileData.fileName || 'Untitled',
            originalFileName:
              fileData.originalFileName || fileData.fileName || 'Untitled',
            fileSize: fileData.fileSize || 0,
            fileType: fileData.fileType || 'application/octet-stream',
            mimeType: fileData.mimeType || 'application/octet-stream',
            storagePath: fileData.storagePath || '',
            uploadLinkId: fileData.uploadLinkId || '',
            batchId: fileData.batchId || '',
            uploaderName: fileData.uploaderName || 'Unknown',
            folderId: fileData.folderId || null,
            processingStatus: 'completed' as const,
            isProcessed: true,
            isSafe: true,
            downloadCount: 0,
            isArchived: false,
            classification: 'internal' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: '' as any, // Will be set by the service layer
            tags: [],
            ...fileData,
          } as FileData;

          get().addFile(newFile);
          set({ isUploading: false });
        } catch (error) {
          set({
            isUploading: false,
            uploadError:
              error instanceof Error ? error.message : 'Failed to upload file',
          });
        }
      },

      createFolder: async folderData => {
        try {
          set({ isLoading: true, error: null });
          // TODO: Implement actual folder creation logic
          await new Promise(resolve => setTimeout(resolve, 500));
          const newFolder = {
            id: Math.random().toString(36).substring(7) as FolderId,
            name: folderData.name || 'Untitled Folder',
            parentFolderId: folderData.parentFolderId || null,
            color: folderData.color,
            description: folderData.description || '',
            path: folderData.name || 'Untitled Folder',
            isArchived: false,
            sortOrder: 0,
            isPublic: folderData.isPublic ?? true,
            inheritPermissions: true,
            classification: 'internal' as const,
            fileCount: 0,
            totalSize: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: '' as any, // Will be set by the service layer
            tags: [],
            ...folderData,
          } as FolderData;

          get().addFolder(newFolder);
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create folder',
          });
        }
      },

      deleteFile: async fileId => {
        try {
          set({ isDeleting: true, deleteError: null });
          // TODO: Implement actual deletion logic
          await new Promise(resolve => setTimeout(resolve, 500));
          get().removeFile(fileId);
          set({ isDeleting: false });
        } catch (error) {
          set({
            isDeleting: false,
            deleteError:
              error instanceof Error ? error.message : 'Failed to delete file',
          });
        }
      },

      deleteFolder: async folderId => {
        try {
          set({ isDeleting: true, deleteError: null });
          // TODO: Implement actual deletion logic
          await new Promise(resolve => setTimeout(resolve, 500));
          get().removeFolder(folderId);
          set({ isDeleting: false });
        } catch (error) {
          set({
            isDeleting: false,
            deleteError:
              error instanceof Error
                ? error.message
                : 'Failed to delete folder',
          });
        }
      },

      // Mock data management functions for testing
      loadMockData: () => {
        set({
          files: MOCK_FILES,
          folders: MOCK_FOLDERS,
          workspaceData: MOCK_WORKSPACE_DATA,
        });
      },

      clearAllData: () => {
        set({
          files: [],
          folders: [],
          workspaceData: null,
        });
      },

      resetToMockData: () => {
        set({
          files: MOCK_FILES,
          folders: MOCK_FOLDERS,
          workspaceData: MOCK_WORKSPACE_DATA,
          isLoading: false,
          isUploading: false,
          isDeleting: false,
          error: null,
          uploadError: null,
          deleteError: null,
          operationStatus: {},
        });
      },
    }),
    { name: 'FilesDataStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const filesDataSelectors = {
  files: (state: FilesDataState) => state.files,
  folders: (state: FilesDataState) => state.folders,
  isLoading: (state: FilesDataState) => state.isLoading,
  isUploading: (state: FilesDataState) => state.isUploading,
  isDeleting: (state: FilesDataState) => state.isDeleting,
  error: (state: FilesDataState) => state.error,
  uploadError: (state: FilesDataState) => state.uploadError,
  deleteError: (state: FilesDataState) => state.deleteError,

  getFileById: (fileId: FileId) => (state: FilesDataState) =>
    state.files.find(file => file.id === fileId),

  getFolderById: (folderId: FolderId) => (state: FilesDataState) =>
    state.folders.find(folder => folder.id === folderId),

  getFilesByFolderId: (folderId: FolderId | null) => (state: FilesDataState) =>
    state.files.filter(file => file.folderId === folderId),

  getSubfoldersByParentId:
    (parentId: FolderId | null) => (state: FilesDataState) =>
      state.folders.filter(folder => folder.parentFolderId === parentId),
};
