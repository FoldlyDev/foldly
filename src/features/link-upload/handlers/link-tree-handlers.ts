/**
 * Facade for link tree handlers
 * Delegates to specialized handlers for different operations
 */

// Re-export drop handlers
export { handleLinkDrop } from './link-tree-drop-handlers';

// Re-export rename handler
export { handleLinkRename } from './link-tree-rename-handler';

// Re-export foreign drag handlers
export { 
  handleLinkDropForeignDragObject,
  handleLinkCompleteForeignDrop,
  createLinkForeignDragObject,
  canLinkDropForeignDragObject
} from './link-tree-foreign-handlers';