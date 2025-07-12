// =============================================================================
// TREE UTILITIES - Utility functions for tree manipulation and building
// =============================================================================
// 🎯 Helper functions for tree data manipulation and building from different sources

import type {
  TreeNode,
  TreeBuilderOptions,
  TreeFilterFunction,
  TreeSortFunction,
  DatabaseId,
  File,
  Folder,
  Link,
  UploadFile,
} from '@/types/file-tree';

// =============================================================================
// TREE BUILDERS - Functions to build tree from different data sources
// =============================================================================

/**
 * Build tree from workspace data
 */
export const buildWorkspaceTree = (
  folders: Folder[],
  files: File[],
  options: TreeBuilderOptions = {}
): TreeNode[] => {
  const {
    sortFunction,
    filterFunction,
    maxDepth = 10,
    includeEmpty = true,
  } = options;

  // Convert folders to tree nodes
  const folderNodes: TreeNode[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: 'folder',
    path: folder.path,
    parentId: folder.parentFolderId,
    children: [],
    folderData: folder,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    level: folder.depth,
  }));

  // Convert files to tree nodes
  const fileNodes: TreeNode[] = files.map(file => ({
    id: file.id,
    name: file.fileName,
    type: 'file',
    size: file.fileSize,
    mimeType: file.mimeType,
    parentId: file.folderId,
    fileData: file,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  }));

  // Combine all nodes
  const allNodes = [...folderNodes, ...fileNodes];

  // Build hierarchical structure
  const tree = buildHierarchy(allNodes, null, maxDepth);

  // Apply filtering
  let filteredTree = filterFunction ? tree.filter(filterFunction) : tree;

  // Apply sorting
  if (sortFunction) {
    filteredTree = sortTree(filteredTree, sortFunction);
  }

  // Remove empty folders if needed
  if (!includeEmpty) {
    filteredTree = removeEmptyFolders(filteredTree);
  }

  return filteredTree;
};

/**
 * Build tree from links data
 */
