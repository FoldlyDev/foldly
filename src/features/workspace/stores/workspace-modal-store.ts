'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// WORKSPACE MODAL STORE - Modal state management for workspace feature
// =============================================================================

interface WorkspaceModalState {
  // Upload modal state
  isUploadModalOpen: boolean;
  uploadWorkspaceId: string | undefined;
  uploadFolderId: string | undefined;
}

interface WorkspaceModalActions {
  // Upload modal actions
  openUploadModal: (workspaceId?: string, folderId?: string) => void;
  closeUploadModal: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: WorkspaceModalState = {
  isUploadModalOpen: false,
  uploadWorkspaceId: undefined,
  uploadFolderId: undefined,
};

export type WorkspaceModalStore = WorkspaceModalState & WorkspaceModalActions;

export const useWorkspaceModalStore = create<WorkspaceModalStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // Upload modal actions
      openUploadModal: (workspaceId, folderId) => set(() => ({
        isUploadModalOpen: true,
        uploadWorkspaceId: workspaceId,
        uploadFolderId: folderId,
      })),
      
      closeUploadModal: () => set(() => ({
        isUploadModalOpen: false,
        uploadWorkspaceId: undefined,
        uploadFolderId: undefined,
      })),
      
      // Reset
      reset: () => set(() => initialState),
    }),
    { name: 'WorkspaceModalStore' }
  )
);

// =============================================================================
// HOOK EXPORTS - Following best practices for selector hooks
// =============================================================================

export const useWorkspaceUploadModal = () => {
  const isOpen = useWorkspaceModalStore((state) => state.isUploadModalOpen);
  const workspaceId = useWorkspaceModalStore((state) => state.uploadWorkspaceId);
  const folderId = useWorkspaceModalStore((state) => state.uploadFolderId);
  const openModal = useWorkspaceModalStore((state) => state.openUploadModal);
  const closeModal = useWorkspaceModalStore((state) => state.closeUploadModal);
  
  return {
    isOpen,
    workspaceId,
    folderId,
    openModal,
    closeModal,
  };
};