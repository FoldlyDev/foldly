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
 * - Right-click for context menu
 * - Rename items
 * - Delete items
 * - Drag items OUT to workspace (but not accept drops)
 * - Reorder items within the tree
 */
export const interactiveLinkTreeConfig: TreeConfiguration = createTreeConfig(
  'interactive-link-tree',
  'Interactive Link Tree',
  'Full-featured tree for base and topic links with all interactions enabled',
  {
    features: {
      // Core interactions - all enabled
      selection: true,
      multiSelect: true,
      checkboxes: true,
      search: true,
      
      // Item operations - all enabled
      contextMenu: true,
      rename: true,
      delete: true,
      
      // Drag and drop - can drag out and reorder internally
      dragDrop: true,           // Internal reordering enabled
      foreignDrag: true,         // Can drag OUT to workspace
      acceptDrops: false,        // Cannot accept drops from outside
      externalFileDrop: false,   // No OS file drops (uploads go through upload modal)
    },
    
    display: {
      showFileSize: true,
      showFileDate: false,      // Can be toggled by user preference
      showFileStatus: true,      // Show processing status
      showFolderCount: true,
      showFolderSize: false,     // Performance consideration
    },
    
    permissions: {
      canDragItems: true,        // All items can be dragged
      canDropItems: false,       // Cannot drop items from outside
      canRename: true,           // Can rename all items
      canDelete: true,           // Can delete all items
      canCreateFolder: true,     // Can create folders
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