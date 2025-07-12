// =============================================================================
// FILES CONTEXT MENU - Context menu for files feature tree nodes
// =============================================================================
// 🎯 Limited operations for links and file transfer to workspace

import React, { memo, useCallback } from 'react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/shadcn/context-menu';
import { Download, Share, Send, Eye, Copy, ExternalLink } from 'lucide-react';
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import type { TreeNode } from '@/types/file-tree';

// =============================================================================
// FILES CONTEXT MENU PROPS
// =============================================================================

interface FilesContextMenuProps {
  node: TreeNode;
}

// =============================================================================
// FILES CONTEXT MENU COMPONENT
// =============================================================================

const FilesContextMenuComponent: React.FC<FilesContextMenuProps> = ({
  node,
}) => {
  const { selectedNodes, hideContextMenu } = useTreeStore();
  const { downloadItem, moveItem, batchMove, isLoading } =
    useTreeActions('files');

  const hasMultipleSelection = selectedNodes.size > 1;
  const isLink = node.type === 'link';
  const isFile = node.type === 'file';

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleDownload = useCallback(async () => {
    try {
      await downloadItem(node.id);
    } catch (error) {
      console.error('Failed to download item:', error);
    }
    hideContextMenu();
  }, [downloadItem, node.id, hideContextMenu]);

  const handleSendToWorkspace = useCallback(async () => {
    if (hasMultipleSelection) {
      const nodeIds = Array.from(selectedNodes);
      try {
        await batchMove({ nodeIds, targetId: 'workspace-root' });
      } catch (error) {
        console.error('Failed to send items to workspace:', error);
      }
    } else {
      try {
        await moveItem({ nodeId: node.id, targetId: 'workspace-root' });
      } catch (error) {
        console.error('Failed to send item to workspace:', error);
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

  const handlePreview = useCallback(() => {
    // TODO: Implement preview functionality
    console.log('Preview item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleCopyLink = useCallback(() => {
    // TODO: Implement copy link functionality
    console.log('Copy link for:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Share item:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  const handleOpenInNewTab = useCallback(() => {
    // TODO: Implement open in new tab functionality
    console.log('Open in new tab:', node.id);
    hideContextMenu();
  }, [node.id, hideContextMenu]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderLinkActions = useCallback(() => {
    if (!isLink) return null;

    return (
      <>
        <ContextMenuItem onClick={handleOpenInNewTab} disabled={isLoading}>
          <ExternalLink className='w-4 h-4 mr-2' />
          Open Link
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyLink} disabled={isLoading}>
          <Copy className='w-4 h-4 mr-2' />
          Copy Link
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [isLink, handleOpenInNewTab, handleCopyLink, isLoading]);

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
        <ContextMenuItem onClick={handleSendToWorkspace} disabled={isLoading}>
          <Send className='w-4 h-4 mr-2' />
          Send {selectedNodes.size} items to Workspace
        </ContextMenuItem>
        <ContextMenuSeparator />
      </>
    );
  }, [
    hasMultipleSelection,
    handleSendToWorkspace,
    isLoading,
    selectedNodes.size,
  ]);

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  return (
    <>
      {renderLinkActions()}
      {renderFileActions()}
      {renderBatchActions()}

      <ContextMenuItem onClick={handleDownload} disabled={isLoading}>
        <Download className='w-4 h-4 mr-2' />
        Download
      </ContextMenuItem>

      <ContextMenuItem onClick={handleSendToWorkspace} disabled={isLoading}>
        <Send className='w-4 h-4 mr-2' />
        {hasMultipleSelection
          ? `Send ${selectedNodes.size} items to Workspace`
          : 'Send to Workspace'}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleShare} disabled={isLoading}>
        <Share className='w-4 h-4 mr-2' />
        Share
      </ContextMenuItem>
    </>
  );
};

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const FilesContextMenu = memo(FilesContextMenuComponent);
export { FilesContextMenuComponent };

// Default export for convenience
export default FilesContextMenu;
