/**
 * Type definitions for the staging store
 */

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

export interface StagingStore extends StagingState {
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