// Files Feature Tree Utilities for Foldly - Hierarchical File Structure Management
// Tree creation, manipulation, and traversal functions for file/folder hierarchies
// Following 2025 TypeScript best practices with comprehensive tree operations

import type {
  FileData,
  FolderData,
  FileId,
  FolderId,
  FileTreeNode,
  FileTreeStats,
} from '../types';

// =============================================================================
// TREE NODE TYPES
// =============================================================================

/**
 * Enhanced tree node with computed properties
 */
export interface TreeNodeEnhanced extends FileTreeNode {
  readonly level: number;
  readonly path: string;
  readonly fullPath: string;
  readonly isRoot: boolean;
  readonly isLeaf: boolean;
  readonly hasChildren: boolean;
  readonly childrenCount: number;
  readonly descendants: FileTreeNode[];
  readonly ancestors: FileTreeNode[];
  readonly siblings: FileTreeNode[];
  readonly index: number;
  readonly nextSibling: FileTreeNode | null;
  readonly prevSibling: FileTreeNode | null;
  readonly firstChild: FileTreeNode | null;
  readonly lastChild: FileTreeNode | null;
}

/**
 * Tree traversal callback function
 */
export type TreeTraversalCallback = (
  node: TreeNodeEnhanced,
  index: number,
  path: number[]
) => boolean | void;

/**
 * Tree filter function
 */
export type TreeFilterFunction = (node: TreeNodeEnhanced) => boolean;

/**
 * Tree sort function
 */
export type TreeSortFunction = (
  a: TreeNodeEnhanced,
  b: TreeNodeEnhanced
) => number;

// =============================================================================
// TREE CREATION
// =============================================================================

/**
 * Create file tree from files and folders
 */
export const createFileTree = (
  files: FileData[],
  folders: FolderData[],
  rootFolderId?: FolderId | null
): FileTreeNode[] => {
  const folderMap = new Map<FolderId, FolderData>();
  const fileMap = new Map<FileId, FileData>();

  // Build maps for quick lookup
  folders.forEach(folder => folderMap.set(folder.id, folder));
  files.forEach(file => fileMap.set(file.id, file));

  // Build tree structure
  const rootNodes: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // Create folder nodes
  folders.forEach(folder => {
    const node: FileTreeNode = {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      data: folder,
      children: [],
      parent: null,
      isExpanded: false,
      isSelected: false,
    };

    nodeMap.set(folder.id, node);

    // Add to root if no parent or parent matches rootFolderId
    if (folder.parentId === rootFolderId || folder.parentId === null) {
      rootNodes.push(node);
    }
  });

  // Create file nodes
  files.forEach(file => {
    const node: FileTreeNode = {
      id: file.id,
      name: file.name,
      type: 'file',
      data: file,
      children: [],
      parent: null,
      isExpanded: false,
      isSelected: false,
    };

    nodeMap.set(file.id, node);

    // Add to parent folder or root
    if (file.folderId) {
      const parentNode = nodeMap.get(file.folderId);
      if (parentNode) {
        parentNode.children.push(node);
        node.parent = parentNode;
      }
    } else if (file.folderId === rootFolderId) {
      rootNodes.push(node);
    }
  });

  // Build parent-child relationships for folders
  folders.forEach(folder => {
    if (folder.parentId) {
      const parentNode = nodeMap.get(folder.parentId);
      const childNode = nodeMap.get(folder.id);

      if (parentNode && childNode) {
        parentNode.children.push(childNode);
        childNode.parent = parentNode;
      }
    }
  });

  // Sort children in each node
  nodeMap.forEach(node => {
    node.children.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  });

  // Sort root nodes
  rootNodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return rootNodes;
};

/**
 * Create enhanced tree nodes with computed properties
 */
