'use client';

import { createContext, useContext } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface Item {
  name: string;
  children?: string[];
  isFile?: boolean;
}

// Tree item type based on headless-tree API
interface TreeItem {
  getId(): string;
  isSelected(): boolean;
  isExpanded(): boolean;
  expand?(): void;
  toggleExpanded?(): void;
}

// Tree API type based on actual usage
interface TreeAPI {
  getItems(): TreeItem[];
}

// =============================================================================
// WORKSPACE TREE SELECTION CONTEXT
// =============================================================================

interface WorkspaceTreeSelectionContextType {
  tree: TreeAPI | null;
  selectedItems: string[];
  selectedItem: string | null;
  getSelectedFolderForCreation: () => string;
  isItemFolder: (itemId: string) => boolean;
  getItemName: (itemId: string) => string;
  expandItem: (itemId: string) => void;
}

export const WorkspaceTreeSelectionContext =
  createContext<WorkspaceTreeSelectionContextType | null>(null);

// =============================================================================
// HOOK
// =============================================================================

export function useWorkspaceTreeSelection() {
  const context = useContext(WorkspaceTreeSelectionContext);

  if (!context) {
    throw new Error(
      'useWorkspaceTreeSelection must be used within WorkspaceTreeSelectionProvider'
    );
  }

  return context;
}

// Safe version that returns null if not in context (used by toolbar)
export function useWorkspaceTreeSelectionSafe() {
  return useContext(WorkspaceTreeSelectionContext);
}
