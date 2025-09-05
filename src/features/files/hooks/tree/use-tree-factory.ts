'use client';

import { useMemo, useCallback, useState } from 'react';
import { useTreeInstanceManager } from '../../lib/managers/tree-instance-manager';
import { useTreeSelectionManager } from '../../lib/managers/tree-selection-manager';
import { useLinkContextMenuHandler } from '../../lib/handlers/link-context-menu-handler';
// import { useCrossTreeDragHandler } from '../../lib/handlers/cross-tree-drag-handler';
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
  // onCopyToWorkspace?: (items: TreeItem[], targetFolderId: string) => Promise<void>;
  onMove?: (itemIds: string[], fromParentId: string, toParentId: string) => Promise<void>;
  onReorder?: (parentId: string, oldOrder: string[], newOrder: string[]) => Promise<void>;
  
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
  // onCopyToWorkspace,
  onMove,
  onReorder,
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
  });
  
  // Cross-tree drag handler - currently unused but may be needed for future drag operations
  // const crossTreeHandlers = useCrossTreeDragHandler({
  //   treeId,
  //   treeType: 'link',
  //   ...(onCopyToWorkspace && { onCopyToWorkspace }),
  //   canAcceptDrops: config.features.acceptDrops,
  //   canDragOut: config.features.foreignDrag,
  // });
  
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
  };
  
  return {
    treeProps,
    treeInstance,
    selectionManager,
    isReady: isTreeReady,
  };
}