'use client';

import { useCallback } from 'react';
import type { TreeItem, TreeFileItem, TreeFolderItem } from '../types/tree-types';
import type { ItemsUpdater } from '../types/handler-types';
import { isFolder } from '../types/tree-types';

/**
 * Hook for tree data mutations
 * Provides methods to add, remove, and manipulate tree items
 */
export function useTreeMutations<T extends TreeItem = TreeItem>(
  setItems: ItemsUpdater<T>
) {
  /**
   * Add a new file to a specific folder
   */
  const addFile = useCallback(
    (
      fileName: string,
      targetFolderId: string,
      fileData?: Partial<TreeFileItem>
    ): string => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const extension = fileName.split('.').pop() || null;

      const newFile: TreeFileItem = {
        id: fileId,
        name: fileName,
        type: 'file',
        parentId: targetFolderId,
        mimeType: fileData?.mimeType || 'application/octet-stream',
        fileSize: fileData?.fileSize || 0,
        extension,
        processingStatus: fileData?.processingStatus || 'pending',
        ...fileData,
      };

      setItems(prevItems => {
        const targetFolder = prevItems[targetFolderId];
        if (!targetFolder || !isFolder(targetFolder)) {
          console.error(`Target folder ${targetFolderId} not found or is not a folder`);
          return prevItems;
        }

        return {
          ...prevItems,
          [fileId]: newFile as T,
          [targetFolderId]: {
            ...targetFolder,
            children: [...(targetFolder.children || []), fileId],
          } as T,
        };
      });

      return fileId;
    },
    [setItems]
  );

  /**
   * Add a new folder to a specific parent folder
   */
  const addFolder = useCallback(
    (
      folderName: string,
      parentFolderId: string,
      folderData?: Partial<TreeFolderItem>
    ): string => {
      const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      setItems(prevItems => {
        const parentFolder = prevItems[parentFolderId];
        if (!parentFolder || !isFolder(parentFolder)) {
          console.error(`Parent folder ${parentFolderId} not found or is not a folder`);
          return prevItems;
        }

        const parentPath = (parentFolder as TreeFolderItem).path || '/';
        const newPath = parentPath === '/' ? `/${folderName}` : `${parentPath}/${folderName}`;
        const parentDepth = (parentFolder as TreeFolderItem).depth || 0;

        const newFolder: TreeFolderItem = {
          id: folderId,
          name: folderName,
          type: 'folder',
          parentId: parentFolderId,
          path: newPath,
          depth: parentDepth + 1,
          children: [],
          ...folderData,
        };

        return {
          ...prevItems,
          [folderId]: newFolder as T,
          [parentFolderId]: {
            ...parentFolder,
            children: [...(parentFolder.children || []), folderId],
          } as T,
        };
      });

      return folderId;
    },
    [setItems]
  );

  /**
   * Remove items from the tree (files or folders)
   * Recursively removes children if removing a folder
   */
  const removeItems = useCallback(
    (itemIds: string[]): void => {
      setItems(prevItems => {
        const newItems = { ...prevItems };
        const itemsToRemove = new Set<string>();

        // Collect all items to remove (including children for folders)
        const collectItemsToRemove = (id: string) => {
          itemsToRemove.add(id);
          const item = newItems[id];
          if (item && isFolder(item) && item.children) {
            item.children.forEach(collectItemsToRemove);
          }
        };

        itemIds.forEach(collectItemsToRemove);

        // Remove items from their parents' children arrays
        Object.values(newItems).forEach(item => {
          if (isFolder(item) && item.children) {
            (item as TreeFolderItem).children = item.children.filter(
              childId => !itemsToRemove.has(childId)
            );
          }
        });

        // Delete the items themselves
        itemsToRemove.forEach(id => {
          delete newItems[id];
        });

        return newItems;
      });
    },
    [setItems]
  );

  /**
   * Move items to a different folder
   */
  const moveItems = useCallback(
    (itemIds: string[], targetFolderId: string): void => {
      setItems(prevItems => {
        const newItems = { ...prevItems };
        const targetFolder = newItems[targetFolderId];

        if (!targetFolder || !isFolder(targetFolder)) {
          console.error(`Target folder ${targetFolderId} not found or is not a folder`);
          return prevItems;
        }

        // Remove items from their current parents
        Object.values(newItems).forEach(item => {
          if (isFolder(item) && item.children) {
            (item as TreeFolderItem).children = item.children.filter(
              childId => !itemIds.includes(childId)
            );
          }
        });

        // Add items to the target folder and update their parentId
        itemIds.forEach(itemId => {
          const item = newItems[itemId];
          if (item) {
            item.parentId = targetFolderId;
            
            // Update path for folders
            if (isFolder(item)) {
              const targetPath = (targetFolder as TreeFolderItem).path || '/';
              const targetDepth = (targetFolder as TreeFolderItem).depth || 0;
              (item as TreeFolderItem).path = 
                targetPath === '/' ? `/${item.name}` : `${targetPath}/${item.name}`;
              (item as TreeFolderItem).depth = targetDepth + 1;
              
              // Recursively update children paths
              const updateChildPaths = (parentItem: TreeFolderItem, parentPath: string, parentDepth: number) => {
                parentItem.children?.forEach(childId => {
                  const child = newItems[childId];
                  if (child && isFolder(child)) {
                    const childFolder = child as TreeFolderItem;
                    childFolder.path = `${parentPath}/${child.name}`;
                    childFolder.depth = parentDepth + 1;
                    updateChildPaths(childFolder, childFolder.path, childFolder.depth);
                  }
                });
              };
              updateChildPaths(item as TreeFolderItem, (item as TreeFolderItem).path, (item as TreeFolderItem).depth);
            }
          }
        });

        // Add items to target folder's children
        (targetFolder as TreeFolderItem).children = [
          ...(targetFolder.children || []),
          ...itemIds.filter(id => newItems[id]),
        ];

        return newItems;
      });
    },
    [setItems]
  );

  /**
   * Rename an item (file or folder)
   */
  const renameItem = useCallback(
    (itemId: string, newName: string): void => {
      setItems(prevItems => {
        const item = prevItems[itemId];
        if (!item) {
          console.error(`Item ${itemId} not found`);
          return prevItems;
        }

        const updatedItem = { ...item, name: newName };

        // If it's a folder, update its path and all children paths
        if (isFolder(updatedItem)) {
          const folder = updatedItem as TreeFolderItem;
          const oldPath = folder.path;
          const pathSegments = oldPath.split('/').filter(s => s);
          pathSegments[pathSegments.length - 1] = newName;
          const newPath = '/' + pathSegments.join('/');
          folder.path = newPath;

          // Update all descendant paths
          const updateDescendantPaths = (items: typeof prevItems, parentFolder: TreeFolderItem) => {
            parentFolder.children?.forEach(childId => {
              const child = items[childId];
              if (child && isFolder(child)) {
                const childFolder = child as TreeFolderItem;
                childFolder.path = `${parentFolder.path}/${child.name}`;
                updateDescendantPaths(items, childFolder);
              }
            });
          };

          const newItems = { ...prevItems, [itemId]: updatedItem as T };
          updateDescendantPaths(newItems, folder);
          return newItems;
        }

        return {
          ...prevItems,
          [itemId]: updatedItem as T,
        };
      });
    },
    [setItems]
  );

  /**
   * Duplicate items (creates copies with new IDs)
   */
  const duplicateItems = useCallback(
    (itemIds: string[]): string[] => {
      const newIds: string[] = [];

      setItems(prevItems => {
        let newItems = { ...prevItems };

        itemIds.forEach(itemId => {
          const originalItem = prevItems[itemId];
          if (!originalItem) return;

          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 11);
          
          // Create deep copy with new ID
          const duplicateItem = (item: T, parentId?: string | null): string => {
            const newId = `${item.type}-${timestamp}-${randomSuffix}`;
            const copiedItem = {
              ...item,
              id: newId,
              name: `${item.name} (copy)`,
              parentId: parentId !== undefined ? parentId : item.parentId,
            };

            // If it's a folder, recursively duplicate children
            if (isFolder(copiedItem) && copiedItem.children) {
              const newChildren: string[] = [];
              copiedItem.children.forEach(childId => {
                const child = prevItems[childId];
                if (child) {
                  const newChildId = duplicateItem(child, newId);
                  newChildren.push(newChildId);
                }
              });
              (copiedItem as TreeFolderItem).children = newChildren;
            }

            newItems[newId] = copiedItem as T;
            return newId;
          };

          const newId = duplicateItem(originalItem);
          newIds.push(newId);

          // Add to parent's children if it has a parent
          if (originalItem.parentId) {
            const parent = newItems[originalItem.parentId];
            if (parent && isFolder(parent)) {
              (parent as TreeFolderItem).children = [
                ...(parent.children || []),
                newId,
              ];
            }
          }
        });

        return newItems;
      });

      return newIds;
    },
    [setItems]
  );

  /**
   * Get all descendant IDs of a folder
   */
  const getDescendantIds = useCallback(
    (folderId: string, items: Record<string, T>): string[] => {
      const descendants: string[] = [];
      const folder = items[folderId];

      if (!folder || !isFolder(folder)) return descendants;

      const collectDescendants = (parentFolder: TreeFolderItem) => {
        parentFolder.children?.forEach(childId => {
          descendants.push(childId);
          const child = items[childId];
          if (child && isFolder(child)) {
            collectDescendants(child as TreeFolderItem);
          }
        });
      };

      collectDescendants(folder as TreeFolderItem);
      return descendants;
    },
    []
  );

  /**
   * Clear all items from a folder
   */
  const clearFolder = useCallback(
    (folderId: string): void => {
      setItems(prevItems => {
        const folder = prevItems[folderId];
        if (!folder || !isFolder(folder)) {
          console.error(`Folder ${folderId} not found`);
          return prevItems;
        }

        // Get all descendants to remove
        const descendantIds = getDescendantIds(folderId, prevItems);
        
        // Remove all descendants
        const newItems = { ...prevItems };
        descendantIds.forEach(id => {
          delete newItems[id];
        });

        // Clear the folder's children
        newItems[folderId] = {
          ...folder,
          children: [],
        } as T;

        return newItems;
      });
    },
    [setItems, getDescendantIds]
  );

  /**
   * Trigger interactive rename mode for an item (requires tree instance)
   * This opens the inline rename input like pressing F2
   */
  const startRenaming = useCallback(
    (itemId: string, tree: any): void => {
      if (!tree || typeof tree.getItemInstance !== 'function') {
        console.error('Tree instance required for interactive rename');
        return;
      }
      
      const itemInstance = tree.getItemInstance(itemId);
      if (!itemInstance) {
        console.error(`Item ${itemId} not found in tree`);
        return;
      }
      
      if (typeof itemInstance.startRenaming === 'function') {
        itemInstance.startRenaming();
      } else {
        console.error('Renaming feature not enabled on tree');
      }
    },
    []
  );

  /**
   * Cancel interactive rename mode for an item (requires tree instance)
   */
  const cancelRenaming = useCallback(
    (itemId: string, tree: any): void => {
      if (!tree || typeof tree.getItemInstance !== 'function') {
        console.error('Tree instance required for cancel rename');
        return;
      }
      
      const itemInstance = tree.getItemInstance(itemId);
      if (!itemInstance) {
        console.error(`Item ${itemId} not found in tree`);
        return;
      }
      
      if (typeof itemInstance.cancelRenaming === 'function') {
        itemInstance.cancelRenaming();
      }
    },
    []
  );

  /**
   * Complete interactive rename with a new name (requires tree instance)
   */
  const completeRenaming = useCallback(
    (itemId: string, newName: string, tree: any): void => {
      if (!tree || typeof tree.getItemInstance !== 'function') {
        console.error('Tree instance required for complete rename');
        return;
      }
      
      const itemInstance = tree.getItemInstance(itemId);
      if (!itemInstance) {
        console.error(`Item ${itemId} not found in tree`);
        return;
      }
      
      if (typeof itemInstance.completeRenaming === 'function') {
        itemInstance.completeRenaming(newName);
      } else {
        // Fallback to direct rename if interactive rename not available
        renameItem(itemId, newName);
      }
    },
    [renameItem]
  );

  return {
    // Add/Remove operations
    addFile,
    addFolder,
    removeItems,
    clearFolder,
    
    // Move/Copy operations
    moveItems,
    duplicateItems,
    
    // Rename operations
    renameItem,           // Direct rename (updates state immediately)
    startRenaming,        // Start interactive rename mode (F2 style)
    cancelRenaming,       // Cancel interactive rename
    completeRenaming,     // Complete interactive rename with value
    
    // Utility
    getDescendantIds,
  };
}