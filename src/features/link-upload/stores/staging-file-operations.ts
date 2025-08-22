import type { WritableDraft } from 'immer';
import type { StagingState, StagedFile } from './staging-types';

/**
 * File operations for the staging store
 */
export const fileOperations = {
  addFiles: (state: WritableDraft<StagingState>, files: File[], parentFolderId?: string) => {
    // Calculate the starting sort order for new files
    const existingFilesInParent = Array.from(state.stagedFiles.values())
      .filter(f => f.parentFolderId === parentFolderId);
    const nextSortOrder = existingFilesInParent.length;
    
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
  },

  removeFile: (state: WritableDraft<StagingState>, fileId: string) => {
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
  },

  updateFileStatus: (
    state: WritableDraft<StagingState>, 
    fileId: string, 
    status: StagedFile['status'], 
    progress = 0, 
    error?: string
  ) => {
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
  },
};