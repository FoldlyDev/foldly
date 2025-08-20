import type { DragTarget, ItemInstance } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem as TreeItemType, TreeFolderItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';
import { eventBus } from '@/features/notifications/core';

/**
 * Recursively reads all files from a directory entry
 */
async function readDirectoryRecursively(
  directoryEntry: any,
  path: string = ''
): Promise<{ file: File; path: string }[]> {
  return new Promise((resolve) => {
    const dirReader = directoryEntry.createReader();
    const entries: any[] = [];
    
    const readEntries = () => {
      dirReader.readEntries((results: any[]) => {
        if (!results.length) {
          // All entries have been read
          Promise.all(
            entries.map(async (entry) => {
              if (entry.isFile) {
                return new Promise<{ file: File; path: string }>((resolveFile) => {
                  entry.file((file: File) => {
                    // Create a new File with the full path as the name
                    const fullPath = path ? `${path}/${file.name}` : file.name;
                    const fileWithPath = new File([file], fullPath, { type: file.type });
                    resolveFile({ file: fileWithPath, path: fullPath });
                  });
                });
              } else if (entry.isDirectory) {
                const subPath = path ? `${path}/${entry.name}` : entry.name;
                return readDirectoryRecursively(entry, subPath);
              }
              return [];
            })
          ).then((results) => {
            const allFiles = results.flat();
            resolve(allFiles);
          });
        } else {
          // Continue reading
          entries.push(...results);
          readEntries();
        }
      });
    };
    
    readEntries();
  });
}

/**
 * Creates handlers for foreign drag and drop operations
 */
export function createForeignDropHandlers(
  data: Record<string, TreeItemType>,
  insertNewItem: (dataTransfer: DataTransfer) => string,
  onExternalFileDrop?: (files: File[], targetFolderId: string | null, folderStructure?: { [folder: string]: File[] }) => void
) {
  const onDropForeignDragObject = async (
    dataTransfer: DataTransfer,
    target: DragTarget<TreeItemType>
  ) => {
    // Check if this is a file/folder drop from outside
    const items = Array.from(dataTransfer.items);
    
    if (items.length > 0 && items.some(item => item.kind === 'file')) {
      // This is a file drop from outside the application
      // DragTarget can be either just {item} or {item, childIndex, insertionIndex, etc}
      // If it has childIndex, it's a reorder operation (drop between items)
      // Otherwise it's a drop on the item itself
      const isReorderTarget = 'childIndex' in target;
      const targetFolderId = !isReorderTarget ? target.item.getId() : 
                            target.item.getParent()?.getId() || null;
      
      // Process all dropped items
      const allFiles: File[] = [];
      const folderStructure: { [folder: string]: File[] } = {};
      
      await Promise.all(
        items.map(async (item) => {
          if (item.kind === 'file') {
            const entry = (item as any).webkitGetAsEntry?.();
            
            if (entry) {
              if (entry.isDirectory) {
                // Read all files from the directory recursively
                try {
                  const filesInFolder = await readDirectoryRecursively(entry);
                  
                  // Group files by their folder path
                  filesInFolder.forEach(({ file, path }) => {
                    const folderPath = path.substring(0, path.lastIndexOf('/'));
                    if (!folderStructure[folderPath]) {
                      folderStructure[folderPath] = [];
                    }
                    folderStructure[folderPath].push(file);
                    allFiles.push(file);
                  });
                } catch (error) {
                  console.error('Error reading directory:', error);
                  eventBus.emit('workspace:folder-drop-info', {
                    folderNames: [entry.name],
                    message: `Error reading folder "${entry.name}". Please try selecting files directly.`,
                  });
                }
              } else if (entry.isFile) {
                // Regular file
                return new Promise<void>((resolve) => {
                  entry.file((file: File) => {
                    allFiles.push(file);
                    resolve();
                  });
                });
              }
            } else {
              // Fallback for browsers that don't support webkitGetAsEntry
              const file = item.getAsFile();
              if (file) {
                allFiles.push(file);
              }
            }
          }
        })
      );
      
      // Trigger file upload if handler is provided
      if (allFiles.length > 0 && onExternalFileDrop) {
        onExternalFileDrop(allFiles, targetFolderId, Object.keys(folderStructure).length > 0 ? folderStructure : undefined);
        
        // Show info about folder structure if detected
        if (Object.keys(folderStructure).length > 0) {
          const folderCount = new Set(Object.keys(folderStructure).map(p => p.split('/')[0])).size;
          const fileCount = allFiles.length;
          eventBus.emit('workspace:folder-drop-info', {
            message: `Uploading ${fileCount} file${fileCount !== 1 ? 's' : ''} from ${folderCount} folder${folderCount !== 1 ? 's' : ''}. Folder structure will be preserved.`,
          });
        }
      }
      
      return;
    }
    
    // Original behavior for internal drag operations
    const newId = insertNewItem(dataTransfer);
    insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
      const itemData = data[item.getId()];
      if (itemData && isFolder(itemData)) {
        const folderItem = itemData as TreeFolderItem;
        folderItem.children = newChildrenIds;
      }
    });
  };

  const onCompleteForeignDrop = (items: ItemInstance<TreeItemType>[]) =>
    removeItemsFromParents(items, (item, newChildren) => {
      const itemData = item.getItemData();
      if (isFolder(itemData)) {
        const folderItem = itemData as TreeFolderItem;
        folderItem.children = newChildren;
      }
    });

  return { onDropForeignDragObject, onCompleteForeignDrop };
}