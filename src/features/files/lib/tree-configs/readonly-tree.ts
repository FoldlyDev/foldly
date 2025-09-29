// =============================================================================
// READ-ONLY TREE CONFIGURATIONS - For generated links and workspace view
// =============================================================================
// 🎯 Purpose: Configurations for read-only tree displays
// 📦 Used by: Generated links (fully static) and workspace (drag source only)
// 🔧 Features: Limited interaction based on tree purpose

import { createTreeConfig, type TreeConfiguration } from './base-config';

/**
 * Generated link tree configuration
 * Completely read-only, no interactions except expand/collapse
 * Used to display the structure of generated links
 */
export const generatedLinkTreeConfig: TreeConfiguration = createTreeConfig(
  'generated-link-tree',
  'Generated Link Tree',
  'Completely read-only tree for displaying generated link structure',
  {
    features: {
      // No interactions at all
      selection: true, // No selection
      multiSelect: false, // No multi-selection
      checkboxes: false, // No checkboxes
      search: true, // Allow search for finding items

      // No item operations
      contextMenu: false, // No context menu
      rename: false, // Cannot rename
      delete: false, // Cannot delete

      // Drag and drop - limited to dragging out
      dragDrop: false, // No internal reordering
      foreignDrag: true, // CAN drag to workspace for copying
      acceptDrops: false, // Cannot accept drops
      externalFileDrop: false, // No OS file drops
    },

    display: {
      showFileSize: true, // Show for information
      showFileDate: false, // Keep minimal
      showFileStatus: false, // Not relevant for generated
      showFolderCount: true, // Show folder counts
      showFolderSize: false, // Performance consideration
    },

    permissions: {
      canDragItems: true, // Can drag items to copy to workspace
      canDropItems: false, // No dropping
      canRename: false, // No renaming
      canDelete: false, // No deleting
      canCreateFolder: false, // No folder creation
    },
  }
);

/**
 * Workspace read-only tree configuration
 * Read-only but allows selection and dragging FROM it
 * Users can drag items from workspace to copy them
 */
export const workspaceReadOnlyTreeConfig: TreeConfiguration = createTreeConfig(
  'workspace-readonly-tree',
  'Workspace Read-Only Tree',
  'Read-only workspace view that allows dragging items out for copying',
  {
    features: {
      // Limited interactions
      selection: true, // Allow selection for drag initiation
      multiSelect: false, // Allow multi-select for batch drag
      checkboxes: false, // No checkboxes (read-only)
      search: false, // Allow search

      // No item operations (read-only)
      contextMenu: false, // No context menu in read-only mode
      rename: false, // Cannot rename (read-only)
      delete: false, // Cannot delete (read-only)

      // Drag out only, no drops or reordering
      dragDrop: true, // No internal reordering (read-only)
      foreignDrag: false, // CAN drag OUT to user's actual workspace
      acceptDrops: true, // CAN accept drops from link trees
      externalFileDrop: true, // No direct OS file drops (use upload modal)
    },

    display: {
      showFileSize: true,
      showFileDate: false,
      showFileStatus: false, // Not relevant in read-only view
      showFolderCount: true,
      showFolderSize: false,
    },

    permissions: {
      canDragItems: false, // Can drag items OUT for copying
      canDropItems: true, // Can accept drops from link trees
      canRename: false, // No renaming (read-only)
      canDelete: false, // No deleting (read-only)
      canCreateFolder: false, // No folder creation (read-only)
    },
  }
);
