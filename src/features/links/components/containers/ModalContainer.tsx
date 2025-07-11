/**
 * Unified Modal Container - 2025 Best Practices
 * Renders all modals based on modal store state
 * Keeps modal logic centralized and simple
 */

import { LinkDetailsModal } from '../modals/LinkDetailsModal';
import { ShareModal } from '../modals/ShareModal';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import { SettingsModal } from '../modals/SettingsModal';
// Note: CreateLinkModal would be imported when it's refactored

export function ModalContainer() {
  return (
    <>
      <LinkDetailsModal />
      <ShareModal />
      <DeleteConfirmationModal />
      <SettingsModal />
      {/* CreateLinkModal will be added here when refactored */}
    </>
  );
}
