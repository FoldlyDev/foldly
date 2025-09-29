'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TreeFileItem, TreeFolderItem } from '@/components/file-tree/types';

/**
 * Staging Store for Link Upload
 * Manages files that are staged for upload but not yet sent to the server
 * All files remain local until the user clicks "Send Files" and provides required info
 */

export interface StagedFile extends Omit<TreeFileItem, 'type'> {
  type: 'file';
  file: File; // The actual File object to upload
  status: 'staged' | 'uploading' | 'uploaded' | 'error';
  progress?: number; // Upload progress 0-100
  error?: string;
  addedAt: Date;
}

export interface StagedFolder extends Omit<TreeFolderItem, 'type' | 'children'> {
  type: 'folder';
  children: string[]; // Just track IDs, tree will handle structure
  addedAt: Date;
}

interface StagingState {
  // Staged items
  stagedFiles: Map<string, StagedFile>;
  stagedFolders: Map<string, StagedFolder>;
  
  // Upload state
  isUploading: boolean;
  uploadProgress: number; // Overall progress
  
  // Modal states
  isUploadModalOpen: boolean;
  isVerificationModalOpen: boolean;
  targetFolderId: string | null; // Where to add new files in the tree
  
  // Counters for sortOrder
  nextSortOrder: number;
}

interface StagingActions {
  // File staging
  addStagedFiles: (files: File[], targetFolderId: string | null) => void;
  removeStagedFile: (fileId: string) => void;
  renameStagedFile: (fileId: string, newName: string) => void;
  moveStagedFile: (fileId: string, newParentId: string | null) => void;
  updateFileSortOrder: (fileId: string, sortOrder: number) => void;
  
  // Folder staging
  addStagedFolder: (name: string, parentId: string | null) => string; // Returns folder ID
  removeStagedFolder: (folderId: string) => void;
  renameStagedFolder: (folderId: string, newName: string) => void;
  updateFolderSortOrder: (folderId: string, sortOrder: number) => void;
  
  // Batch operations
  removeStagedItems: (itemIds: string[]) => void;
  clearAllStaged: () => void;
  updateItemsOrder: (parentId: string | null, itemIds: string[]) => void;
  
  // Upload operations
  updateFileStatus: (fileId: string, status: StagedFile['status'], progress?: number, error?: string) => void;
  setUploadProgress: (progress: number) => void;
  setIsUploading: (isUploading: boolean) => void;
  
  // Modal management
  openUploadModal: (targetFolderId: string | null) => void;
  closeUploadModal: () => void;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
  
  // Getters
  getStagedFileCount: () => number;
  getTotalStagedSize: () => number;
  hasAnyStaged: () => boolean;
  getAllStagedItems: () => { files: StagedFile[]; folders: StagedFolder[] };
  getNextSortOrder: () => number;
}

const initialState: StagingState = {
  stagedFiles: new Map(),
  stagedFolders: new Map(),
  isUploading: false,
  uploadProgress: 0,
  isUploadModalOpen: false,
  isVerificationModalOpen: false,
  targetFolderId: null,
  nextSortOrder: 0,
};

export type LinkUploadStagingStore = StagingState & StagingActions;