export const buildLinksTree = (
  links: Link[],
  linkFiles: Record<string, File[]> = {},
  options: TreeBuilderOptions = {}
): TreeNode[] => {
  const { sortFunction, filterFunction, maxDepth = 5 } = options;

  // Convert links to tree nodes
  const linkNodes: TreeNode[] = links.map(link => ({
    id: link.id,
    name: link.title,
    type: 'link',
    linkData: link,
    children: [],
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  }));

  // Add files to each link
  linkNodes.forEach(linkNode => {
    const files = linkFiles[linkNode.id] || [];
    linkNode.children = files.map(file => ({
      id: file.id,
      name: file.fileName,
      type: 'file',
      size: file.fileSize,
      mimeType: file.mimeType,
      parentId: linkNode.id,
      fileData: file,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));
  });

  // Apply filtering
  let filteredTree = filterFunction
    ? linkNodes.filter(filterFunction)
    : linkNodes;

  // Apply sorting
  if (sortFunction) {
    filteredTree = sortTree(filteredTree, sortFunction);
  }

  return filteredTree;
};

/**
 * Build tree from upload data
 */
export const buildUploadTree = (
  uploadFiles: UploadFile[],
  options: TreeBuilderOptions = {}
): TreeNode[] => {
  const { sortFunction, filterFunction, maxDepth = 5 } = options;

  // Convert upload files to tree nodes
  const fileNodes: TreeNode[] = uploadFiles.map(file => ({
    id: file.id || `upload-${Date.now()}-${Math.random()}`,
    name: file.name,
    type: 'file',
    size: file.size,
    mimeType: file.type,
    parentId: null, // Upload files start at root
    uploadData: file,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Apply filtering
  let filteredTree = filterFunction
    ? fileNodes.filter(filterFunction)
    : fileNodes;

  // Apply sorting
  if (sortFunction) {
    filteredTree = sortTree(filteredTree, sortFunction);
  }

  return filteredTree;
};

// =============================================================================
// TREE MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Build hierarchical structure from flat array
 */
export const buildHierarchy = (
  nodes: TreeNode[],
  parentId: DatabaseId | null,
  maxDepth: number,
  currentDepth: number = 0
): TreeNode[] => {
  if (currentDepth >= maxDepth) return [];

  const children = nodes.filter(node => node.parentId === parentId);

  return children.map(child => ({
    ...child,
    level: currentDepth,
    children: buildHierarchy(nodes, child.id, maxDepth, currentDepth + 1),
  }));
};

/**
 * Flatten tree structure to array
 */
export const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
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
 * Find node by ID in tree
 */
export const findNodeById = (
  nodes: TreeNode[],
  id: DatabaseId
): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Find node by path in tree
 */
export const findNodeByPath = (
  nodes: TreeNode[],
  path: string
): TreeNode | null => {
  const pathParts = path.split('/').filter(Boolean);
  let currentNodes = nodes;

  for (const part of pathParts) {
    const node = currentNodes.find(n => n.name === part);
    if (!node) return null;

    if (pathParts.indexOf(part) === pathParts.length - 1) {
      return node;
    }

    currentNodes = node.children || [];
  }

  return null;
};

/**
 * Get all parent nodes for a given node
 */
export const getParentNodes = (
  nodes: TreeNode[],
  nodeId: DatabaseId
): TreeNode[] => {
  const parents: TreeNode[] = [];

  const findParents = (
    currentNodes: TreeNode[],
    targetId: DatabaseId
  ): boolean => {
    for (const node of currentNodes) {
      if (node.children) {
        if (node.children.some(child => child.id === targetId)) {
          parents.push(node);
          return true;
        }
        if (findParents(node.children, targetId)) {
          parents.push(node);
          return true;
        }
      }
    }
    return false;
  };

  findParents(nodes, nodeId);
  return parents.reverse();
};

/**
 * Get all child nodes for a given node
 */
export const getChildNodes = (
  nodes: TreeNode[],
  nodeId: DatabaseId
): TreeNode[] => {
  const node = findNodeById(nodes, nodeId);
  if (!node || !node.children) return [];

  return flattenTree(node.children);
};

/**
 * Check if node is descendant of another node
 */
export const isDescendant = (
  nodes: TreeNode[],
  ancestorId: DatabaseId,
  nodeId: DatabaseId
): boolean => {
  const ancestor = findNodeById(nodes, ancestorId);
  if (!ancestor) return false;

  const descendants = getChildNodes(nodes, ancestorId);
  return descendants.some(node => node.id === nodeId);
};

// =============================================================================
// TREE SORTING FUNCTIONS
// =============================================================================

/**
 * Sort tree recursively
 */
export const sortTree = (
  nodes: TreeNode[],
  sortFunction: TreeSortFunction
): TreeNode[] => {
  const sortedNodes = [...nodes].sort(sortFunction);

  return sortedNodes.map(node => ({
    ...node,
    children: node.children ? sortTree(node.children, sortFunction) : undefined,
  }));
};

/**
 * Sort by name (folders first)
 */
export const sortByName: TreeSortFunction = (a, b) => {
  // Folders first
  if (a.type === 'folder' && b.type !== 'folder') return -1;
  if (a.type !== 'folder' && b.type === 'folder') return 1;

  // Then by name
  return a.name.localeCompare(b.name);
};

/**
 * Sort by size (largest first)
 */
export const sortBySize: TreeSortFunction = (a, b) => {
  // Folders first
  if (a.type === 'folder' && b.type !== 'folder') return -1;
  if (a.type !== 'folder' && b.type === 'folder') return 1;

  // Then by size
  const aSize = a.size || 0;
  const bSize = b.size || 0;
  return bSize - aSize;
};

/**
 * Sort by date (newest first)
 */
export const sortByDate: TreeSortFunction = (a, b) => {
  // Folders first
  if (a.type === 'folder' && b.type !== 'folder') return -1;
  if (a.type !== 'folder' && b.type === 'folder') return 1;

  // Then by date
  const aDate = a.createdAt || new Date(0);
  const bDate = b.createdAt || new Date(0);
  return bDate.getTime() - aDate.getTime();
};

/**
 * Sort by type
 */
export const sortByType: TreeSortFunction = (a, b) => {
  // Folders first
  if (a.type === 'folder' && b.type !== 'folder') return -1;
  if (a.type !== 'folder' && b.type === 'folder') return 1;

  // Then by type
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type);
  }

  // Then by name
  return a.name.localeCompare(b.name);
};

// =============================================================================
// TREE FILTERING FUNCTIONS
// =============================================================================

/**
 * Filter tree recursively
 */
export const filterTree = (
  nodes: TreeNode[],
  filterFunction: TreeFilterFunction
): TreeNode[] => {
  const filtered: TreeNode[] = [];

  for (const node of nodes) {
    let includeNode = filterFunction(node);
    let children: TreeNode[] = [];

    if (node.children) {
      children = filterTree(node.children, filterFunction);
      // Include parent if any children match
      if (children.length > 0) {
        includeNode = true;
      }
    }

    if (includeNode) {
      filtered.push({
        ...node,
        children,
      });
    }
  }

  return filtered;
};

/**
 * Filter by name
 */
export const filterByName = (query: string): TreeFilterFunction => {
  const lowerQuery = query.toLowerCase();
  return (node: TreeNode) => node.name.toLowerCase().includes(lowerQuery);
};

/**
 * Filter by type
 */
export const filterByType = (types: string[]): TreeFilterFunction => {
  return (node: TreeNode) => types.includes(node.type);
};

/**
 * Filter by size range
 */
export const filterBySize = (min: number, max: number): TreeFilterFunction => {
  return (node: TreeNode) => {
    if (node.type === 'folder') return true;
    const size = node.size || 0;
    return size >= min && size <= max;
  };
};

// =============================================================================
// TREE UTILITY FUNCTIONS
// =============================================================================

/**
 * Remove empty folders from tree
 */
export const removeEmptyFolders = (nodes: TreeNode[]): TreeNode[] => {
  const filtered: TreeNode[] = [];

  for (const node of nodes) {
    if (node.type === 'folder') {
      const children = node.children ? removeEmptyFolders(node.children) : [];
      if (children.length > 0) {
        filtered.push({
          ...node,
          children,
        });
      }
    } else {
      filtered.push(node);
    }
  }

  return filtered;
};

/**
 * Count nodes in tree
 */
export const countNodes = (
  nodes: TreeNode[]
): { total: number; folders: number; files: number; links: number } => {
  let total = 0;
  let folders = 0;
  let files = 0;
  let links = 0;

  const count = (currentNodes: TreeNode[]) => {
    for (const node of currentNodes) {
      total++;

      switch (node.type) {
        case 'folder':
          folders++;
          break;
        case 'file':
          files++;
          break;
        case 'link':
          links++;
          break;
      }

      if (node.children) {
        count(node.children);
      }
    }
  };

  count(nodes);
  return { total, folders, files, links };
};

/**
 * Calculate total size of tree
 */
export const calculateTreeSize = (nodes: TreeNode[]): number => {
  let totalSize = 0;

  const calculate = (currentNodes: TreeNode[]) => {
    for (const node of currentNodes) {
      if (node.size) {
        totalSize += node.size;
      }

      if (node.children) {
        calculate(node.children);
      }
    }
  };

  calculate(nodes);
  return totalSize;
};

/**
 * Get tree depth
 */
export const getTreeDepth = (nodes: TreeNode[]): number => {
  let maxDepth = 0;

  const getDepth = (currentNodes: TreeNode[], depth: number = 0) => {
    maxDepth = Math.max(maxDepth, depth);

    for (const node of currentNodes) {
      if (node.children) {
        getDepth(node.children, depth + 1);
      }
    }
  };

  getDepth(nodes);
  return maxDepth;
};

// =============================================================================
// TREE EXPORT FUNCTIONS
// =============================================================================

/**
 * Export tree to JSON
 */
export const exportTreeToJSON = (nodes: TreeNode[]): string => {
  return JSON.stringify(nodes, null, 2);
};

/**
 * Import tree from JSON
 */
export const importTreeFromJSON = (json: string): TreeNode[] => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to import tree from JSON:', error);
    return [];
  }
};

// =============================================================================
// TREE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate tree structure
 */
export const validateTree = (
  nodes: TreeNode[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  const validate = (
    currentNodes: TreeNode[],
    parentId: DatabaseId | null = null
  ) => {
    for (const node of currentNodes) {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      // Check parent relationship
      if (node.parentId !== parentId) {
        errors.push(`Invalid parent relationship for node ${node.id}`);
      }

      // Check required fields
      if (!node.name) {
        errors.push(`Missing name for node ${node.id}`);
      }

      if (!node.type) {
        errors.push(`Missing type for node ${node.id}`);
      }

      // Validate children
      if (node.children) {
        validate(node.children, node.id);
      }
    }
  };

  validate(nodes);
  return { valid: errors.length === 0, errors };
};
