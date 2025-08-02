import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Immer's MapSet plugin to work with Map and Set
enableMapSet();

// =============================================================================
// TYPES
// =============================================================================

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  parentFolderId?: string;
  uploadedAt?: Date;
  uploaderName?: string;
  status: 'staged' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  sortOrder?: number;
}

export interface StagedFolder {
  id: string;
  name: string;
  parentFolderId?: string;
  children: string[]; // IDs of child files/folders
  status: 'staged' | 'uploading' | 'completed' | 'failed';
  error?: string;
  sortOrder?: number;
}

export interface StagingState {
  // Staged items
  stagedFiles: Map<string, StagedFile>;
  stagedFolders: Map<string, StagedFolder>;
  
  // Upload session data
  uploaderName: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
  
  // UI state
  isUploading: boolean;
  uploadProgress: {
    total: number;
    completed: number;
    failed: number;
  };
  
  // Version counter to trigger re-renders when Maps change
  version: number;
}

interface StagingStore extends StagingState {
  // File operations
  addFiles: (files: File[], parentFolderId?: string) => void;
  removeFile: (fileId: string) => void;
  updateFileStatus: (fileId: string, status: StagedFile['status'], progress?: number, error?: string) => void;
  
  // Folder operations
  addFolder: (name: string, parentFolderId?: string) => string;
  removeFolder: (folderId: string) => void;
  updateFolderStatus: (folderId: string, status: StagedFolder['status'], error?: string) => void;
  moveStagedItem: (itemId: string, newParentId?: string) => void;
  
  // Session operations
  setUploaderInfo: (info: { name: string; email?: string; message?: string }) => void;
  
  // Upload operations
  setIsUploading: (isUploading: boolean) => void;
  updateUploadProgress: (progress: { completed?: number; failed?: number }) => void;
  
  // Batch operations
  getAllStagedItems: () => { files: StagedFile[]; folders: StagedFolder[] };
  clearStaged: () => void;
  reset: () => void;
  
