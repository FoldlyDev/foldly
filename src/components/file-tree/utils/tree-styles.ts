import type { ItemInstance } from '@headless-tree/core';
import { cn } from '@/lib/utils/utils';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Helper function to get CSS classes for tree items
 */
export const getCssClass = (item: ItemInstance<TreeItemType>) =>
  cn('treeitem', {
    focused: item.isFocused(),
    expanded: item.isExpanded(),
    selected: item.isSelected(),
    folder: item.isFolder(),
    drop: item.isDragTarget(),
    searchmatch: item.isMatchingSearch(),
  });