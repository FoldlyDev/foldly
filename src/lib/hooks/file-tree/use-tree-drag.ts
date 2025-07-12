// =============================================================================
// TREE DRAG AND DROP - dnd-kit integration for tree operations
// =============================================================================
// 🎯 Drag and drop functionality with dnd-kit and tree state management

import { useCallback, useMemo } from 'react';
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
  CollisionDetection,
  closestCenter,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { useTreeStore } from './use-tree-state';
import { useTreeActions } from './use-tree-actions';
import type { DatabaseId, TreeNode, ContextType } from '@/types/file-tree';

// =============================================================================
// MAIN DRAG HOOK - Drag and drop integration for tree containers
// =============================================================================

export const useTreeDrag = (
  contextType: ContextType,
  contextId?: DatabaseId,
  nodes: TreeNode[] = []
) => {
  const {
    draggedItems,
    dragOverNode,
    isDragging,
    selectedNodes,
    setDraggedItems,
    setDragOverNode,
    setIsDragging,
    selectNode,
  } = useTreeStore();

  const { moveItem, batchMove } = useTreeActions(contextType, contextId);

  // =============================================================================
  // DRAG COLLISION DETECTION
  // =============================================================================

  const customCollisionDetection: CollisionDetection = useCallback(args => {
    // First, let's see if there are any collisions with the pointer
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // If there are no pointer collisions, use the closest center
    return closestCenter(args);
  }, []);

  // =============================================================================
  // DRAG EVENT HANDLERS
  // =============================================================================

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeId = active.id as DatabaseId;

      setIsDragging(true);

      // If the dragged item is in the selection, drag all selected items
      if (selectedNodes.has(activeId)) {
        const selectedNodeData = nodes.filter(node =>
          selectedNodes.has(node.id)
        );
        setDraggedItems(selectedNodeData);
      } else {
        // If not in selection, drag just this item and select it
        const draggedNode = nodes.find(node => node.id === activeId);
        if (draggedNode) {
          setDraggedItems([draggedNode]);
          selectNode(activeId);
        }
      }
    },
    [nodes, selectedNodes, setDraggedItems, setIsDragging, selectNode]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      const overId = over?.id as DatabaseId | null;

      setDragOverNode(overId);
    },
    [setDragOverNode]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = active.id as DatabaseId;
      const overId = over?.id as DatabaseId;

      setIsDragging(false);
      setDragOverNode(null);

      // Don't do anything if dropping on the same item
      if (activeId === overId) {
        setDraggedItems([]);
        return;
      }

      // Don't do anything if no valid drop target
      if (!overId) {
        setDraggedItems([]);
        return;
      }

      // Find the target node
      const targetNode = findNodeById(nodes, overId);
      if (!targetNode) {
        setDraggedItems([]);
        return;
      }

      // Only allow dropping on folders or at root level
      if (targetNode.type !== 'folder' && targetNode.id !== 'root') {
        setDraggedItems([]);
        return;
      }

      try {
        // Perform the move operation
        if (draggedItems.length > 1) {
          // Batch move for multiple items
          const nodeIds = draggedItems.map(item => item.id);
          await batchMove({ nodeIds, targetId: overId });
        } else {
          // Single move
          await moveItem({ nodeId: activeId, targetId: overId });
        }
      } catch (error) {
        console.error('Failed to move items:', error);
      } finally {
        setDraggedItems([]);
      }
    },
    [
      draggedItems,
      nodes,
      moveItem,
      batchMove,
      setIsDragging,
      setDragOverNode,
      setDraggedItems,
    ]
  );

  // =============================================================================
  // DRAG VALIDATION
  // =============================================================================

  const canDrop = useCallback(
    (activeId: DatabaseId, overId: DatabaseId): boolean => {
      // Can't drop on itself
      if (activeId === overId) {
        return false;
      }

      // Find the target node
      const targetNode = findNodeById(nodes, overId);
      if (!targetNode) {
        return false;
      }

      // Can only drop on folders
      if (targetNode.type !== 'folder') {
        return false;
      }

      // Can't drop a folder into its own descendants
      const activeNode = findNodeById(nodes, activeId);
      if (
        activeNode?.type === 'folder' &&
        isDescendant(nodes, activeId, overId)
      ) {
        return false;
      }

      return true;
    },
    [nodes]
  );

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // Drag state
    draggedItems,
    dragOverNode,
    isDragging,

    // Event handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,

    // Validation
    canDrop,

    // Collision detection
    collisionDetection: customCollisionDetection,

    // Helper functions
    getDragOverlay: () => null, // TODO: Implement drag overlay component
  };
};

// =============================================================================
// NODE DRAG HOOK - Individual node drag functionality
// =============================================================================

