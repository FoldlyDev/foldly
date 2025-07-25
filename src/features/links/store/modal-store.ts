/**
 * Simplified Modal Store - 2025 Best Practices
 * Handles ONLY modal state management using database types
 * No complex state, no CRUD operations - just modal coordination
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Link, LinkType, DatabaseId } from '@/lib/supabase/types';

// Simple modal types - focused only on what modals we can open
type ModalType =
  | 'create-link'
  | 'link-details'
  | 'link-settings'
  | 'share-link'
  | 'delete-confirmation'
  | null;

interface ModalState {
  // Current active modal
  activeModal: ModalType;

  // Modal data - only what's needed to display the modal
  modalData: {
    link?: Link;
    linkType?: LinkType;
  };

  // Simple loading state for modal operations
  isLoading: boolean;
}

interface ModalActions {
  // Modal open actions
  openCreateModal: (linkType?: LinkType) => void;
  openDetailsModal: (link: Link) => void;
  openSettingsModal: (link: Link) => void;
  openShareModal: (link: Link) => void;
  openDeleteModal: (link: Link) => void;

  // Modal close and state management
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state - as simple as possible
const initialState: ModalState = {
  activeModal: null,
  modalData: {},
  isLoading: false,
};

// Create store with minimal state
export const useModalStore = create<ModalState & ModalActions>()(
  devtools(
    set => ({
      ...initialState,

      // Open modals - just set state, no complex logic
      openCreateModal: (linkType = 'base') => {
        set({
          activeModal: 'create-link',
          modalData: { linkType },
          isLoading: false,
        });
      },

      openDetailsModal: link => {
        set({
          activeModal: 'link-details',
          modalData: { link },
          isLoading: false,
        });
      },

      openSettingsModal: link => {
        set({
          activeModal: 'link-settings',
          modalData: { link },
          isLoading: false,
        });
      },

      openShareModal: link => {
        set({
          activeModal: 'share-link',
          modalData: { link },
          isLoading: false,
        });
      },

      openDeleteModal: link => {
        set({
          activeModal: 'delete-confirmation',
          modalData: { link },
          isLoading: false,
        });
      },

      // Close modal - reset everything
      closeModal: () => {
        set(initialState);
      },

      // Loading state for modal operations
      setLoading: isLoading => {
        set({ isLoading });
      },
    }),
    { name: 'ModalStore' }
  )
);

// Simple selectors for components
export const useCurrentModal = () => useModalStore(state => state.activeModal);
export const useModalData = () => useModalStore(state => state.modalData);
export const useModalLoading = () => useModalStore(state => state.isLoading);
