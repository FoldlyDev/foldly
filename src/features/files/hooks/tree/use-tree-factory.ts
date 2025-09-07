'use client';

import { useMemo, useCallback, useState } from 'react';
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
  onCopyToWorkspace?: (itemIds: string[]) => Promise<void>;
  onMove?: (itemIds: string[], fromParentId: string, toParentId: string) => Promise<void>;
  onReorder?: (parentId: string, oldOrder: string[], newOrder: string[]) => Promise<void>;
  
  // Cross-tree operation support
  treeType?: 'link' | 'workspace';
  linkId?: string; // For link trees
  onAcceptCrossTreeDrop?: (items: any[], targetFolderId: string) => Promise<void>;
  
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
    createForeignDragObject?: (items: any[]) => any;
    onCompleteForeignDrop?: (items: any[]) => void;
    onDropForeignDragObject?: (dataTransfer: DataTransfer, target: any) => Promise<void>;
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
  treeType = 'link',
  linkId,
  onAcceptCrossTreeDrop,
  onTreeReady,
}: UseTreeFactoryProps): TreeFactoryResult {
  
  // Get root ID from data (first folder item or workspace)
  const rootId = useMemo(() => {
    const rootItems = Object.values(data).filter(item => !item.parentId);
    return rootItems[0]?.id || treeId;
  }, [data, treeId]);
  
  // Selection management - will be updated with tree instance (EXACTLY LIKE WORKSPACE)
  const [selectionTreeInstance, setSelectionTreeInstance] = useState<any | null>(null);
  
  // Initialize managers
  const { treeInstance, setTreeInstance: originalSetTreeInstance, isTreeReady } = useTreeInstanceManager({
    treeId,
    ...(onTreeReady && { onTreeReady }),
  });
  
  // Selection manager with separate tree instance (EXACTLY LIKE WORKSPACE)
  const selectionManager = useTreeSelectionManager({
    treeInstance: selectionTreeInstance, // Will be set when tree is ready
    multiSelectEnabled: config.features.multiSelect,
    onSelectionChange: items => {
      // This will be called when selection changes
      // Can be used for any side effects if needed
    },
  });
  
  // Enhanced tree ready handler that also updates selection manager (EXACTLY LIKE WORKSPACE)
  const setTreeInstance = useCallback((tree: any) => {
    // Call the original handler first
    originalSetTreeInstance(tree);
    // Update selection manager's tree instance
    setSelectionTreeInstance(tree);
  }, [originalSetTreeInstance]);
  
  // Initialize handlers based on configuration
  const { contextMenuProvider } = useLinkContextMenuHandler({
    linkId: treeId,
    treeInstance,
    ...(config.features.rename && onRename && { onRename }),
    ...(config.features.delete && onDelete && { onDelete }),
    ...(onDownload && { onDownload }),
    ...(config.permissions.canCreateFolder && onCreateFolder && { onCreateFolder }),
    ...(onCopyToWorkspace && { onCopyToWorkspace }),
  });
  
  // Cross-tree drag handler for link => workspace operations
  const crossTreeHandlers = useCrossTreeDragHandler({
    treeId,
    treeType,
    linkId,
    onCopyToWorkspace: treeType === 'workspace' && onAcceptCrossTreeDrop ? 
      onAcceptCrossTreeDrop : undefined,
    canAcceptDrops: treeType === 'workspace' && config.features.acceptDrops,
    canDragOut: treeType === 'link' && config.features.foreignDrag,
  });
  
  // Create custom foreign drag object for cross-tree operations (link trees)
  const createForeignDragObject = useCallback((items: any[]) => {
    if (treeType === 'link' && crossTreeHandlers.createForeignDragData) {
      // Convert tree items to cross-tree format
      const treeItems = items.map(item => {
        const itemId = item.getId();
        const itemData = data[itemId];
        return itemData;
      });
      
      const crossTreeData = crossTreeHandlers.createForeignDragData(treeItems);
      return {
        format: 'application/x-cross-tree-drag',
        data: crossTreeData,
      };
    }
    
    // Default behavior for other trees
    const itemsData = items.map(item => {
      const itemId = item.getId();
      const itemData = data[itemId];
      return itemData;
    });
    return {
      format: 'application/json',
      data: JSON.stringify(itemsData),
    };
  }, [treeType, data, crossTreeHandlers]);
  
  // Override complete foreign drop to prevent item removal for link trees
  const onCompleteForeignDrop = useCallback((items: any[]) => {
    if (treeType === 'link') {
      // For link trees, DO NOT remove items - this is a copy operation
      console.log('[CrossTree] Copy operation - preserving source items in link tree');
      return;
    }
    // For other trees, allow normal behavior (item removal)
    // This would be handled by the file-tree component's default behavior
  }, [treeType]);
  
  // Handle foreign drops for workspace trees
  const onDropForeignDragObject = useCallback(async (dataTransfer: DataTransfer, target: any) => {
    if (treeType === 'workspace' && crossTreeHandlers.handleForeignDrop) {
      // Check if this is a cross-tree drag
      if (dataTransfer.types.includes('application/x-cross-tree-drag')) {
        const targetFolderId = target.item?.getId() || rootId;
        await crossTreeHandlers.handleForeignDrop(dataTransfer, targetFolderId);
        return;
      }
    }
    // Let default handler process OS file drops
  }, [treeType, crossTreeHandlers, rootId]);
  
  // Create drop callbacks for internal drag-drop
  const dropCallbacks: DropOperationCallbacks | undefined = useMemo(() => {
    if (!config.features.dragDrop) return undefined;
    
    return {
      onMove: async (itemIds: string[], fromParentId: string, toParentId: string) => {
        await onMove?.(itemIds, fromParentId, toParentId);
      },
      onReorder: async (parentId: string, oldOrder: string[], newOrder: string[]) => {
        await onReorder?.(parentId, oldOrder, newOrder);
      },
    };
  }, [config.features.dragDrop, onMove, onReorder]);
  
  // Create rename callback
  const renameCallback: RenameOperationCallback | undefined = useMemo(() => {
    if (!config.features.rename || !onRename) return undefined;
    
    return async (itemId: string, newName: string) => {
      await onRename(itemId, newName);
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
  
  // Build tree props - not memoized to match workspace pattern
  const treeProps = {
    rootId,
    treeId,
    initialData: data,
    initialSelectedItems: selectionManager.selectedItems, // Add this like workspace
    showCheckboxes: config.features.checkboxes,
    showFileSize: config.display.showFileSize,
    showFileDate: config.display.showFileDate,
    showFileStatus: config.display.showFileStatus,
    showFolderCount: config.display.showFolderCount,
    showFolderSize: config.display.showFolderSize,
    onTreeReady: setTreeInstance,
    // Pass setSelectedItems directly, exactly like workspace does
    onSelectionChange: selectionManager.setSelectedItems,
    ...(config.features.dragDrop && dropCallbacks && { dropCallbacks }),
    ...(config.features.rename && renameCallback && { renameCallback }),
    ...(config.features.contextMenu && { contextMenuProvider }),
    ...(config.features.externalFileDrop && { onExternalFileDrop: handleExternalFileDrop }),
    // Cross-tree drag support
    ...(treeType === 'link' && { createForeignDragObject, onCompleteForeignDrop }),
    ...(treeType === 'workspace' && { onDropForeignDragObject }),
  };
  
  return {
    treeProps,
    treeInstance,
    selectionManager,
    isReady: isTreeReady,
  };
}