import type { TreeInstance } from '@headless-tree/core';
import type { TreeItem } from './tree-types';

/**
 * Props for the DragPreview component
 */
export interface DragPreviewProps<T extends TreeItem = TreeItem> {
  tree: TreeInstance<T>;
  id?: string;
}

/**
 * Configuration returned by useDragPreview hook
 */
export interface DragPreviewConfig {
  setDragImage: () => {
    imgElement: HTMLElement;
    xOffset: number;
    yOffset: number;
  };
}