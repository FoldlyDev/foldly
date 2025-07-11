'use client';

import { useModalStore } from '../../store';
import { LinkDetailsModal, ShareModal, SettingsModal } from '../modals';
import { CreateLinkModal } from '../modals/CreateLinkModal';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';

/**
 * LinksModalManager - Centralized modal management using store architecture
 * Eliminates prop drilling by managing all modal state through stores
 * Follows 2025 React + Zustand best practices
 * Uses proper two-step modal (information + branding) for both base and topic links
 */
export function LinksModalManager() {
  const { activeModal, modalData } = useModalStore();

  // Return null if no modal is active
  if (!activeModal) {
    return null;
  }

  // Render the appropriate modal based on active modal type
  switch (activeModal) {
    case 'create-link':
      return <CreateLinkModal />;

    case 'link-details':
      if (!modalData.link) {
        return null;
      }
      return <LinkDetailsModal />;

    case 'share-link':
      if (!modalData.link) {
        return null;
      }
      return <ShareModal />;

    case 'link-settings':
      if (!modalData.link) {
        return null;
      }
      return <SettingsModal />;

    case 'delete-confirmation':
      if (!modalData.link) {
        return null;
      }
      return <DeleteConfirmationModal />;

    default:
      return null;
  }
}
