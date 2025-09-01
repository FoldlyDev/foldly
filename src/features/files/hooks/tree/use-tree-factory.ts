'use client';

import { useMemo, useCallback } from 'react';
import { useTreeInstanceManager } from '../../lib/managers/tree-instance-manager';
import { useTreeSelectionManager } from '../../lib/managers/tree-selection-manager';
import { useLinkContextMenuHandler } from '../../lib/handlers/link-context-menu-handler';
import { useCrossTreeDragHandler } from '../../lib/handlers/cross-tree-drag-handler';
import type { TreeConfiguration } from '../../lib/tree-configs';
import type { TreeItem } from '@/components/file-tree/types';
import type { DropOperationCallbacks } from '@/components/file-tree/handlers/drop-handler';
import type { RenameOperationCallback } from '@/components/file-tree/handlers/rename-handler';

/**
 * Tree Factory Hook
 * Combines tree configuration with handlers and managers to create a fully functional tree
 * 
 * This is the main integration point that brings together:
 * - Tree configurations (features, permissions, display)
 * - Handlers (context menu, drag-drop, etc.)
 * - Managers (instance, selection)
 */

export interface UseTreeFactoryProps {
  treeId: string;
  config: TreeConfiguration;
  data: Record<string, TreeItem>;
  
  // Optional callbacks for tree operations
  onRename?: (itemId: string, newName: string) => Promise<void>;
  onDelete?: (itemIds: string[]) => Promise<void>;
  onDownload?: (itemIds: string[]) => Promise<void>;
  onCreateFolder?: (parentId: string, name: string) => Promise<void>;
  onCopyToWorkspace?: (items: TreeItem[], targetFolderId: string) => Promise<void>;
  onMove?: (itemIds: string[], fromParentId: string, toParentId: string) => Promise<void>;
  onReorder?: (parentId: string, oldOrder: string[], newOrder: string[]) => Promise<void>;
  
  // Selection callback
  onSelectionChange?: (selectedItems: string[]) => void;
  
  // Tree ready callback
  onTreeReady?: (tree: any) => void;
}

export interface TreeFactoryResult {
  // Tree props to spread to FileTree component
  treeProps: {
    rootId: string;
    treeId: string;
    initialData: Record<string, TreeItem>;
    showCheckboxes: boolean;
    showFileSize: boolean;
    showFileDate: boolean;
    showFileStatus: boolean;
    showFolderCount: boolean;
    showFolderSize: boolean;
    onTreeReady: (tree: any) => void;
    onSelectionChange?: (items: string[]) => void;
    dropCallbacks?: DropOperationCallbacks;
    renameCallback?: RenameOperationCallback;
    contextMenuProvider?: any;
    onExternalFileDrop?: any;
  };
  
  // Managers for external use
  treeInstance: ReturnType<typeof useTreeInstanceManager>['treeInstance'];
  selectionManager: ReturnType<typeof useTreeSelectionManager>;
  
  // State
  isReady: boolean;
}

export function useTreeFactory({
  treeId,
  config,
  data,
  onRename,
  onDelete,
  onDownload,
  onCreateFolder,
  onCopyToWorkspace,
  onMove,
  onReorder,
  onSelectionChange,
  onTreeReady,
}: UseTreeFactoryProps): TreeFactoryResult {
  
  // Get root ID from data (first folder item or workspace)
  const rootId = useMemo(() => {
    const rootItems = Object.values(data).filter(item => !item.parentId);
    return rootItems[0]?.id || treeId;
  }, [data, treeId]);
  
  // Initialize managers
  const { treeInstance, setTreeInstance, isTreeReady } = useTreeInstanceManager({
    treeId,
    onTreeReady,
  });
  
  const selectionManager = useTreeSelectionManager({
    treeInstance,
    multiSelectEnabled: config.features.multiSelect,
    onSelectionChange,
  });
  
  // Initialize handlers based on configuration
  const { contextMenuProvider } = useLinkContextMenuHandler({
    linkId: treeId,
    treeInstance,
    onRename: config.features.rename ? onRename : undefined,
    onDelete: config.features.delete ? onDelete : undefined,
    onDownload,
    onCreateFolder: config.permissions.canCreateFolder ? onCreateFolder : undefined,
  });
  
  const crossTreeHandlers = useCrossTreeDragHandler({
    treeId,
    treeType: 'link', // This would be dynamic based on tree type
    onCopyToWorkspace,
    canAcceptDrops: config.features.acceptDrops,
    canDragOut: config.features.foreignDrag,
  });
  
  // Create drop callbacks for internal drag-drop
  const dropCallbacks: DropOperationCallbacks | undefined = useMemo(() => {
    if (!config.features.dragDrop) return undefined;
    
    return {
      onMove: async (itemIds: string[], fromParentId: string, toParentId: string) => {
        await onMove?.(itemIds, fromParentId, toParentId);
      },
      onReorder: async (parentId: string, oldOrder: string[], newOrder: string[], draggedItemIds: string[]) => {
        await onReorder?.(parentId, oldOrder, newOrder);
      },
    };
  }, [config.features.dragDrop, onMove, onReorder]);
  
  // Create rename callback
  const renameCallback: RenameOperationCallback | undefined = useMemo(() => {
    if (!config.features.rename || !onRename) return undefined;
    
    return async (itemId: string, newName: string) => {
      await onRename(itemId, newName);
      return { success: true };
    };
  }, [config.features.rename, onRename]);
  
  // Handle external file drops (from OS)
  const handleExternalFileDrop = useCallback(
    (files: File[], targetFolderId: string | null, folderStructure?: { [folder: string]: File[] }) => {
      if (!config.features.externalFileDrop) return;
      
      // This would handle OS file drops - not needed for link trees
      console.log('External files dropped:', files, targetFolderId, folderStructure);
    },
    [config.features.externalFileDrop]
  );
  
  // Build tree props
  const treeProps = useMemo(() => ({
    rootId,
    treeId,
    initialData: data,
    showCheckboxes: config.features.checkboxes,
    showFileSize: config.display.showFileSize,
    showFileDate: config.display.showFileDate,
    showFileStatus: config.display.showFileStatus,
    showFolderCount: config.display.showFolderCount,
    showFolderSize: config.display.showFolderSize,
    onTreeReady: setTreeInstance,
    onSelectionChange: config.features.selection ? selectionManager.setSelectedItems : undefined,
    dropCallbacks: config.features.dragDrop ? dropCallbacks : undefined,
    renameCallback: config.features.rename ? renameCallback : undefined,
    contextMenuProvider: config.features.contextMenu ? contextMenuProvider : undefined,
    onExternalFileDrop: config.features.externalFileDrop ? handleExternalFileDrop : undefined,
  }), [
    rootId,
    treeId,
    data,
    config,
    setTreeInstance,
    selectionManager.setSelectedItems,
    dropCallbacks,
    renameCallback,
    contextMenuProvider,
    handleExternalFileDrop,
  ]);
  
  return {
    treeProps,
    treeInstance,
    selectionManager,
    isReady: isTreeReady,
  };
}