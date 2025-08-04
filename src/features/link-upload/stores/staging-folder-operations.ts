import type { WritableDraft } from 'immer';
import type { StagingState, StagedFolder } from './staging-types';

/**
 * Folder operations for the staging store
 */
export const folderOperations = {
  addFolder: (state: WritableDraft<StagingState>, name: string, parentFolderId?: string): string => {
    const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate sort order for the new folder
    const existingFoldersInParent = Array.from(state.stagedFolders.values())
      .filter(f => f.parentFolderId === parentFolderId);
    const sortOrder = existingFoldersInParent.length;
    
    const stagedFolder: StagedFolder = {
      id,
      name,
      ...(parentFolderId !== undefined && parentFolderId !== null && { parentFolderId }),
      children: [],
      status: 'staged',
      sortOrder,
    };
    
    state.stagedFolders.set(id, stagedFolder);
    
    // Update parent folder if specified and exists in staged folders
    if (parentFolderId && state.stagedFolders.has(parentFolderId)) {
      const parentFolder = state.stagedFolders.get(parentFolderId)!;
      // Ensure parent has children array
      if (!parentFolder.children) {
        parentFolder.children = [];
      }
      // Add to parent's children if not already there
      if (!parentFolder.children.includes(id)) {
        parentFolder.children.push(id);
      }
    }
    
    // Update upload progress total
    state.uploadProgress.total = state.stagedFiles.size + state.stagedFolders.size;
    
    // Increment version to trigger re-renders
    state.version++;
    
    return id;
  },

  removeFolder: (state: WritableDraft<StagingState>, folderId: string) => {
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
  },

  updateFolderStatus: (
    state: WritableDraft<StagingState>, 
    folderId: string, 
    status: StagedFolder['status'], 
    error?: string
  ) => {
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
  },

  moveStagedItem: (state: WritableDraft<StagingState>, itemId: string, newParentId?: string) => {
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
  },
};