export const createEnhancedTree = (
  nodes: FileTreeNode[],
  parentPath: string = '',
  level: number = 0
): TreeNodeEnhanced[] => {
  return nodes.map((node, index) => {
    const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const path = parentPath || '/';

    const enhanced: TreeNodeEnhanced = {
      ...node,
      level,
      path,
      fullPath,
      isRoot: level === 0,
      isLeaf: node.children.length === 0,
      hasChildren: node.children.length > 0,
      childrenCount: node.children.length,
      descendants: [],
      ancestors: [],
      siblings: nodes.filter(n => n.id !== node.id),
      index,
      nextSibling: nodes[index + 1] || null,
      prevSibling: nodes[index - 1] || null,
      firstChild: node.children[0] || null,
      lastChild: node.children[node.children.length - 1] || null,
    };

    // Recursively enhance children
    if (node.children.length > 0) {
      enhanced.children = createEnhancedTree(
        node.children,
        fullPath,
        level + 1
      );
    }

    return enhanced;
  });
};

// =============================================================================
// TREE MANIPULATION
// =============================================================================

/**
 * Expand node and optionally its children
 */
export const expandNode = (
  nodes: FileTreeNode[],
  nodeId: string,
  recursive: boolean = false
): FileTreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      const expandedNode = { ...node, isExpanded: true };
      if (recursive && node.children.length > 0) {
        expandedNode.children = expandAllNodes(node.children);
      }
      return expandedNode;
    }

    if (node.children.length > 0) {
      return {
        ...node,
        children: expandNode(node.children, nodeId, recursive),
      };
    }

    return node;
  });
};

/**
 * Collapse node and optionally its children
 */
export const collapseNode = (
  nodes: FileTreeNode[],
  nodeId: string,
  recursive: boolean = false
): FileTreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      const collapsedNode = { ...node, isExpanded: false };
      if (recursive && node.children.length > 0) {
        collapsedNode.children = collapseAllNodes(node.children);
      }
      return collapsedNode;
    }

    if (node.children.length > 0) {
      return {
        ...node,
        children: collapseNode(node.children, nodeId, recursive),
      };
    }

    return node;
  });
};

/**
 * Toggle node expansion
 */
export const toggleNode = (
  nodes: FileTreeNode[],
  nodeId: string
): FileTreeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, isExpanded: !node.isExpanded };
    }

    if (node.children.length > 0) {
      return {
        ...node,
        children: toggleNode(node.children, nodeId),
      };
    }

    return node;
  });
};

/**
 * Expand all nodes in tree
 */
export const expandAllNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
  return nodes.map(node => ({
    ...node,
    isExpanded: true,
    children: node.children.length > 0 ? expandAllNodes(node.children) : [],
  }));
};

/**
 * Collapse all nodes in tree
 */
export const collapseAllNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
  return nodes.map(node => ({
    ...node,
    isExpanded: false,
    children: node.children.length > 0 ? collapseAllNodes(node.children) : [],
  }));
};

/**
 * Select node
 */
export const selectNode = (
  nodes: FileTreeNode[],
  nodeId: string,
  multiSelect: boolean = false
): FileTreeNode[] => {
  return nodes.map(node => {
    const isSelected = node.id === nodeId;
    const shouldDeselect = !multiSelect && !isSelected;

    const updatedNode = {
      ...node,
      isSelected:
        isSelected || (multiSelect && node.isSelected && !shouldDeselect),
    };

    if (node.children.length > 0) {
      updatedNode.children = selectNode(node.children, nodeId, multiSelect);
    }

    return updatedNode;
  });
};

/**
 * Deselect all nodes
 */
export const deselectAllNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
  return nodes.map(node => ({
    ...node,
    isSelected: false,
    children: node.children.length > 0 ? deselectAllNodes(node.children) : [],
  }));
};

/**
 * Select multiple nodes
 */
export const selectMultipleNodes = (
  nodes: FileTreeNode[],
  nodeIds: string[]
): FileTreeNode[] => {
  return nodes.map(node => ({
    ...node,
    isSelected: nodeIds.includes(node.id),
    children:
      node.children.length > 0
        ? selectMultipleNodes(node.children, nodeIds)
        : [],
  }));
};

// =============================================================================
// TREE TRAVERSAL
// =============================================================================

/**
 * Traverse tree in depth-first order
 */