export const useNodeDrag = (node: TreeNode, enabled: boolean = true) => {
  const { isDragging, draggedItems } = useTreeStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isNodeDragging,
  } = useDraggable({
    id: node.id,
    disabled: !enabled,
    data: {
      type: 'tree-node',
      node,
    },
  });

  const isBeingDragged = useMemo(() => {
    return draggedItems.some(item => item.id === node.id);
  }, [draggedItems, node.id]);

  return {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isNodeDragging || isBeingDragged,
    isGlobalDragging: isDragging,
  };
};

// =============================================================================
// NODE DROP HOOK - Individual node drop functionality
// =============================================================================

export const useNodeDrop = (node: TreeNode, enabled: boolean = true) => {
  const { dragOverNode } = useTreeStore();

  const { setNodeRef, isOver, active } = useDroppable({
    id: node.id,
    disabled: !enabled || node.type !== 'folder',
    data: {
      type: 'tree-node',
      node,
    },
  });

  const isDragOver = useMemo(() => {
    return dragOverNode === node.id;
  }, [dragOverNode, node.id]);

  return {
    setNodeRef,
    isOver,
    isDragOver,
    active,
  };
};

// =============================================================================
// DRAG OVERLAY COMPONENT - Visual feedback during drag
// =============================================================================
// TODO: Move these components to proper .tsx files when implementing drag overlay

// const TreeDragOverlay = ({ nodes }: { nodes: TreeNode[] }) => {
//   if (nodes.length === 0) return null;

//   if (nodes.length === 1) {
//     const node = nodes[0];
//     return (
//       <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-lg">
//         <NodeIcon node={node} />
//         <span className="font-medium">{node.name}</span>
//       </div>
//     );
//   }

//   return (
//     <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-lg">
//       <div className="flex items-center gap-1">
//         <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
//           <span className="text-xs text-white font-bold">{nodes.length}</span>
//         </div>
//         <span className="font-medium">items</span>
//       </div>
//     </div>
//   );
// };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// const NodeIcon = ({ node }: { node: TreeNode }) => {
//   switch (node.type) {
//     case 'folder':
//       return <span className="text-yellow-500">📁</span>;
//     case 'file':
//       return <span className="text-blue-500">📄</span>;
//     case 'link':
//       return <span className="text-green-500">🔗</span>;
//     default:
//       return <span className="text-gray-500">📄</span>;
//   }
// };

/**
 * Find a node by ID in the tree structure
 */
const findNodeById = (nodes: TreeNode[], id: DatabaseId): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Check if targetId is a descendant of ancestorId
 */
const isDescendant = (
  nodes: TreeNode[],
  ancestorId: DatabaseId,
  targetId: DatabaseId
): boolean => {
  const ancestor = findNodeById(nodes, ancestorId);
  if (!ancestor || !ancestor.children) return false;

  const checkChildren = (children: TreeNode[]): boolean => {
    for (const child of children) {
      if (child.id === targetId) return true;
      if (child.children && checkChildren(child.children)) return true;
    }
    return false;
  };

  return checkChildren(ancestor.children);
};

/**
 * Get all parent IDs for a node
 */
const getParentIds = (nodes: TreeNode[], nodeId: DatabaseId): DatabaseId[] => {
  const parents: DatabaseId[] = [];

  const findParents = (
    currentNodes: TreeNode[],
    targetId: DatabaseId
  ): boolean => {
    for (const node of currentNodes) {
      if (node.children) {
        if (node.children.some(child => child.id === targetId)) {
          parents.push(node.id);
          return true;
        }
        if (findParents(node.children, targetId)) {
          parents.push(node.id);
          return true;
        }
      }
    }
    return false;
  };

  findParents(nodes, nodeId);
  return parents.reverse(); // Return from root to immediate parent
};

/**
 * Flatten tree structure for easier manipulation
 */
const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
  const flattened: TreeNode[] = [];

  const flatten = (currentNodes: TreeNode[], level: number = 0) => {
    for (const node of currentNodes) {
      flattened.push({ ...node, level });
      if (node.children) {
        flatten(node.children, level + 1);
      }
    }
  };

  flatten(nodes);
  return flattened;
};

/**
 * Get next/previous node for keyboard navigation
 */
const getAdjacentNode = (
  nodes: TreeNode[],
  currentId: DatabaseId,
  direction: 'next' | 'previous'
): TreeNode | null => {
  const flattened = flattenTree(nodes);
  const currentIndex = flattened.findIndex(node => node.id === currentId);

  if (currentIndex === -1) return null;

  const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  return flattened[nextIndex] || null;
};

// Export helper functions for use in other components
export {
  findNodeById,
  isDescendant,
  getParentIds,
  flattenTree,
  getAdjacentNode,
};
