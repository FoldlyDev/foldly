# File Tree Component

A reusable, feature-rich tree component built on [@headless-tree/react](https://headless-tree.lukasbach.com) for displaying hierarchical file and folder structures.

## Quick Start

```tsx
import FileTree from '@/components/file-tree/core/tree';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';

// Transform your data
const treeData = transformToTreeStructure(folders, files, rootItem);

// Render with callbacks for database persistence
<FileTree
  rootId="root-id"
  treeId="unique-tree-id"
  initialData={treeData}
  dropCallbacks={dropCallbacks}     // Handle drag & drop
  renameCallback={renameCallback}   // Handle rename
  contextMenuProvider={menuProvider} // Provide context menu items
/>
```

## Core Features

### 1. Drag & Drop with Database Persistence

```tsx
const dropCallbacks = {
  onReorder: async (parentId, itemIds, newOrder) => {
    // Called when items are reordered within same parent
    await updateItemOrderAction(parentId, newOrder);
  },
  onMove: async (itemIds, fromParentId, toParentId) => {
    // Called when items are moved to different parent
    await moveItemAction(itemIds, toParentId);
  }
};
```

The tree automatically detects:
- **REORDER**: Dragging items within the same parent
- **MOVE**: Dragging items to a different parent

### 2. Inline Rename

```tsx
const renameCallback = async (itemId, newName, itemType) => {
  // Persist rename to database
  if (itemType === 'folder') {
    await renameFolderAction(itemId, newName);
  } else {
    await renameFileAction(itemId, newName);
  }
};
```

### 3. Context Menu

```tsx
const contextMenuProvider = (item, itemInstance) => {
  return [
    {
      label: 'Rename',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: () => itemInstance.startRenaming()
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      onClick: async () => deleteItem(item.id)
    },
    { separator: true },
    // Add more items based on item type...
  ];
};
```

Context menu features:
- Auto-selects item on right-click
- Shows selection indicator at top
- Works on desktop (right-click) and mobile (long-press)

### 4. External Drag & Drop

```tsx
// Drag external elements into the tree
<div draggable onDragStart={e => {
  e.dataTransfer.setData('text/plain', 'Item Name');
  e.dataTransfer.setData('item-type', 'folder');
}}>
  Drag me into the tree
</div>
```

### 5. Programmatic Control

```tsx
// Access tree instance via onTreeReady
onTreeReady={(tree) => {
  tree.setSelectedItems(['item-id']);       // Select items
  tree.expandAll();                          // Expand all folders
  tree.collapseAll();                        // Collapse all folders
  tree.getItemInstance(id).startRenaming();  // Start rename
  tree.openSearch();                         // Open search (Ctrl+F)
}}
```

## Data Structure

```typescript
// Transform database records to tree structure
const treeData = transformToTreeStructure(
  folders,  // Array of folder records
  files,    // Array of file records
  rootItem  // Optional root item (e.g., workspace)
);

// Tree item structure
interface TreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  sortOrder?: number;  // For ordering items
}
```

Items are automatically sorted by:
1. Type (folders first)
2. sortOrder (if present)
3. Name (alphabetical)

## Architecture

```
file-tree/
├── core/
│   └── tree.tsx                  # Main component
├── sub-components/
│   ├── tree-item-renderer.tsx    # Item display
│   └── context-menu-wrapper.tsx  # Context menu
├── handlers/
│   ├── drop-handler.ts          # Drag & drop operations
│   └── rename-handler.ts        # Rename operations
├── utils/
│   ├── transform.ts             # Data transformation
│   └── tree-data.ts             # Data management
└── types/
    └── tree-types.ts            # TypeScript types
```

## Key Implementation Details

- **Data Sync**: Uses mutable data object with `syncDataLoaderFeature` for automatic re-renders
- **Operation Detection**: Tracks drag operations in two phases to distinguish move vs reorder
- **Database Persistence**: All operations use callbacks for database updates with optimistic UI
- **Error Handling**: Operations rollback on failure to maintain consistency
- **Mobile Support**: Full touch support including long-press for context menu

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rootId` | `string` | ✓ | Root item ID |
| `treeId` | `string` | ✓ | Unique tree instance ID |
| `initialData` | `Record<string, TreeItem>` | ✓ | Tree data |
| `dropCallbacks` | `DropOperationCallbacks` | | Drag & drop handlers |
| `renameCallback` | `RenameOperationCallback` | | Rename handler |
| `contextMenuProvider` | `ContextMenuProvider` | | Context menu items |
| `onTreeReady` | `(tree) => void` | | Tree instance callback |
| `showCheckboxes` | `boolean` | | Show selection checkboxes |

## Example Integration

See `src/features/workspace/components/views/workspace-container.tsx` for a complete implementation with all features.