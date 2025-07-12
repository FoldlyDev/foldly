// =============================================================================
// FILE TREE COMPONENTS INDEX - Single entry point for all tree components
// =============================================================================

// Core components
export * from './tree-container';
export * from './tree-node';
export * from './tree-provider';

// Component variants
export {
  WorkspaceTreeContainer,
  FilesTreeContainer,
  UploadTreeContainer,
} from './tree-container';

export {
  WorkspaceTreeProvider,
  FilesTreeProvider,
  UploadTreeProvider,
} from './tree-provider';

// Hooks
export * from '@/lib/hooks/file-tree';

// Types
export * from '@/types/file-tree';

// Default exports for convenience
export { default as TreeContainer } from './tree-container';
export { default as TreeNode } from './tree-node';
export { default as TreeProvider } from './tree-provider';
