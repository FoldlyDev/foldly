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
  workspaceId?: string; // For workspace trees
  onAcceptCrossTreeDrop?: (items: any[], targetFolderId: string, workspaceId?: string) => Promise<void>;
  
  // Tree ready callback
  onTreeReady?: (tree: any) => void;
}

export interface TreeFactoryResult {
  // Tree props to spread to FileTree component (now organized)
  treeProps: {
    // Core
    rootId: string;
    treeId: string;
    initialData: Record<string, TreeItem>;
    
    // Initial state
    initialState?: {
      expandedItems?: string[];
      selectedItems?: string[];
      checkedItems?: string[];
    };
    
    // Features
    features?: {
      selection?: boolean;
      multiSelect?: boolean;
      checkboxes?: boolean;
      search?: boolean;
      dragDrop?: boolean;
      keyboardDragDrop?: boolean;
      rename?: boolean;
      expandAll?: boolean;
      hotkeys?: boolean;
    };
    
    // Display
    display?: {
      showFileSize?: boolean;
      showFileDate?: boolean;
      showFileStatus?: boolean;
      showFolderCount?: boolean;
      showFolderSize?: boolean;
      showCheckboxes?: boolean;
      showEmptyState?: boolean;
      emptyStateMessage?: React.ReactNode;
      emptyStateAction?: React.ReactNode;
    };
    
    // Callbacks
    callbacks?: {
      onTreeReady?: (tree: any) => void;
      onSelectionChange?: (selectedItems: string[]) => void;
      onSearchChange?: (query: string) => void;
      onExternalFileDrop?: (
        files: File[],
        targetFolderId: string | null,
        folderStructure?: { [folder: string]: File[] }
      ) => void;
    };
    
    // Operations
    operations?: {
      dropCallbacks?: DropOperationCallbacks;
      renameCallback?: RenameOperationCallback;
      contextMenuProvider?: any;
    };
    
    // Cross-tree
    crossTree?: {
      createForeignDragObject?: (items: any[]) => any;
      onCompleteForeignDrop?: (items: any[]) => void;
      onDropForeignDragObject?: (dataTransfer: DataTransfer, target: any) => Promise<void>;
    };
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
  workspaceId,
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
    ...(linkId && { linkId }), // Only include linkId if it exists
    ...(workspaceId && { workspaceId }), // Only include workspaceId if it exists
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
      }).filter((item): item is TreeItem => item !== undefined); // Type-safe filter
      
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
        // Extract target folder ID from the drop target
        // The target can be either a reorder target (between items) or direct drop on folder
        const isReorderTarget = 'childIndex' in target;
        let targetFolderId: string;
        
        if (!isReorderTarget) {
          // Direct drop on an item - check if it's a folder
          const targetItem = target.item;
          const targetItemData = data[targetItem.getId()];
          
          if (targetItemData && targetItemData.type === 'folder') {
            // Dropping on a folder - use the folder as target
            targetFolderId = targetItem.getId();
          } else {
            // Dropping on a file - use its parent folder
            targetFolderId = targetItem.getParent()?.getId() || rootId;
          }
        } else {
          // Reorder target (between items) - use parent folder
          targetFolderId = target.item.getParent()?.getId() || rootId;
        }
        
        console.log('[CrossTree] Drop target:', { 
          isReorderTarget, 
          targetFolderId,
          targetItem: target.item.getId(),
          targetType: data[target.item.getId()]?.type
        });
        
        await crossTreeHandlers.handleForeignDrop(dataTransfer, targetFolderId);
        return;
      }
    }
    // Let default handler process OS file drops
  }, [treeType, crossTreeHandlers, rootId, data]);
  
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
  
  // Build tree props with new organized structure
  const treeProps = {
    // ============= CORE CONFIGURATION =============
    rootId,
    treeId,
    initialData: data,
    
    // ============= INITIAL STATE =============
    initialState: {
      selectedItems: selectionManager.selectedItems,
      // Add expanded/checked items if needed in future
    },
    
    // ============= FEATURES CONTROL =============
    features: {
      selection: config.features.selection,
      multiSelect: config.features.multiSelect,
      checkboxes: config.features.checkboxes,
      search: config.features.search,
      dragDrop: config.features.dragDrop || config.features.foreignDrag, // Enable drag if foreignDrag is true
      keyboardDragDrop: config.features.dragDrop || config.features.foreignDrag, // Enable keyboard drag if any drag is enabled
      rename: config.features.rename,
      expandAll: true, // Usually want this enabled
      hotkeys: true, // Usually want this enabled
    },
    
    // ============= DISPLAY OPTIONS =============
    display: {
      showFileSize: config.display.showFileSize,
      showFileDate: config.display.showFileDate,
      showFileStatus: config.display.showFileStatus,
      showFolderCount: config.display.showFolderCount,
      showFolderSize: config.display.showFolderSize,
      showCheckboxes: config.features.checkboxes,
      showEmptyState: true,
    },
    
    // ============= EVENT CALLBACKS =============
    callbacks: {
      onTreeReady: setTreeInstance,
      onSelectionChange: selectionManager.setSelectedItems,
      ...(config.features.externalFileDrop && { 
        onExternalFileDrop: handleExternalFileDrop 
      }),
    },
    
    // ============= OPERATION HANDLERS =============
    operations: {
      ...(config.features.dragDrop && dropCallbacks && { dropCallbacks }),
      ...(config.features.rename && renameCallback && { renameCallback }),
      ...(config.features.contextMenu && { contextMenuProvider }),
    },
    
    // ============= CROSS-TREE SUPPORT =============
    ...(treeType === 'link' && {
      crossTree: {
        createForeignDragObject: createForeignDragObject,
        onCompleteForeignDrop: onCompleteForeignDrop,
      }
    }),
    ...(treeType === 'workspace' && {
      crossTree: {
        onDropForeignDragObject: onDropForeignDragObject,
        // Prevent workspace items from being dragged to other trees
        // Return an invalid drag object that won't be accepted by any tree
        createForeignDragObject: () => ({
          format: 'application/x-invalid-drag',
          data: null,
        }),
      }
    }),
  };
  
  return {
    treeProps,
    treeInstance,
    selectionManager,
    isReady: isTreeReady,
  };
}