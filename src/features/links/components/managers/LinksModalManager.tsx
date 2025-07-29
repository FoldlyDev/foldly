'use client';

import { lazy, Suspense } from 'react';
import { useModalStore } from '../../store';

// Lazy load all modal components for better performance
const CreateLinkModal = lazy(() =>
  import('../modals/CreateLinkModal').then(m => ({
    default: m.CreateLinkModal,
  }))
);
const LinkDetailsModal = lazy(() =>
  import('../modals/LinkDetailsModal').then(m => ({
    default: m.LinkDetailsModal,
  }))
);
const ShareModal = lazy(() =>
  import('../modals/ShareModal').then(m => ({ default: m.ShareModal }))
);
const SettingsModal = lazy(() =>
  import('../modals/SettingsModal').then(m => ({ default: m.SettingsModal }))
);
const DeleteConfirmationModal = lazy(() =>
  import('../modals/DeleteConfirmationModal').then(m => ({
    default: m.DeleteConfirmationModal,
  }))
);

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

  // Render the appropriate modal based on active modal type with Suspense
  const renderModal = () => {
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
  };

  const modal = renderModal();
  if (!modal) return null;

  // Wrap modal in Suspense for lazy loading
  return (
    <Suspense
      fallback={
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </div>
      }
    >
      {modal}
    </Suspense>
  );
}
