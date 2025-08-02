'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// LINK MODAL STORE - Modal state management for link upload feature
// =============================================================================

interface LinkModalState {
  // Upload modal state
  isUploadModalOpen: boolean;
  uploadLinkId: string | undefined;
  uploadFolderId: string | undefined;
}

interface LinkModalActions {
  // Upload modal actions
  openUploadModal: (linkId?: string, folderId?: string) => void;
  closeUploadModal: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: LinkModalState = {
  isUploadModalOpen: false,
  uploadLinkId: undefined,
  uploadFolderId: undefined,
};

export type LinkModalStore = LinkModalState & LinkModalActions;

export const useLinkModalStore = create<LinkModalStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // Upload modal actions
      openUploadModal: (linkId, folderId) => set(() => ({
        isUploadModalOpen: true,
        uploadLinkId: linkId,
        uploadFolderId: folderId,
      })),
      
      closeUploadModal: () => set(() => ({
        isUploadModalOpen: false,
        uploadLinkId: undefined,
        uploadFolderId: undefined,
      })),
      
      // Reset
      reset: () => set(() => initialState),
    }),
    { name: 'LinkModalStore' }
  )
);

// =============================================================================
// HOOK EXPORTS - Following best practices for selector hooks
// =============================================================================

export const useLinkUploadModal = () => {
  const isOpen = useLinkModalStore((state) => state.isUploadModalOpen);
  const linkId = useLinkModalStore((state) => state.uploadLinkId);
  const folderId = useLinkModalStore((state) => state.uploadFolderId);
  const openModal = useLinkModalStore((state) => state.openUploadModal);
  const closeModal = useLinkModalStore((state) => state.closeUploadModal);
  
  return {
    isOpen,
    linkId,
    folderId,
    openModal,
    closeModal,
  };
};