export const useLinkUploadStagingStore = create<LinkUploadStagingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // File staging
      addStagedFiles: (files, targetFolderId) => {
        const newFiles = new Map(get().stagedFiles);
        let currentSortOrder = get().nextSortOrder;
        
        files.forEach(file => {
          const id = `staged-file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const extension = file.name.split('.').pop() || null;
          
          // Create preview URL for image files (following workspace pattern)
          let thumbnailPath = null;
          if (file.type.startsWith('image/')) {
            thumbnailPath = URL.createObjectURL(file);
            // Add preview property to the file object itself
            Object.assign(file, { preview: thumbnailPath });
          }
          
          const stagedFile: StagedFile = {
            id,
            name: file.name,
            type: 'file',
            parentId: targetFolderId,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            extension,
            thumbnailPath, // Now contains preview URL for images
            processingStatus: 'pending',
            sortOrder: currentSortOrder++,
            file,
            status: 'staged',
            addedAt: new Date(),
          };
          
          newFiles.set(id, stagedFile);
        });
        
        set({ 
          stagedFiles: newFiles,
          nextSortOrder: currentSortOrder,
        });
      },

      removeStagedFile: (fileId) => {
        const newFiles = new Map(get().stagedFiles);
        const file = newFiles.get(fileId);
        
        // Clean up thumbnail URL to prevent memory leak
        if (file?.thumbnailPath) {
          URL.revokeObjectURL(file.thumbnailPath);
        }
        
        newFiles.delete(fileId);
        set({ stagedFiles: newFiles });
      },

      renameStagedFile: (fileId, newName) => {
        const newFiles = new Map(get().stagedFiles);
        const file = newFiles.get(fileId);
        if (file) {
          file.name = newName;
          // Update extension if name has extension
          const extension = newName.split('.').pop();
          if (extension && extension !== newName) {
            file.extension = extension;
          }
          newFiles.set(fileId, { ...file });
        }
        set({ stagedFiles: newFiles });
      },

      moveStagedFile: (fileId, newParentId) => {
        const newFiles = new Map(get().stagedFiles);
        const file = newFiles.get(fileId);
        if (file) {
          file.parentId = newParentId;
          newFiles.set(fileId, { ...file });
        }
        set({ stagedFiles: newFiles });
      },

      updateFileSortOrder: (fileId, sortOrder) => {
        const newFiles = new Map(get().stagedFiles);
        const file = newFiles.get(fileId);
        if (file) {
          file.sortOrder = sortOrder;
          newFiles.set(fileId, { ...file });
        }
        set({ stagedFiles: newFiles });
      },

      // Folder staging
      addStagedFolder: (name, parentId) => {
        const newFolders = new Map(get().stagedFolders);
        const id = `staged-folder-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const currentSortOrder = get().nextSortOrder;
        
        const stagedFolder: StagedFolder = {
          id,
          name,
          type: 'folder',
          parentId,
          path: '/', // Will be calculated by tree
          depth: 0, // Will be calculated by tree
          fileCount: 0,
          totalSize: 0,
          isArchived: false,
          sortOrder: currentSortOrder,
          children: [],
          addedAt: new Date(),
        };
        
        newFolders.set(id, stagedFolder);
        
        set({ 
          stagedFolders: newFolders,
          nextSortOrder: currentSortOrder + 1,
        });
        return id;
      },

      removeStagedFolder: (folderId) => {
        const newFolders = new Map(get().stagedFolders);
        const newFiles = new Map(get().stagedFiles);
        
        // Recursively remove folder and all its contents
        const foldersToRemove = [folderId];
        const processedFolders = new Set<string>();
        
        while (foldersToRemove.length > 0) {
          const currentFolderId = foldersToRemove.pop()!;
          if (processedFolders.has(currentFolderId)) continue;
          processedFolders.add(currentFolderId);
          
          // Remove all files in this folder
          newFiles.forEach((file, fileId) => {
            if (file.parentId === currentFolderId) {
              newFiles.delete(fileId);
            }
          });
          
          // Find and queue subfolders for removal
          newFolders.forEach((folder, id) => {
            if (folder.parentId === currentFolderId) {
              foldersToRemove.push(id);
            }
          });
          
          // Remove the folder itself
          newFolders.delete(currentFolderId);
        }
        
        set({ stagedFiles: newFiles, stagedFolders: newFolders });
      },

      renameStagedFolder: (folderId, newName) => {
        const newFolders = new Map(get().stagedFolders);
        const folder = newFolders.get(folderId);
        if (folder) {
          folder.name = newName;
          newFolders.set(folderId, { ...folder });
        }
        set({ stagedFolders: newFolders });
      },

      updateFolderSortOrder: (folderId, sortOrder) => {
        const newFolders = new Map(get().stagedFolders);
        const folder = newFolders.get(folderId);
        if (folder) {
          folder.sortOrder = sortOrder;
          newFolders.set(folderId, { ...folder });
        }
        set({ stagedFolders: newFolders });
      },

      // Batch operations
      removeStagedItems: (itemIds) => {
        itemIds.forEach(id => {
          if (id.startsWith('staged-file-')) {
            get().removeStagedFile(id);
          } else if (id.startsWith('staged-folder-')) {
            get().removeStagedFolder(id);
          }
        });
      },

      clearAllStaged: () => {
        // Clean up all thumbnail URLs before clearing
        const files = get().stagedFiles;
        files.forEach(file => {
          if (file.thumbnailPath) {
            URL.revokeObjectURL(file.thumbnailPath);
          }
        });
        
        set({
          stagedFiles: new Map(),
          stagedFolders: new Map(),
          uploadProgress: 0,
          nextSortOrder: 0,
        });
      },

      updateItemsOrder: (parentId, itemIds) => {
        const newFiles = new Map(get().stagedFiles);
        const newFolders = new Map(get().stagedFolders);
        
        // Update sortOrder based on new order
        itemIds.forEach((itemId, index) => {
          if (itemId.startsWith('staged-file-')) {
            const file = newFiles.get(itemId);
            if (file && file.parentId === parentId) {
              file.sortOrder = index;
              newFiles.set(itemId, { ...file });
            }
          } else if (itemId.startsWith('staged-folder-')) {
            const folder = newFolders.get(itemId);
            if (folder && folder.parentId === parentId) {
              folder.sortOrder = index;
              newFolders.set(itemId, { ...folder });
            }
          }
        });
        
        set({ stagedFiles: newFiles, stagedFolders: newFolders });
      },

      // Upload operations
      updateFileStatus: (fileId, status, progress, error) => {
        const newFiles = new Map(get().stagedFiles);
        const file = newFiles.get(fileId);
        if (file) {
          file.status = status;
          if (progress !== undefined) file.progress = progress;
          if (error !== undefined) file.error = error;
          if (status === 'uploading') {
            file.processingStatus = 'processing';
          } else if (status === 'uploaded') {
            file.processingStatus = 'completed';
          } else if (status === 'error') {
            file.processingStatus = 'failed';
          }
          newFiles.set(fileId, { ...file });
        }
        set({ stagedFiles: newFiles });
      },

      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      setIsUploading: (isUploading) => set({ isUploading }),

      // Modal management
      openUploadModal: (targetFolderId) => set({ 
        isUploadModalOpen: true, 
        targetFolderId 
      }),
      closeUploadModal: () => set({ 
        isUploadModalOpen: false,
        targetFolderId: null,
      }),
      openVerificationModal: () => set({ isVerificationModalOpen: true }),
      closeVerificationModal: () => set({ isVerificationModalOpen: false }),

      // Getters
      getStagedFileCount: () => get().stagedFiles.size,
      
      getTotalStagedSize: () => {
        let total = 0;
        get().stagedFiles.forEach(file => {
          total += file.fileSize;
        });
        return total;
      },
      
      hasAnyStaged: () => get().stagedFiles.size > 0,
      
      getAllStagedItems: () => ({
        files: Array.from(get().stagedFiles.values()),
        folders: Array.from(get().stagedFolders.values()),
      }),
      
      getNextSortOrder: () => get().nextSortOrder,
    }),
    {
      name: 'link-upload-staging-store',
    }
  )
);