'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createOnDropHandler,
  type TreeInstance,
  type ItemInstance,
  type DragTarget,
} from '@headless-tree/core';
import {
  handleDrop,
  handleRename,
  handleDropForeignDragObject,
  handleCompleteForeignDrop,
  createForeignDragObject,
  canDropForeignDragObject,
  handleAddItem,
  handleDeleteItems,
} from '../handlers';
import type { WorkspaceTreeItem } from '../lib/tree-data';

export type UseTreeHandlersParams = {
  tree: TreeInstance<WorkspaceTreeItem> | null;
  rootId: string | undefined;
};

/**
 * Hook that wires together all tree handlers with React dependencies
 * Provides memoized handlers ready for use in tree configuration
 */
export function useTreeHandlers({ tree, rootId }: UseTreeHandlersParams) {
  const queryClient = useQueryClient();

  // Return null handlers if tree is not ready
  if (!tree) {
    return {
      onDrop: undefined,
      onRename: undefined,
      onDropForeignDragObject: undefined,
      onCompleteForeignDrop: undefined,
      createForeignDragObject: undefined,
      canDropForeignDragObject: undefined,
      addItem: () => null,
      deleteItems: () => {},
    };
  }

  // Memoize drop handler with dependencies
  const onDrop = React.useMemo(
    () => createOnDropHandler((parentItem: ItemInstance<WorkspaceTreeItem>, newChildren: string[]) => {
      return handleDrop({ parentItem, newChildren }, { tree });
    }),
    [tree]
  );

  // Memoize rename handler with dependencies
  const onRename = React.useCallback(
    (item: ItemInstance<WorkspaceTreeItem>, value: string) => {
      return handleRename({ item, value }, { queryClient });
    },
    [queryClient]
  );

  // Memoize foreign drop handlers
  const onDropForeignDragObject = React.useCallback(
    (dataTransfer: DataTransfer, target: DragTarget<WorkspaceTreeItem>) => {
      return handleDropForeignDragObject(dataTransfer, target);
    },
    []
  );

  const onCompleteForeignDrop = React.useCallback(
    (items: ItemInstance<WorkspaceTreeItem>[]) => {
      return handleCompleteForeignDrop(items);
    },
    []
  );

  // Memoize add item handler
  const addItem = React.useCallback(
    (name: string, parentId?: string, isFile = false) => {
      return handleAddItem({ name, parentId, isFile }, { tree, rootId });
    },
    [tree, rootId]
  );

  // Memoize delete items handler
  const deleteItems = React.useCallback(
    (itemIds: string[]) => {
      return handleDeleteItems({ itemIds }, { tree });
    },
    [tree]
  );

  return {
    // Core tree handlers
    onDrop,
    onRename,
    onDropForeignDragObject,
    onCompleteForeignDrop,
    createForeignDragObject,
    canDropForeignDragObject,
    
    // Item manipulation handlers
    addItem,
    deleteItems,
  };
}