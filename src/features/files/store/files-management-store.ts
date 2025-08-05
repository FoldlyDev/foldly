import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { 
  FilesUIState, 
  CopyProgress, 
  ContextMenuAction,
  TreeNode 
} from '../types';

// Enable MapSet plugin for Immer to work with Set and Map
enableMapSet();

interface FilesManagementStore extends FilesUIState {
  // Selection actions
  selectLink: (linkId: string) => void;
  toggleFileSelection: (fileId: string, isMultiSelect?: boolean) => void;
  toggleFolderSelection: (folderId: string, isMultiSelect?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Copy operations
  startCopyOperation: (files: TreeNode[]) => void;
  updateCopyProgress: (fileId: string, progress: number) => void;
  completeCopyOperation: (fileId: string) => void;
  failCopyOperation: (fileId: string, error: string) => void;
  clearCompletedOperations: () => void;
  
  // UI actions
  toggleLinkExpanded: (linkId: string) => void;
  expandAllLinks: () => void;
  collapseAllLinks: () => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Modal actions
  openWorkspaceFolderPicker: (destinationFolderId?: string) => void;
  closeWorkspaceFolderPicker: () => void;
  setDestinationFolder: (folderId: string | null) => void;
  
  // Context menu
  openContextMenu: (position: { x: number; y: number }, target: { id: string; type: 'file' | 'folder' }) => void;
  closeContextMenu: () => void;
  handleContextMenuAction: (action: ContextMenuAction) => void;
}

export const useFilesManagementStore = create<FilesManagementStore>()(
  immer((set, get) => ({
    // Initial state
    selectedLinkId: null,
    selectedFiles: new Set(),
    selectedFolders: new Set(),
    copyOperations: new Map(),
    isCopying: false,
    destinationFolderId: null,
    expandedLinks: new Set(),
    searchQuery: '',
    viewMode: 'list',
    isWorkspaceFolderPickerOpen: false,
    contextMenuPosition: null,
    contextMenuTarget: null,

    // Selection actions
    selectLink: (linkId) => set((state) => {
      state.selectedLinkId = linkId;
      // Clear file selections when switching links
      state.selectedFiles.clear();
      state.selectedFolders.clear();
    }),

    toggleFileSelection: (fileId, isMultiSelect = false) => set((state) => {
      if (!isMultiSelect) {
        state.selectedFiles.clear();
        state.selectedFolders.clear();
      }
      
      if (state.selectedFiles.has(fileId)) {
        state.selectedFiles.delete(fileId);
      } else {
        state.selectedFiles.add(fileId);
      }
    }),

    toggleFolderSelection: (folderId, isMultiSelect = false) => set((state) => {
      if (!isMultiSelect) {
        state.selectedFiles.clear();
        state.selectedFolders.clear();
      }
      
      if (state.selectedFolders.has(folderId)) {
        state.selectedFolders.delete(folderId);
      } else {
        state.selectedFolders.add(folderId);
      }
    }),

    selectAll: () => set((state) => {
      // This would be implemented with actual file/folder data
      console.log('Select all not yet implemented');
    }),

    deselectAll: () => set((state) => {
      state.selectedFiles.clear();
      state.selectedFolders.clear();
    }),

    // Copy operations
    startCopyOperation: (files) => set((state) => {
      state.isCopying = true;
      files.forEach(file => {
        const progress: CopyProgress = {
          fileId: file.id,
          fileName: file.name,
          progress: 0,
          status: 'pending',
        };
        state.copyOperations.set(file.id, progress);
      });
    }),

    updateCopyProgress: (fileId, progress) => set((state) => {
      const operation = state.copyOperations.get(fileId);
      if (operation) {
        operation.progress = progress;
        operation.status = 'copying';
      }
    }),

    completeCopyOperation: (fileId) => set((state) => {
      const operation = state.copyOperations.get(fileId);
      if (operation) {
        operation.progress = 100;
        operation.status = 'completed';
      }
      
      // Check if all operations are complete
      const allComplete = Array.from(state.copyOperations.values()).every(
        op => op.status === 'completed' || op.status === 'error'
      );
      
      if (allComplete) {
        state.isCopying = false;
      }
    }),

    failCopyOperation: (fileId, error) => set((state) => {
      const operation = state.copyOperations.get(fileId);
      if (operation) {
        operation.status = 'error';
        operation.error = error;
      }
    }),

    clearCompletedOperations: () => set((state) => {
      state.copyOperations.clear();
      state.isCopying = false;
    }),

    // UI actions
    toggleLinkExpanded: (linkId) => set((state) => {
      if (state.expandedLinks.has(linkId)) {
        state.expandedLinks.delete(linkId);
      } else {
        state.expandedLinks.add(linkId);
      }
    }),

    expandAllLinks: () => set((state) => {
      // This would be implemented with actual link data
      console.log('Expand all not yet implemented');
    }),

    collapseAllLinks: () => set((state) => {
      state.expandedLinks.clear();
    }),

    setSearchQuery: (query) => set((state) => {
      state.searchQuery = query;
    }),

    setViewMode: (mode) => set((state) => {
      state.viewMode = mode;
    }),

    // Modal actions
    openWorkspaceFolderPicker: (destinationFolderId) => set((state) => {
      state.isWorkspaceFolderPickerOpen = true;
      if (destinationFolderId) {
        state.destinationFolderId = destinationFolderId;
      }
    }),

    closeWorkspaceFolderPicker: () => set((state) => {
      state.isWorkspaceFolderPickerOpen = false;
    }),

    setDestinationFolder: (folderId) => set((state) => {
      state.destinationFolderId = folderId;
    }),

    // Context menu
    openContextMenu: (position, target) => set((state) => {
      state.contextMenuPosition = position;
      state.contextMenuTarget = target;
    }),

    closeContextMenu: () => set((state) => {
      state.contextMenuPosition = null;
      state.contextMenuTarget = null;
    }),

    handleContextMenuAction: (action) => {
      const state = get();
      
      switch (action) {
        case 'copyToWorkspace':
          state.openWorkspaceFolderPicker();
          break;
        case 'viewDetails':
          // TODO: Implement view details modal
          console.log('View details not yet implemented');
          break;
        case 'select':
          if (state.contextMenuTarget) {
            if (state.contextMenuTarget.type === 'file') {
              state.toggleFileSelection(state.contextMenuTarget.id);
            } else {
              state.toggleFolderSelection(state.contextMenuTarget.id);
            }
          }
          break;
        case 'selectAll':
          state.selectAll();
          break;
        case 'deselectAll':
          state.deselectAll();
          break;
      }
      
      state.closeContextMenu();
    },
  }))
);