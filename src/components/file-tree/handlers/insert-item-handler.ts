import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Creates a function to insert new items from DataTransfer
 */
export function createInsertNewItem(data: Record<string, TreeItemType>) {
  let newItemId = 0;
  
  return (dataTransfer: DataTransfer) => {
    const newId = `new-${Date.now()}-${newItemId++}`;
    const itemName = dataTransfer.getData('text/plain') || 'New Item';
    const itemType = dataTransfer.getData('item-type') || 'file';

    if (itemType === 'folder') {
      data[newId] = {
        id: newId,
        name: itemName,
        type: 'folder',
        path: '/' + itemName,
        depth: 1,
        children: [],
      } as TreeItemType;
    } else {
      // Get file metadata if available
      const fileSize = parseInt(dataTransfer.getData('file-size') || '0');
      const fileType = dataTransfer.getData('file-type') || 'text/plain';

      data[newId] = {
        id: newId,
        name: itemName,
        type: 'file',
        mimeType: fileType,
        fileSize: fileSize,
        extension: itemName.includes('.') ? itemName.split('.').pop() : null,
      } as TreeItemType;
    }

    return newId;
  };
}