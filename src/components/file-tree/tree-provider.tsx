// =============================================================================
// TREE PROVIDER - Context provider for tree state and configuration
// =============================================================================
// 🎯 Provides tree context and configuration to child components

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import type {
  ContextType,
  ContextConfig,
  ContextOperations,
  DatabaseId,
  TreeNode,
} from '@/types/file-tree';

// =============================================================================
// TREE CONTEXT TYPES
// =============================================================================

interface TreeContextValue {
  // Context configuration
  contextType: ContextType;
  contextId?: DatabaseId;
  config: Partial<ContextConfig>;

  // Tree data
  nodes: TreeNode[];
  isLoading: boolean;
  error: Error | null;

  // Tree state
  expandedNodes: Set<DatabaseId>;
  selectedNodes: Set<DatabaseId>;

  // Tree operations
  operations: Partial<ContextOperations>;

  // Utility functions
  refreshTree: () => void;
  resetTree: () => void;
}

// =============================================================================
// TREE CONTEXT
// =============================================================================

const TreeContext = createContext<TreeContextValue | null>(null);

// =============================================================================
// TREE PROVIDER PROPS
// =============================================================================

interface TreeProviderProps {
  children: React.ReactNode;
  contextType: ContextType;
  contextId?: DatabaseId;
  config?: Partial<ContextConfig>;
  nodes?: TreeNode[];
  isLoading?: boolean;
  error?: Error | null;
  operations?: Partial<ContextOperations>;
  onRefresh?: () => void;
}

// =============================================================================
// TREE PROVIDER COMPONENT
// =============================================================================

export const TreeProvider: React.FC<TreeProviderProps> = ({
  children,
  contextType,
  contextId,
  config = {},
  nodes = [],
  isLoading = false,
  error = null,
  operations = {},
  onRefresh,
}) => {
  const { expandedNodes, selectedNodes, reset } = useTreeStore();

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue = useMemo<TreeContextValue>(
    () => ({
      // Context configuration
      contextType,
      contextId,
      config,

      // Tree data
      nodes,
      isLoading,
      error,

      // Tree state
      expandedNodes,
      selectedNodes,

      // Tree operations
      operations,

      // Utility functions
      refreshTree: () => {
        onRefresh?.();
      },
      resetTree: () => {
        reset();
      },
    }),
    [
      contextType,
      contextId,
      config,
      nodes,
      isLoading,
      error,
      expandedNodes,
      selectedNodes,
      operations,
      onRefresh,
      reset,
    ]
  );

  // =============================================================================
  // LIFECYCLE EFFECTS
  // =============================================================================

  // Reset tree state when context changes
  useEffect(() => {
    reset();
  }, [contextType, contextId, reset]);

  // =============================================================================
  // RENDER PROVIDER
  // =============================================================================

  return (
    <TreeContext.Provider value={contextValue}>{children}</TreeContext.Provider>
  );
};

// =============================================================================
// TREE CONTEXT HOOK
// =============================================================================

export const useTreeContext = (): TreeContextValue => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }

  return context;
};

// =============================================================================
// SPECIALIZED PROVIDER COMPONENTS
// =============================================================================

/**
 * Workspace Tree Provider
 */
export const WorkspaceTreeProvider: React.FC<
  Omit<TreeProviderProps, 'contextType'> & { workspaceId: DatabaseId }
> = ({ workspaceId, ...props }) => (
  <TreeProvider
    {...props}
    contextType='workspace'
    contextId={workspaceId}
    config={{
      allowFolderCreation: true,
      allowFileUpload: true,
      allowDragDrop: true,
      allowContextMenu: true,
      maxDepth: 10,
      showInlineActions: true,
      ...props.config,
    }}
  />
);

/**
 * Files Tree Provider
 */
export const FilesTreeProvider: React.FC<
  Omit<TreeProviderProps, 'contextType'> & {
    workspaceId: DatabaseId;
    linkIds?: DatabaseId[];
  }
> = ({ workspaceId, linkIds = [], ...props }) => (
  <TreeProvider
    {...props}
    contextType='files'
    contextId={workspaceId}
    config={{
      showLinkPanel: true,
      showWorkspacePanel: true,
      allowDragFromLinks: true,
      allowMultiSelect: true,
      selectedLinks: linkIds,
      ...props.config,
    }}
  />
);

