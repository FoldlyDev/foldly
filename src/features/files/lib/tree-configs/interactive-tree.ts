// =============================================================================
// INTERACTIVE TREE CONFIGURATION - For base and topic links
// =============================================================================
// 🎯 Purpose: Configuration for fully interactive link trees
// 📦 Used by: Base link and topic link panels
// 🔧 Features: Full interaction including selection, context menu, and drag out

import { createTreeConfig, type TreeConfiguration } from './base-config';

/**
 * Interactive link tree configuration
 * Used for base links and topic links where users can:
 * - Select items (single and multi)
 * - Use checkboxes for batch operations
 * - Search/filter items
 * - Right-click for context menu (delete only)
 * - Delete items
 * 
 * NOTE: Link owners can only DELETE files/folders, not rename or create new ones
 */
export const interactiveLinkTreeConfig: TreeConfiguration = createTreeConfig(
  'interactive-link-tree',
  'Interactive Link Tree',
  'Tree for base and topic links with delete-only permissions for owners',
  {
    features: {
      // Core interactions - selection enabled
      selection: true,
      multiSelect: true,
      checkboxes: true,
      search: true,
      
      // Item operations - delete only
      contextMenu: true,
      rename: false,           // Link owners cannot rename
      delete: true,            // Link owners can delete
      
      // Drag and drop - disabled
      dragDrop: false,         // No internal reordering
      foreignDrag: false,      // Cannot drag to other trees
      acceptDrops: false,      // Cannot accept drops from outside
      externalFileDrop: false, // No OS file drops
    },
    
    display: {
      showFileSize: true,
      showFileDate: false,      // Can be toggled by user preference
      showFileStatus: true,      // Show processing status
      showFolderCount: true,
      showFolderSize: false,     // Performance consideration
    },
    
    permissions: {
      canDragItems: false,       // No dragging
      canDropItems: false,       // Cannot drop items
      canRename: false,          // Cannot rename items
      canDelete: true,           // Can delete all items
      canCreateFolder: false,    // Cannot create folders
    },
  }
);

/**
 * Base link tree configuration
 * Slightly different from topic links - might have different permissions
 * But for now, using same as interactive link tree
 */
export const baseLinkTreeConfig: TreeConfiguration = {
  ...interactiveLinkTreeConfig,
  id: 'base-link-tree',
  name: 'Base Link Tree',
  description: 'Tree for the user\'s base link with full interaction capabilities',
};

/**
 * Topic link tree configuration
 * Same as base link but with specific ID for tracking
 */
export const topicLinkTreeConfig: TreeConfiguration = {
  ...interactiveLinkTreeConfig,
  id: 'topic-link-tree',
  name: 'Topic Link Tree',
  description: 'Tree for topic links with full interaction capabilities',
};