'use client';

import { useLinksModalsStore } from '../../hooks/use-links-composite';
import { LinkDetailsModal, ShareModal, SettingsModal } from './link-modals';
import { CreateLinkModalContainer } from './CreateLinkModalContainer';
import { DeleteConfirmationModal } from './delete-confirmation-modal';

/**
 * LinksModalManager - Centralized modal management using store architecture
 * Eliminates prop drilling by managing all modal state through stores
 * Follows 2025 React + Zustand best practices
 * Uses proper two-step modal (information + branding) for both base and topic links
 */
export function LinksModalManager() {
  const { activeModal, modalData, closeModal } = useLinksModalsStore();

  console.log('🎭 MODAL MANAGER: Render triggered');
  console.log('🎭 MODAL MANAGER: activeModal =', activeModal);
  console.log('🎭 MODAL MANAGER: modalData =', modalData);

  // Return null if no modal is active
  if (!activeModal) {
    console.log('🎭 MODAL MANAGER: No active modal, returning null');
    return null;
  }

  console.log('🎭 MODAL MANAGER: Rendering modal:', activeModal);

  // Render the appropriate modal based on active modal type
  switch (activeModal) {
    case 'create-link':
      console.log(
        '🎭 MODAL MANAGER: Rendering CreateLinkModalContainer with two-step structure'
      );
      return <CreateLinkModalContainer />;

    case 'link-details':
      if (!modalData.linkData) {
        console.log(
          '🎭 MODAL MANAGER: link-details modal but no linkData, returning null'
        );
        return null;
      }
      console.log(
        '🎭 MODAL MANAGER: Rendering LinkDetailsModal with data:',
        modalData.linkData
      );
      return (
        <LinkDetailsModal
          isOpen={true}
          onClose={() => {
            console.log('🎭 MODAL MANAGER: LinkDetailsModal onClose called');
            closeModal();
          }}
          link={modalData.linkData}
        />
      );

    case 'share-link':
      if (!modalData.linkData) {
        console.log(
          '🎭 MODAL MANAGER: share-link modal but no linkData, returning null'
        );
        return null;
      }
      console.log(
        '🎭 MODAL MANAGER: Rendering ShareModal with data:',
        modalData.linkData
      );
      return (
        <ShareModal
          isOpen={true}
          onClose={() => {
            console.log('🎭 MODAL MANAGER: ShareModal onClose called');
            closeModal();
          }}
          link={modalData.linkData}
        />
      );

    case 'link-settings':
      if (!modalData.linkData) {
        console.log(
          '🎭 MODAL MANAGER: link-settings modal but no linkData, returning null'
        );
        return null;
      }
      console.log(
        '🎭 MODAL MANAGER: Rendering SettingsModal with data:',
        modalData.linkData
      );
      return (
        <SettingsModal
          isOpen={true}
          onClose={() => {
            console.log('🎭 MODAL MANAGER: SettingsModal onClose called');
            closeModal();
          }}
          link={modalData.linkData}
        />
      );

    case 'delete-confirmation':
      if (!modalData.linkData) {
        console.log(
          '🎭 MODAL MANAGER: delete-confirmation modal but no linkData, returning null'
        );
        return null;
      }
      console.log(
        '🎭 MODAL MANAGER: Rendering DeleteConfirmationModal with data:',
        modalData.linkData
      );
      return (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => {
            console.log(
              '🎭 MODAL MANAGER: DeleteConfirmationModal onClose called'
            );
            closeModal();
          }}
          link={modalData.linkData}
        />
      );

    case 'bulk-actions':
      // TODO: Implement bulk actions modal
      console.log('🎭 MODAL MANAGER: bulk-actions modal not implemented yet');
      return null;

    default:
      console.log('🎭 MODAL MANAGER: Unknown modal type:', activeModal);
      return null;
  }
}
