// =============================================================================
// UPLOAD CONTEXT MENU - Context menu for upload feature tree nodes
// =============================================================================
// 🎯 File organization operations during upload process

import React, { memo, useCallback } from 'react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/shadcn/context-menu';
import {
  Trash2,
  Edit3,
  FolderPlus,
  Move,
  Upload,
  Eye,
  Info,
} from 'lucide-react';
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import type { TreeNode } from '@/types/file-tree';

// =============================================================================
// UPLOAD CONTEXT MENU PROPS
// =============================================================================

interface UploadContextMenuProps {
  node: TreeNode;
}

// =============================================================================
// UPLOAD CONTEXT MENU COMPONENT
// =============================================================================

const UploadContextMenuComponent: React.FC<UploadContextMenuProps> = ({
  node,
}) => {
  const { selectedNodes, hideContextMenu } = useTreeStore();
  const {
    createFolder,
    deleteItem,
    renameItem,
    moveItem,
    batchDelete,
    batchMove,
    isLoading,
  } = useTreeActions('upload');

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
    const newName = prompt('Enter new name:', node.name);
    if (!newName || newName === node.name) return;

    try {
      await renameItem({
        nodeId: node.id,
        newName: newName.trim(),
      });
    } catch (error) {
      console.error('Failed to rename item:', error);
    }
    hideContextMenu();
  }, [renameItem, node.id, node.name, hideContextMenu]);

  const handleRemove = useCallback(async () => {
    if (hasMultipleSelection) {
      const nodeIds = Array.from(selectedNodes);
      try {
        await batchDelete(nodeIds);
      } catch (error) {
        console.error('Failed to remove items:', error);
      }
    } else {
      try {
        await deleteItem(node.id);
      } catch (error) {
        console.error('Failed to remove item:', error);
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

  const handleMove = useCallback(async () => {
    // TODO: Implement move dialog for upload structure
    console.log('Move item in upload structure:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handlePreview = useCallback(() => {
    // TODO: Implement file preview functionality
    console.log('Preview file:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleShowInfo = useCallback(() => {
    // TODO: Implement file info dialog
    console.log('Show info for:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleMoveToRoot = useCallback(async () => {
    if (hasMultipleSelection) {
      const nodeIds = Array.from(selectedNodes);
      try {
        await batchMove({ nodeIds, targetId: 'root' });
      } catch (error) {
        console.error('Failed to move items to root:', error);
      }
    } else {
      try {
        await moveItem({ nodeId: node.id, targetId: 'root' });
      } catch (error) {
        console.error('Failed to move item to root:', error);
      }
    }
    hideContextMenu();
  }, [
    hasMultipleSelection,
    selectedNodes,
    batchMove,
    moveItem,
    node.id,
    hideContextMenu,
  ]);

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

  const renderFileActions = useCallback(() => {
    if (!isFile) return null;

    return (
      <>
        <ContextMenuItem onClick={handlePreview} disabled={isLoading}>
          <Eye className='w-4 h-4 mr-2' />
          Preview
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [isFile, handlePreview, isLoading]);

  const renderBatchActions = useCallback(() => {
    if (!hasMultipleSelection) return null;

    return (
      <>
        <ContextMenuItem onClick={handleMoveToRoot} disabled={isLoading}>
          <Upload className='w-4 h-4 mr-2' />
          Move {selectedNodes.size} items to root
        </ContextMenuItem>
        <ContextMenuItem onClick={handleRemove} disabled={isLoading}>
          <Trash2 className='w-4 h-4 mr-2' />
          Remove {selectedNodes.size} items
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [
    hasMultipleSelection,
    handleMoveToRoot,
    handleRemove,
    isLoading,
    selectedNodes.size,
  ]);

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  return (
    <>
      {renderFolderActions()}
      {renderFileActions()}
      {renderBatchActions()}

      <ContextMenuItem onClick={handleRename} disabled={isLoading}>
        <Edit3 className='w-4 h-4 mr-2' />
        Rename
      </ContextMenuItem>

      <ContextMenuItem onClick={handleMove} disabled={isLoading}>
        <Move className='w-4 h-4 mr-2' />
        Move
      </ContextMenuItem>

      <ContextMenuItem onClick={handleMoveToRoot} disabled={isLoading}>
        <Upload className='w-4 h-4 mr-2' />
        Move to Root
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleShowInfo} disabled={isLoading}>
        <Info className='w-4 h-4 mr-2' />
        File Info
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={handleRemove}
        disabled={isLoading}
        className='text-destructive focus:text-destructive'
      >
        <Trash2 className='w-4 h-4 mr-2' />
        {hasMultipleSelection
          ? `Remove ${selectedNodes.size} items`
          : 'Remove from Upload'}
      </ContextMenuItem>
    </>
  );
};

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const UploadContextMenu = memo(UploadContextMenuComponent);
export { UploadContextMenuComponent };

// Default export for convenience
export default UploadContextMenu;
