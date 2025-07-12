// =============================================================================
// WORKSPACE CONTEXT MENU - Context menu for workspace tree nodes
// =============================================================================
// 🎯 Full CRUD operations for workspace files and folders

import React, { memo, useCallback, useState } from 'react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/shadcn/context-menu';
import {
  Download,
  Trash2,
  Edit3,
  FolderPlus,
  Move,
  Copy,
  Share,
  Info,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import type { TreeNode } from '@/types/file-tree';

// =============================================================================
// WORKSPACE CONTEXT MENU PROPS
// =============================================================================

interface WorkspaceContextMenuProps {
  node: TreeNode;
}

// =============================================================================
// WORKSPACE CONTEXT MENU COMPONENT
// =============================================================================

const WorkspaceContextMenuComponent: React.FC<WorkspaceContextMenuProps> = ({
  node,
}) => {
  const { selectedNodes, hideContextMenu } = useTreeStore();
  const {
    createFolder,
    deleteItem,
    renameItem,
    moveItem,
    downloadItem,
    batchDelete,
    isLoading,
  } = useTreeActions('workspace');

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const hasMultipleSelection = selectedNodes.size > 1;
  const isFolder = node.type === 'folder';
  const isFile = node.type === 'file';

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleCreateFolder = useCallback(async () => {
    try {
      await createFolder({
        name: 'New Folder',
        parentId: isFolder ? node.id : node.parentId,
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
    hideContextMenu();
  }, [createFolder, isFolder, node.id, node.parentId, hideContextMenu]);

  const handleRename = useCallback(async () => {
    if (!newName.trim() || newName === node.name) {
      setIsRenaming(false);
      return;
    }

    try {
      await renameItem({
        nodeId: node.id,
        newName: newName.trim(),
      });
    } catch (error) {
      console.error('Failed to rename item:', error);
    }

    setIsRenaming(false);
    hideContextMenu();
  }, [renameItem, node.id, node.name, newName, hideContextMenu]);

  const handleDelete = useCallback(async () => {
    if (hasMultipleSelection) {
      const nodeIds = Array.from(selectedNodes);
      try {
        await batchDelete(nodeIds);
      } catch (error) {
        console.error('Failed to delete items:', error);
      }
    } else {
      try {
        await deleteItem(node.id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
    hideContextMenu();
  }, [
    hasMultipleSelection,
    selectedNodes,
    batchDelete,
    deleteItem,
    node.id,
    hideContextMenu,
  ]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadItem(node.id);
    } catch (error) {
      console.error('Failed to download item:', error);
    }
    hideContextMenu();
  }, [downloadItem, node.id, hideContextMenu]);

  const handleMove = useCallback(() => {
    // TODO: Implement move dialog
    console.log('Move item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleCopy = useCallback(() => {
    // TODO: Implement copy functionality
    console.log('Copy item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Share item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleShowInfo = useCallback(() => {
    // TODO: Implement info dialog
    console.log('Show info for:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleArchive = useCallback(() => {
    // TODO: Implement archive functionality
    console.log('Archive item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleToggleVisibility = useCallback(() => {
    // TODO: Implement visibility toggle
    console.log('Toggle visibility for:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderFolderActions = useCallback(() => {
    if (!isFolder) return null;

    return (
      <>
        <ContextMenuItem onClick={handleCreateFolder} disabled={isLoading}>
          <FolderPlus className='w-4 h-4 mr-2' />
          Add Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [isFolder, handleCreateFolder, isLoading]);

  const renderBatchActions = useCallback(() => {
    if (!hasMultipleSelection) return null;

    return (
      <>
        <ContextMenuItem onClick={handleDelete} disabled={isLoading}>
          <Trash2 className='w-4 h-4 mr-2' />
          Delete {selectedNodes.size} items
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [hasMultipleSelection, handleDelete, isLoading, selectedNodes.size]);

  const renderMoveSubmenu = useCallback(
    () => (
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Move className='w-4 h-4 mr-2' />
          Move to
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={handleMove}>
            <FolderPlus className='w-4 h-4 mr-2' />
            Choose folder...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleMove()}>
            <Archive className='w-4 h-4 mr-2' />
            Root folder
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    ),
    [handleMove]
  );

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  return (
    <>
      {renderFolderActions()}
      {renderBatchActions()}

      <ContextMenuItem onClick={handleDownload} disabled={isLoading}>
        <Download className='w-4 h-4 mr-2' />
        Download
      </ContextMenuItem>

      <ContextMenuItem onClick={handleRename} disabled={isLoading}>
        <Edit3 className='w-4 h-4 mr-2' />
        Rename
      </ContextMenuItem>

      <ContextMenuItem onClick={handleCopy} disabled={isLoading}>
        <Copy className='w-4 h-4 mr-2' />
        Duplicate
      </ContextMenuItem>

      {renderMoveSubmenu()}

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleShare} disabled={isLoading}>
        <Share className='w-4 h-4 mr-2' />
        Share
      </ContextMenuItem>

      <ContextMenuItem onClick={handleToggleVisibility} disabled={isLoading}>
        <Eye className='w-4 h-4 mr-2' />
        Make Public
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleShowInfo} disabled={isLoading}>
        <Info className='w-4 h-4 mr-2' />
        Properties
      </ContextMenuItem>

      <ContextMenuItem onClick={handleArchive} disabled={isLoading}>
        <Archive className='w-4 h-4 mr-2' />
        Archive
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={handleDelete}
        disabled={isLoading}
        className='text-destructive focus:text-destructive'
      >
        <Trash2 className='w-4 h-4 mr-2' />
        {hasMultipleSelection ? `Delete ${selectedNodes.size} items` : 'Delete'}
      </ContextMenuItem>
    </>
  );
};

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const WorkspaceContextMenu = memo(WorkspaceContextMenuComponent);
export { WorkspaceContextMenuComponent };

// Default export for convenience
export default WorkspaceContextMenu;
