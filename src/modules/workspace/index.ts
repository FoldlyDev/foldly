// =============================================================================
// WORKSPACE MODULE EXPORTS
// =============================================================================
// Module-specific exports for Workspace Module
// Components, actions, hooks, and types

// =============================================================================
// Components
// =============================================================================
export * from './components';

// =============================================================================
// Folder-Link Actions (Module-specific)
// =============================================================================
export {
  linkFolderToExistingLinkAction,
  linkFolderWithNewLinkAction,
  unlinkFolderAction,
  getAvailableLinksAction,
} from './lib/actions/folder-link.actions';

// =============================================================================
// Folder-Link Hooks (Module-specific)
// =============================================================================
export {
  useAvailableLinks,
  useLinkFolderToExistingLink,
  useLinkFolderWithNewLink,
  useUnlinkFolder,
} from './hooks/use-folder-link';

// =============================================================================
// Types (from validation schemas)
// =============================================================================
export type {
  LinkFolderToExistingLinkInput,
  LinkFolderWithNewLinkInput,
  UnlinkFolderInput,
} from '@/lib/validation/folder-link-schemas';