/**
 * Upload Tree Provider
 */
export const UploadTreeProvider: React.FC<
  Omit<TreeProviderProps, 'contextType'> & { linkId: DatabaseId }
> = ({ linkId, ...props }) => (
  <TreeProvider
    {...props}
    contextType='upload'
    contextId={linkId}
    config={{
      allowFolderCreation: true,
      allowFileReorganization: true,
      allowDragDrop: true,
      maxDepth: 5,
      temporaryStructure: true,
      ...props.config,
    }}
  />
);

// =============================================================================
// CONTEXT HOOKS
// =============================================================================

/**
 * Hook to get tree configuration
 */
export const useTreeConfig = () => {
  const { config, contextType } = useTreeContext();
  return { config, contextType };
};

/**
 * Hook to get tree data
 */
export const useTreeData = () => {
  const { nodes, isLoading, error } = useTreeContext();
  return { nodes, isLoading, error };
};

/**
 * Hook to get tree operations
 */
export const useTreeOperations = () => {
  const { operations, contextType } = useTreeContext();
  return { operations, contextType };
};

/**
 * Hook to get tree utilities
 */
export const useTreeUtils = () => {
  const { refreshTree, resetTree } = useTreeContext();
  return { refreshTree, resetTree };
};

// =============================================================================
// TREE PROVIDER WITH QUERY
// =============================================================================

/**
 * Tree Provider with React Query integration
 */
export const TreeProviderWithQuery: React.FC<{
  children: React.ReactNode;
  contextType: ContextType;
  contextId?: DatabaseId;
  config?: Partial<ContextConfig>;
  queryKey: string[];
  queryFn: () => Promise<TreeNode[]>;
  operations?: Partial<ContextOperations>;
}> = ({
  children,
  contextType,
  contextId,
  config,
  queryKey,
  queryFn,
  operations,
}) => {
  // This would integrate with React Query
  // For now, we'll use a simple implementation
  const [nodes, setNodes] = React.useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const refreshTree = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await queryFn();
      setNodes(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  // Initial load
  React.useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  return (
    <TreeProvider
      contextType={contextType}
      contextId={contextId}
      config={config}
      nodes={nodes}
      isLoading={isLoading}
      error={error}
      operations={operations}
      onRefresh={refreshTree}
    >
      {children}
    </TreeProvider>
  );
};

// =============================================================================
// TREE CONTEXT UTILITIES
// =============================================================================

/**
 * Check if tree supports a specific feature
 */
export const useTreeFeature = (feature: string): boolean => {
  const { config, contextType } = useTreeContext();

  switch (feature) {
    case 'folderCreation':
      return contextType === 'workspace' || contextType === 'upload';
    case 'dragDrop':
      return contextType !== 'files';
    case 'contextMenu':
      return contextType === 'workspace' || contextType === 'upload';
    case 'multiSelect':
      return true; // All contexts support multi-select
    default:
      return false;
  }
};

/**
 * Get tree statistics
 */
export const useTreeStats = () => {
  const { nodes, expandedNodes, selectedNodes } = useTreeContext();

  return useMemo(() => {
    const flattenNodes = (nodeList: TreeNode[]): TreeNode[] => {
      const flattened: TreeNode[] = [];

      for (const node of nodeList) {
        flattened.push(node);
        if (node.children) {
          flattened.push(...flattenNodes(node.children));
        }
      }

      return flattened;
    };

    const allNodes = flattenNodes(nodes);
    const folders = allNodes.filter(node => node.type === 'folder');
    const files = allNodes.filter(node => node.type === 'file');
    const links = allNodes.filter(node => node.type === 'link');

    return {
      totalNodes: allNodes.length,
      folders: folders.length,
      files: files.length,
      links: links.length,
      expanded: expandedNodes.size,
      selected: selectedNodes.size,
    };
  }, [nodes, expandedNodes, selectedNodes]);
};

// =============================================================================
// EXPORTS
// =============================================================================

export default TreeProvider;
