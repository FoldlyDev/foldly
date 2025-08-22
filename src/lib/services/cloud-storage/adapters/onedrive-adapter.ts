import { CloudFile, CloudTreeNode } from '../providers/types';

export class OneDriveTreeAdapter {
  static buildTree(files: CloudFile[]): CloudTreeNode[] {
    const nodeMap = new Map<string, CloudTreeNode>();
    const rootNodes: CloudTreeNode[] = [];

    // First pass: Create all nodes
    files.forEach(file => {
      const node: CloudTreeNode = {
        id: file.id,
        name: file.name,
        type: file.isFolder ? 'folder' as const : 'file' as const,
        file,
        ...(file.isFolder && { children: [] }),
        parentId: file.parents?.[0],
      };
      nodeMap.set(file.id, node);
    });

    // Second pass: Build tree structure
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        if (parent.children) {
          parent.children.push(node);
        }
      } else {
        // No parent or parent not in current set = root node
        rootNodes.push(node);
      }
    });

    // Sort children
    this.sortNodes(rootNodes);
    nodeMap.forEach(node => {
      if (node.children) {
        this.sortNodes(node.children);
      }
    });

    return rootNodes;
  }

  static updateNodeChildren(
    tree: CloudTreeNode[],
    parentId: string,
    children: CloudFile[]
  ): CloudTreeNode[] {
    return tree.map(node => {
      if (node.id === parentId) {
        const childNodes = children.map(file => ({
          id: file.id,
          name: file.name,
          type: file.isFolder ? 'folder' as const : 'file' as const,
          file,
          ...(file.isFolder && { children: [] }),
          parentId: parentId,
        }));
        this.sortNodes(childNodes);
        return {
          ...node,
          children: childNodes,
          isLoading: false,
          isExpanded: true,
        };
      }

      if (node.children) {
        return {
          ...node,
          children: this.updateNodeChildren(node.children, parentId, children),
        };
      }

      return node;
    });
  }

  static findNode(tree: CloudTreeNode[], nodeId: string): CloudTreeNode | null {
    for (const node of tree) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = this.findNode(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  static getNodePath(tree: CloudTreeNode[], nodeId: string): CloudTreeNode[] {
    const path: CloudTreeNode[] = [];

    const findPath = (nodes: CloudTreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          path.push(node);
          return true;
        }
        if (node.children) {
          if (findPath(node.children, targetId)) {
            path.unshift(node);
            return true;
          }
        }
      }
      return false;
    };

    findPath(tree, nodeId);
    return path;
  }

  private static sortNodes(nodes: CloudTreeNode[]): void {
    nodes.sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  }
}