export const traverseDepthFirst = (
  nodes: FileTreeNode[],
  callback: TreeTraversalCallback,
  path: number[] = []
): void => {
  nodes.forEach((node, index) => {
    const currentPath = [...path, index];
    const enhanced = createEnhancedTree([node])[0];

    // Call callback - if returns false, stop traversal
    const shouldContinue = callback(enhanced, index, currentPath);
    if (shouldContinue === false) return;

    // Traverse children
    if (node.children.length > 0) {
      traverseDepthFirst(node.children, callback, currentPath);
    }
  });
};

/**
 * Traverse tree in breadth-first order
 */
export const traverseBreadthFirst = (
  nodes: FileTreeNode[],
  callback: TreeTraversalCallback
): void => {
  const queue: Array<{ node: FileTreeNode; index: number; path: number[] }> =
    [];

  // Initialize queue with root nodes
  nodes.forEach((node, index) => {
    queue.push({ node, index, path: [index] });
  });

  while (queue.length > 0) {
    const { node, index, path } = queue.shift()!;
    const enhanced = createEnhancedTree([node])[0];

    // Call callback - if returns false, stop traversal
    const shouldContinue = callback(enhanced, index, path);
    if (shouldContinue === false) return;

    // Add children to queue
    node.children.forEach((child, childIndex) => {
      queue.push({
        node: child,
        index: childIndex,
        path: [...path, childIndex],
      });
    });
  }
};

/**
 * Find nodes matching predicate
 */
export const findNodes = (
  nodes: FileTreeNode[],
  predicate: TreeFilterFunction
): TreeNodeEnhanced[] => {
  const results: TreeNodeEnhanced[] = [];

  traverseDepthFirst(nodes, node => {
    if (predicate(node)) {
      results.push(node);
    }
  });

  return results;
};

/**
 * Find first node matching predicate
 */
export const findNode = (
  nodes: FileTreeNode[],
  predicate: TreeFilterFunction
): TreeNodeEnhanced | null => {
  let result: TreeNodeEnhanced | null = null;

  traverseDepthFirst(nodes, node => {
    if (predicate(node)) {
      result = node;
      return false; // Stop traversal
    }
  });

  return result;
};

/**
 * Find node by ID
 */
export const findNodeById = (
  nodes: FileTreeNode[],
  nodeId: string
): TreeNodeEnhanced | null => {
  return findNode(nodes, node => node.id === nodeId);
};

/**
 * Find nodes by type
 */
export const findNodesByType = (
  nodes: FileTreeNode[],
  type: 'file' | 'folder'
): TreeNodeEnhanced[] => {
  return findNodes(nodes, node => node.type === type);
};

/**
 * Find parent node
 */
export const findParentNode = (
  nodes: FileTreeNode[],
  nodeId: string
): TreeNodeEnhanced | null => {
  let parent: TreeNodeEnhanced | null = null;

  traverseDepthFirst(nodes, node => {
    if (node.children.some(child => child.id === nodeId)) {
      parent = node;
      return false; // Stop traversal
    }
  });

  return parent;
};

/**
 * Get node path from root
 */
export const getNodePath = (
  nodes: FileTreeNode[],
  nodeId: string
): TreeNodeEnhanced[] => {
  const path: TreeNodeEnhanced[] = [];

  const findPath = (
    currentNodes: FileTreeNode[],
    currentPath: TreeNodeEnhanced[]
  ): boolean => {
    for (const node of currentNodes) {
      const enhanced = createEnhancedTree([node])[0];
      const newPath = [...currentPath, enhanced];

      if (node.id === nodeId) {
        path.push(...newPath);
        return true;
      }

      if (node.children.length > 0) {
        if (findPath(node.children, newPath)) {
          return true;
        }
      }
    }

    return false;
  };

  findPath(nodes, []);
  return path;
};

// =============================================================================
// TREE FILTERING AND SORTING
// =============================================================================

/**
 * Filter tree nodes
 */
