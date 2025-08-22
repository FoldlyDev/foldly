import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { StagingState, StagingStore } from './staging-types';
import { fileOperations } from './staging-file-operations';
import { folderOperations } from './staging-folder-operations';

// Enable Immer's MapSet plugin to work with Map and Set
enableMapSet();

// Re-export types for backwards compatibility
export type { StagedFile, StagedFolder, StagingState } from './staging-types';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: StagingState = {
  stagedFiles: new Map(),
  stagedFolders: new Map(),
  uploaderName: 'Anonymous',
  isUploading: false,
  uploadProgress: {
    total: 0,
    completed: 0,
    failed: 0,
  },
  version: 0,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useStagingStore = create<StagingStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // File operations
      addFiles: (files, parentFolderId) =>
        set((state) => fileOperations.addFiles(state, files, parentFolderId)),

      removeFile: (fileId) =>
        set((state) => fileOperations.removeFile(state, fileId)),

      updateFileStatus: (fileId, status, progress = 0, error) =>
        set((state) => fileOperations.updateFileStatus(state, fileId, status, progress, error)),

      // Folder operations
      addFolder: (name, parentFolderId) => {
        let id = '';
        set((state) => {
          id = folderOperations.addFolder(state, name, parentFolderId);
        });
        return id;
      },

      removeFolder: (folderId) =>
        set((state) => folderOperations.removeFolder(state, folderId)),

      updateFolderStatus: (folderId, status, error) =>
        set((state) => folderOperations.updateFolderStatus(state, folderId, status, error)),

      moveStagedItem: (itemId, newParentId) =>
        set((state) => folderOperations.moveStagedItem(state, itemId, newParentId)),

      // Session operations
      setUploaderInfo: (info) =>
        set((state) => {
          state.uploaderName = info.name;
          if (info.email !== undefined) {
            state.uploaderEmail = info.email;
          } else {
            delete state.uploaderEmail;
          }
          if (info.message !== undefined) {
            state.uploaderMessage = info.message;
          } else {
            delete state.uploaderMessage;
          }
          
          // Update all staged files with new uploader info
          state.stagedFiles.forEach(file => {
            file.uploaderName = info.name;
          });
        }),

      // Upload operations
      setIsUploading: (isUploading) =>
        set((state) => {
          state.isUploading = isUploading;
          
          if (isUploading) {
            // Reset progress counters when starting upload
            state.uploadProgress.completed = 0;
            state.uploadProgress.failed = 0;
          }
        }),

      updateUploadProgress: (progress) =>
        set((state) => {
          if (progress.completed !== undefined) {
            state.uploadProgress.completed = progress.completed;
          }
          if (progress.failed !== undefined) {
            state.uploadProgress.failed = progress.failed;
          }
        }),

      // Batch operations
      getAllStagedItems: () => {
        const state = get();
        return {
          files: Array.from(state.stagedFiles.values()),
          folders: Array.from(state.stagedFolders.values()),
        };
      },

      clearStaged: () =>
        set((state) => {
          state.stagedFiles.clear();
          state.stagedFolders.clear();
          state.uploadProgress = {
            total: 0,
            completed: 0,
            failed: 0,
          };
          
          // Increment version to trigger re-renders
          state.version++;
        }),

      reset: () => set(initialState),

      // Helper methods
      hasStagedItems: () => {
        const state = get();
        return state.stagedFiles.size > 0 || state.stagedFolders.size > 0;
      },

      getStagedItemCount: () => {
        const state = get();
        // Count all files and folders recursively
        // Since all files and folders are stored in flat Maps regardless of hierarchy,
        // we can simply count the total size of both Maps
        return state.stagedFiles.size + state.stagedFolders.size;
      },

      getStagedFilesInFolder: (folderId) => {
        const state = get();
        return Array.from(state.stagedFiles.values()).filter(
          file => file.parentFolderId === folderId
        );
      },

      getStagedFoldersInFolder: (folderId) => {
        const state = get();
        return Array.from(state.stagedFolders.values()).filter(
          folder => folder.parentFolderId === folderId
        );
      },
    })),
    {
      name: 'StagingStore',
    }
  )
);