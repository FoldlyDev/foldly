/**
 * LinksModalStore - Focused store for modal state management
 * Handles all modal interactions and state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LinkData } from '../types';
import type { LinkId } from '@/types';

// Modal types
type ModalType =
  | 'create-link'
  | 'link-details'
  | 'link-settings'
  | 'share-link'
  | 'delete-confirmation'
  | 'bulk-actions'
  | null;

// State interface
interface LinksModalState {
  activeModal: ModalType;
  modalData: {
    linkData?: LinkData;
    linkId?: LinkId;
    linkType?: 'base' | 'topic';
    selectedLinkIds?: LinkId[];
    bulkAction?: 'delete' | 'archive' | 'activate' | 'pause';
  };
  isLoading: boolean;
  error: string | null;
  // Branding context and state
  brandingContext: 'creation' | 'settings' | null;
  brandingFormData: {
    brandingEnabled: boolean;
    brandColor: string;
    accentColor: string;
    logoUrl: string;
  };
}

// Actions interface
interface LinksModalActions {
  openCreateLinkModal: (linkType?: 'base' | 'topic') => void;
  openLinkDetailsModal: (linkData: LinkData) => void;
  openLinkSettingsModal: (linkData: LinkData) => void;
  openShareLinkModal: (linkData: LinkData) => void;
  openDeleteConfirmationModal: (linkData: LinkData) => void;
  openBulkActionsModal: (
    selectedLinkIds: LinkId[],
    action: 'delete' | 'archive' | 'activate' | 'pause'
  ) => void;
  closeModal: () => void;
  setModalLoading: (loading: boolean) => void;
  setModalError: (error: string | null) => void;
  updateModalData: (data: Partial<LinksModalState['modalData']>) => void;
  // Branding-specific actions
  updateBrandingData: (
    updates: Partial<LinksModalState['brandingFormData']>
  ) => void;
  initializeBrandingForCreation: () => void;
  initializeBrandingForSettings: (linkData: LinkData) => void;
}

// Create the store
export const useLinksModalStore = create<LinksModalState & LinksModalActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeModal: null,
      modalData: {},
      isLoading: false,
      error: null,
      brandingContext: null,
      brandingFormData: {
        brandingEnabled: false,
        brandColor: '#6c47ff',
        accentColor: '#4ade80',
        logoUrl: '',
      },

      // Actions
      openCreateLinkModal: (linkType = 'base') => {
        console.log(
          '🎪 MODAL STORE: openCreateLinkModal called with linkType:',
          linkType
        );
        set({
          activeModal: 'create-link',
          modalData: { linkType },
          error: null,
          brandingContext: 'creation',
          brandingFormData: {
            brandingEnabled: false, // Start disabled for creation
            brandColor: '#6c47ff',
            accentColor: '#4ade80',
            logoUrl: '',
          },
        });
      },

      openLinkDetailsModal: linkData => {
        console.log(
          '🎪 MODAL STORE: openLinkDetailsModal called with linkData:',
          linkData
        );
        set({
          activeModal: 'link-details',
          modalData: { linkData, linkId: linkData.id as LinkId },
          error: null,
        });
      },

      openLinkSettingsModal: linkData => {
        console.log(
          '🎪 MODAL STORE: openLinkSettingsModal called with linkData:',
          linkData
        );
        set({
          activeModal: 'link-settings',
          modalData: { linkData, linkId: linkData.id as LinkId },
          error: null,
          brandingContext: 'settings',
          brandingFormData: {
            brandingEnabled: linkData.brandingEnabled ?? false,
            brandColor: linkData.brandColor ?? '#6c47ff',
            accentColor: linkData.accentColor ?? '#4ade80',
            logoUrl: linkData.logoUrl ?? '',
          },
        });
      },

      openShareLinkModal: linkData => {
        console.log(
          '🎪 MODAL STORE: openShareLinkModal called with linkData:',
          linkData
        );
        set({
          activeModal: 'share-link',
          modalData: { linkData, linkId: linkData.id as LinkId },
          error: null,
        });
      },

      openDeleteConfirmationModal: linkData => {
        console.log(
          '🎪 MODAL STORE: openDeleteConfirmationModal called with linkData:',
          linkData
        );
        set({
          activeModal: 'delete-confirmation',
          modalData: { linkData, linkId: linkData.id as LinkId },
          error: null,
        });
      },

      openBulkActionsModal: (selectedLinkIds, action) => {
        console.log(
          '🎪 MODAL STORE: openBulkActionsModal called with selectedLinkIds:',
          selectedLinkIds,
          'action:',
          action
        );
        set({
          activeModal: 'bulk-actions',
          modalData: { selectedLinkIds, bulkAction: action },
          error: null,
        });
      },

      closeModal: () => {
        console.log('🎪 MODAL STORE: closeModal called');
        set({
          activeModal: null,
          modalData: {},
          isLoading: false,
          error: null,
          brandingContext: null,
          brandingFormData: {
            brandingEnabled: false,
            brandColor: '#6c47ff',
            accentColor: '#4ade80',
            logoUrl: '',
          },
        });
      },

      setModalLoading: loading => {
        console.log(
          '🎪 MODAL STORE: setModalLoading called with loading:',
          loading
        );
        set({ isLoading: loading });
      },

      setModalError: error => {
        console.log('🎪 MODAL STORE: setModalError called with error:', error);
        set({ error, isLoading: false });
      },

      updateModalData: data => {
        console.log('🎪 MODAL STORE: updateModalData called with data:', data);
        set(state => ({
          modalData: { ...state.modalData, ...data },
        }));
      },

      // Branding-specific actions
      updateBrandingData: updates => {
        console.log('🎨 MODAL STORE: updateBrandingData called with:', updates);
        set(state => ({
          brandingFormData: { ...state.brandingFormData, ...updates },
        }));
      },

      initializeBrandingForCreation: () => {
        console.log('🎨 MODAL STORE: initializeBrandingForCreation');
        set({
          brandingContext: 'creation',
          brandingFormData: {
            brandingEnabled: false, // Start disabled for creation
            brandColor: '#6c47ff',
            accentColor: '#4ade80',
            logoUrl: '',
          },
        });
      },

      initializeBrandingForSettings: linkData => {
        console.log(
          '🎨 MODAL STORE: initializeBrandingForSettings with:',
          linkData
        );
        set({
          brandingContext: 'settings',
          brandingFormData: {
            brandingEnabled: linkData.brandingEnabled ?? false,
            brandColor: linkData.brandColor ?? '#6c47ff',
            accentColor: linkData.accentColor ?? '#4ade80',
            logoUrl: linkData.logoUrl ?? '',
          },
        });
      },
    }),
    { name: 'LinksModalStore' }
  )
);

// Selectors for modal state
export const linksModalSelectors = {
  activeModal: (state: LinksModalState) => state.activeModal,
  modalData: (state: LinksModalState) => state.modalData,
  isModalOpen: (modalType?: ModalType) => (state: LinksModalState) =>
    modalType ? state.activeModal === modalType : state.activeModal !== null,
  isLoading: (state: LinksModalState) => state.isLoading,
  error: (state: LinksModalState) => state.error,

  // Branding selectors
  brandingContext: (state: LinksModalState) => state.brandingContext,
  brandingFormData: (state: LinksModalState) => state.brandingFormData,
  isCreationContext: (state: LinksModalState) =>
    state.brandingContext === 'creation',
  isSettingsContext: (state: LinksModalState) =>
    state.brandingContext === 'settings',

  // Specific modal checkers
  isCreateLinkModalOpen: (state: LinksModalState) =>
    state.activeModal === 'create-link',
  isLinkDetailsModalOpen: (state: LinksModalState) =>
    state.activeModal === 'link-details',
  isLinkSettingsModalOpen: (state: LinksModalState) =>
    state.activeModal === 'link-settings',
  isShareLinkModalOpen: (state: LinksModalState) =>
    state.activeModal === 'share-link',
  isDeleteConfirmationModalOpen: (state: LinksModalState) =>
    state.activeModal === 'delete-confirmation',
  isBulkActionsModalOpen: (state: LinksModalState) =>
    state.activeModal === 'bulk-actions',
};