export const filterTree = (
  nodes: FileTreeNode[],
  predicate: TreeFilterFunction
): FileTreeNode[] => {
  return nodes
    .map(node => {
      const enhanced = createEnhancedTree([node])[0];
      const filteredChildren =
        node.children.length > 0 ? filterTree(node.children, predicate) : [];

      // Include node if it matches predicate or has matching children
      const shouldInclude = predicate(enhanced) || filteredChildren.length > 0;

      if (shouldInclude) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter((node): node is FileTreeNode => node !== null);
};

/**
 * Sort tree nodes
 */
export const sortTree = (
  nodes: FileTreeNode[],
  compareFn: TreeSortFunction
): FileTreeNode[] => {
  const sortedNodes = [...nodes]
    .map(node => ({
      ...node,
      children:
        node.children.length > 0 ? sortTree(node.children, compareFn) : [],
    }))
    .sort((a, b) => {
      const enhancedA = createEnhancedTree([a])[0];
      const enhancedB = createEnhancedTree([b])[0];
      return compareFn(enhancedA, enhancedB);
    });

  return sortedNodes;
};

/**
 * Default sort function (folders first, then by name)
 */
export const defaultSort: TreeSortFunction = (a, b) => {
  // Folders first
  if (a.type !== b.type) {
    return a.type === 'folder' ? -1 : 1;
  }

  // Then by name
  return a.name.localeCompare(b.name);
};

/**
 * Sort by name
 */
export const sortByName: TreeSortFunction = (a, b) => {
  return a.name.localeCompare(b.name);
};

/**
 * Sort by date created
 */
export const sortByDateCreated: TreeSortFunction = (a, b) => {
  const aDate =
    a.type === 'file'
      ? (a.data as FileData).createdAt
      : (a.data as FolderData).createdAt;
  const bDate =
    b.type === 'file'
      ? (b.data as FileData).createdAt
      : (b.data as FolderData).createdAt;
  return bDate.getTime() - aDate.getTime(); // Newest first
};

/**
 * Sort by size
 */
export const sortBySize: TreeSortFunction = (a, b) => {
  const aSize =
    a.type === 'file'
      ? (a.data as FileData).size
      : (a.data as FolderData).totalSize;
  const bSize =
    b.type === 'file'
      ? (b.data as FileData).size
      : (b.data as FolderData).totalSize;
  return bSize - aSize; // Largest first
};

// =============================================================================
// TREE STATISTICS
// =============================================================================

/**
 * Calculate tree statistics
 */
export const calculateTreeStats = (nodes: FileTreeNode[]): FileTreeStats => {
  const stats: FileTreeStats = {
    totalNodes: 0,
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    maxDepth: 0,
    filesByType: {},
    sizeByType: {},
    averageFileSize: 0,
    largestFile: null,
    smallestFile: null,
    emptyFolders: 0,
    expandedNodes: 0,
    selectedNodes: 0,
  };

  const allFiles: FileData[] = [];

  traverseDepthFirst(nodes, node => {
    stats.totalNodes++;
    stats.maxDepth = Math.max(stats.maxDepth, node.level);

    if (node.isExpanded) stats.expandedNodes++;
    if (node.isSelected) stats.selectedNodes++;

    if (node.type === 'file') {
      const file = node.data as FileData;
      stats.totalFiles++;
      stats.totalSize += file.size;
      allFiles.push(file);

      // Count by type
      stats.filesByType[file.type] = (stats.filesByType[file.type] || 0) + 1;
      stats.sizeByType[file.type] =
        (stats.sizeByType[file.type] || 0) + file.size;

      // Track largest/smallest
      if (!stats.largestFile || file.size > stats.largestFile.size) {
        stats.largestFile = file;
      }
      if (!stats.smallestFile || file.size < stats.smallestFile.size) {
        stats.smallestFile = file;
      }
    } else {
      const folder = node.data as FolderData;
      stats.totalFolders++;

      if (folder.fileCount === 0 && folder.subfolderCount === 0) {
        stats.emptyFolders++;
      }
    }
  });

  stats.averageFileSize =
    stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;

  return stats;
};

/**
 * Get visible nodes (considering expansion state)
 */
export const getVisibleNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  const visibleNodes: TreeNodeEnhanced[] = [];

  const addVisibleNodes = (currentNodes: FileTreeNode[], level: number = 0) => {
    currentNodes.forEach(node => {
      const enhanced = createEnhancedTree([node])[0];
      enhanced.level = level;
      visibleNodes.push(enhanced);

      // Add children if expanded
      if (node.isExpanded && node.children.length > 0) {
        addVisibleNodes(node.children, level + 1);
      }
    });
  };

  addVisibleNodes(nodes);
  return visibleNodes;
};

/**
 * Get selected nodes
 */
export const getSelectedNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  return findNodes(nodes, node => node.isSelected);
};

