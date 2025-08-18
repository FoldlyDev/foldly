import type { TreeItem as TreeItemType, TreeFileItem, TreeFolderItem } from '../types/tree-types';

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
      const newFolder: TreeFolderItem = {
        id: newId,
        name: itemName,
        type: 'folder',
        path: '/' + itemName,
        depth: 1,
        fileCount: 0,
        totalSize: 0,
        isArchived: false,
        sortOrder: 0,
        children: [],
        parentId: null, // Will be set by the drop target
      };
      data[newId] = newFolder;
    } else {
      // Get file metadata if available
      const fileSize = parseInt(dataTransfer.getData('file-size') || '0');
      const fileType = dataTransfer.getData('file-type') || 'text/plain';
      const extension = itemName.includes('.') ? itemName.split('.').pop() || null : null;

      const newFile: TreeFileItem = {
        id: newId,
        name: itemName,
        type: 'file',
        mimeType: fileType,
        fileSize: fileSize,
        extension: extension,
        thumbnailPath: null,
        processingStatus: 'pending',
        parentId: null, // Will be set by the drop target
      };
      data[newId] = newFile;
    }

    return newId;
  };
}