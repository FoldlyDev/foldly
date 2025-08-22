import type { ItemInstance, DragTarget } from '@headless-tree/core';
import type { TreeItem } from './tree-types';

/**
 * Handler for renaming tree items
 */
export type RenameHandler<T extends TreeItem = TreeItem> = (
  item: ItemInstance<T>,
  newName: string
) => void | Promise<void>;

/**
 * Handler for drop operations
 */
export type DropHandler<T extends TreeItem = TreeItem> = (
  items: ItemInstance<T>[],
  target: DragTarget<T>
) => void | Promise<void>;

/**
 * State updater function for tree items
 */
export type ItemsUpdater<T extends TreeItem = TreeItem> = React.Dispatch<
  React.SetStateAction<Record<string, T>>
>;

/**
 * Configuration for tree handlers
 */
export interface TreeHandlerConfig<T extends TreeItem = TreeItem> {
  items: Record<string, T>;
  setItems: ItemsUpdater<T>;
}

/**
 * Collection of all tree handlers
 */
export interface TreeHandlers<T extends TreeItem = TreeItem> {
  onRename?: RenameHandler<T>;
  onDrop?: DropHandler<T>;
}