  // Helper methods
  hasStagedItems: () => boolean;
  getStagedItemCount: () => number;
  getStagedFilesInFolder: (folderId?: string) => StagedFile[];
  getStagedFoldersInFolder: (folderId?: string) => StagedFolder[];
}

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
        set((state) => {
          // Calculate the starting sort order for new files
          const existingFilesInParent = Array.from(state.stagedFiles.values())
            .filter(f => f.parentFolderId === parentFolderId);
          let nextSortOrder = existingFilesInParent.length;
          
          files.forEach((file, index) => {
            const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const stagedFile: StagedFile = {
              id,
              file,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              ...(parentFolderId !== undefined && { parentFolderId }),
              status: 'staged',
              progress: 0,
              uploaderName: state.uploaderName,
              sortOrder: nextSortOrder + index,
            };
            
            state.stagedFiles.set(id, stagedFile);
            
            // Update parent folder if specified
            if (parentFolderId && state.stagedFolders.has(parentFolderId)) {
              const folder = state.stagedFolders.get(parentFolderId)!;
              folder.children.push(id);
            }
          });
          
          // Update upload progress total
          state.uploadProgress.total = state.stagedFiles.size + state.stagedFolders.size;
          
          // Increment version to trigger re-renders
          state.version++;
        }),

      removeFile: (fileId) =>
        set((state) => {
          const file = state.stagedFiles.get(fileId);
          if (!file) return;
          
          // Remove from parent folder if exists
          if (file.parentFolderId && state.stagedFolders.has(file.parentFolderId)) {
            const folder = state.stagedFolders.get(file.parentFolderId)!;
            folder.children = folder.children.filter(id => id !== fileId);
          }
          
          state.stagedFiles.delete(fileId);
          
          // Update upload progress total
          state.uploadProgress.total = state.stagedFiles.size + state.stagedFolders.size;
          
          // Increment version to trigger re-renders
          state.version++;
        }),

      updateFileStatus: (fileId, status, progress = 0, error) =>
        set((state) => {
          const file = state.stagedFiles.get(fileId);
          if (file) {
            file.status = status;
            file.progress = progress;
            if (error) file.error = error;
            
            // Update upload progress counters
            if (status === 'completed') {
              state.uploadProgress.completed++;
            } else if (status === 'failed') {
              state.uploadProgress.failed++;
            }
          }
        }),

      // Folder operations
      addFolder: (name, parentFolderId) => {
        const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => {
          // Calculate sort order for the new folder
          const existingFoldersInParent = Array.from(state.stagedFolders.values())
            .filter(f => f.parentFolderId === parentFolderId);
          const sortOrder = existingFoldersInParent.length;
          
          const stagedFolder: StagedFolder = {
            id,
            name,
            ...(parentFolderId !== undefined && { parentFolderId }),
            children: [],
            status: 'staged',
            sortOrder,
          };
          
          state.stagedFolders.set(id, stagedFolder);
          
          // Update parent folder if specified
          if (parentFolderId && state.stagedFolders.has(parentFolderId)) {
            const folder = state.stagedFolders.get(parentFolderId)!;
            folder.children.push(id);
          }
          
          // Update upload progress total
          state.uploadProgress.total = state.stagedFiles.size + state.stagedFolders.size;
          
          // Increment version to trigger re-renders
          state.version++;
        });
        
        return id;
      },

      removeFolder: (folderId) =>
        set((state) => {
          const folder = state.stagedFolders.get(folderId);
          if (!folder) return;
          
          // Recursively remove all children
          const removeChildren = (children: string[]) => {
            children.forEach(childId => {
              if (state.stagedFiles.has(childId)) {
                state.stagedFiles.delete(childId);
              } else if (state.stagedFolders.has(childId)) {
                const childFolder = state.stagedFolders.get(childId)!;
                removeChildren(childFolder.children);
                state.stagedFolders.delete(childId);
              }
            });
          };
          
          removeChildren(folder.children);
          
          // Remove from parent folder if exists
          if (folder.parentFolderId && state.stagedFolders.has(folder.parentFolderId)) {
            const parentFolder = state.stagedFolders.get(folder.parentFolderId)!;
            parentFolder.children = parentFolder.children.filter(id => id !== folderId);
          }
          
          state.stagedFolders.delete(folderId);
          
          // Update upload progress total
          state.uploadProgress.total = state.stagedFiles.size + state.stagedFolders.size;
          
          // Increment version to trigger re-renders
          state.version++;
        }),

      updateFolderStatus: (folderId, status, error) =>
        set((state) => {
          const folder = state.stagedFolders.get(folderId);
          if (folder) {
            folder.status = status;
            if (error) folder.error = error;
            
            // Update upload progress counters
            if (status === 'completed') {
              state.uploadProgress.completed++;
            } else if (status === 'failed') {
              state.uploadProgress.failed++;
            }
          }
        }),

      moveStagedItem: (itemId, newParentId) =>
        set((state) => {
          // Check if it's a file
          const file = state.stagedFiles.get(itemId);
          if (file) {
            // Remove from old parent's children if it's a staged folder
            if (file.parentFolderId && state.stagedFolders.has(file.parentFolderId)) {
              const oldParent = state.stagedFolders.get(file.parentFolderId)!;
              oldParent.children = oldParent.children.filter(id => id !== itemId);
            }
            
            // Update file's parent
            if (newParentId !== undefined) {
              file.parentFolderId = newParentId;
            } else {
              delete file.parentFolderId;
            }
            
            // Recalculate sort order in new parent
            const filesInNewParent = Array.from(state.stagedFiles.values())
              .filter(f => f.parentFolderId === newParentId && f.id !== itemId);
            file.sortOrder = filesInNewParent.length;
            
            // Add to new parent's children if it's a staged folder
            if (newParentId && state.stagedFolders.has(newParentId)) {
              const newParent = state.stagedFolders.get(newParentId)!;
              if (!newParent.children.includes(itemId)) {
                newParent.children.push(itemId);
              }
            }
          }
          
          // Check if it's a folder
          const folder = state.stagedFolders.get(itemId);
          if (folder) {
            // Remove from old parent's children if it's a staged folder
            if (folder.parentFolderId && state.stagedFolders.has(folder.parentFolderId)) {
              const oldParent = state.stagedFolders.get(folder.parentFolderId)!;
              oldParent.children = oldParent.children.filter(id => id !== itemId);
            }
            
            // Update folder's parent
            if (newParentId !== undefined) {
              folder.parentFolderId = newParentId;
            } else {
              delete folder.parentFolderId;
            }
            
            // Recalculate sort order in new parent
            const foldersInNewParent = Array.from(state.stagedFolders.values())
              .filter(f => f.parentFolderId === newParentId && f.id !== itemId);
            folder.sortOrder = foldersInNewParent.length;
            
            // Add to new parent's children if it's a staged folder
            if (newParentId && state.stagedFolders.has(newParentId)) {
              const newParent = state.stagedFolders.get(newParentId)!;
              if (!newParent.children.includes(itemId)) {
                newParent.children.push(itemId);
              }
            }
          }
          
          // Increment version to trigger re-renders
          state.version++;
        }),

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