/**
 * Get expanded nodes
 */
export const getExpandedNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  return findNodes(nodes, node => node.isExpanded);
};

/**
 * Get leaf nodes (files and empty folders)
 */
export const getLeafNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  return findNodes(nodes, node => node.isLeaf);
};

/**
 * Get folder nodes
 */
export const getFolderNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  return findNodesByType(nodes, 'folder');
};

/**
 * Get file nodes
 */
export const getFileNodes = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  return findNodesByType(nodes, 'file');
};

// =============================================================================
// TREE VALIDATION
// =============================================================================

/**
 * Validate tree structure
 */
export const validateTree = (
  nodes: FileTreeNode[]
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  traverseDepthFirst(nodes, node => {
    // Check for duplicate IDs
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);

    // Check for circular references
    let current = node.parent;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current.id)) {
        errors.push(`Circular reference detected at node: ${node.id}`);
        break;
      }
      visited.add(current.id);
      current = current.parent;
    }

    // Check parent-child consistency
    if (node.parent) {
      const parentChildren = node.parent.children;
      if (!parentChildren.some(child => child.id === node.id)) {
        errors.push(
          `Parent-child relationship inconsistent for node: ${node.id}`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if node can be moved to target
 */
export const canMoveNode = (
  nodes: FileTreeNode[],
  sourceId: string,
  targetId: string
): boolean => {
  const sourceNode = findNodeById(nodes, sourceId);
  const targetNode = findNodeById(nodes, targetId);

  if (!sourceNode || !targetNode) return false;

  // Can't move to itself
  if (sourceId === targetId) return false;

  // Can't move to a descendant
  const isDescendant =
    findNodes([sourceNode], node => node.id === targetId).length > 0;
  if (isDescendant) return false;

  // Can only move to folders
  if (targetNode.type !== 'folder') return false;

  return true;
};

/**
 * Get tree depth
 */
export const getTreeDepth = (nodes: FileTreeNode[]): number => {
  let maxDepth = 0;

  const calculateDepth = (currentNodes: FileTreeNode[], depth: number = 0) => {
    maxDepth = Math.max(maxDepth, depth);

    currentNodes.forEach(node => {
      if (node.children.length > 0) {
        calculateDepth(node.children, depth + 1);
      }
    });
  };

  calculateDepth(nodes);
  return maxDepth;
};

/**
 * Flatten tree to array
 */
export const flattenTree = (nodes: FileTreeNode[]): TreeNodeEnhanced[] => {
  const flattened: TreeNodeEnhanced[] = [];

  traverseDepthFirst(nodes, node => {
    flattened.push(node);
  });

  return flattened;
};

/**
 * Build tree from flat array
 */
export const buildTreeFromFlat = (
  items: Array<{ id: string; parentId: string | null; [key: string]: any }>
): FileTreeNode[] => {
  const nodeMap = new Map<string, FileTreeNode>();
  const rootNodes: FileTreeNode[] = [];

  // First pass: create all nodes
  items.forEach(item => {
    const node: FileTreeNode = {
      id: item.id,
      name: item.name || item.id,
      type: item.type || 'file',
      data: item,
      children: [],
      parent: null,
      isExpanded: false,
      isSelected: false,
    };

    nodeMap.set(item.id, node);
  });

  // Second pass: build relationships
  items.forEach(item => {
    const node = nodeMap.get(item.id)!;

    if (item.parentId) {
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
        node.parent = parent;
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
};
