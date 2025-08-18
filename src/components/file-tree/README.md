# File Tree Component

A data-driven file tree implementation using [@headless-tree/react](https://headless-tree.lukasbach.com).

## How It Works

### Data Synchronization
- Tree data is stored in a **mutable object** outside the component (following the headless-tree example pattern)
- The `syncDataLoaderFeature` watches this data object and triggers re-renders automatically when it changes
- No React state management needed - just mutate the data directly and the tree updates

### Internal Drag & Drop (Moving Items)
- **Reordering**: Drag items up/down within the same parent to reorder
- **Moving**: Drag items between folders to change their parent
- Handled by `onDrop` handler which updates the parent's children array
- Works automatically with `dragAndDropFeature` and `canReorder: true`

### External Interactions

#### 1. Drag & Drop (Foreign Drop)
```javascript
// Drag external elements into the tree
<div draggable onDragStart={e => {
  e.dataTransfer.setData('text/plain', 'Item Name');
  e.dataTransfer.setData('item-type', 'folder'); // or 'file'
}}>
```
- `onDropForeignDragObject` handler creates the item and uses `insertItemsAtTarget` to add it

#### 2. Programmatic Addition
```javascript
// Add items programmatically
import { addTreeItem } from '@/components/file-tree/core/tree';

addTreeItem(treeInstance, parentId, {
  id: 'unique-id',
  name: 'New Folder',
  type: 'folder',
  children: [],
  // ... other properties
});
```
- Uses the same `insertItemsAtTarget` function internally for consistency

#### 3. Tree Methods
```javascript
// Access tree instance methods
tree.openSearch();                              // Open search
tree.getItemInstance(id).startRenaming();      // Start renaming
tree.getState();                                // Get tree state (selected, expanded items, etc.)
```

## Key Components

- **tree.tsx** - Main component with data loader pattern, handles drag/drop and programmatic operations
- **tree.css** - Custom styling with arrow indicators and minimal padding
- **tree-data.ts** - Creates data loader utilities for the tree
- **transform.ts** - Transforms database records to tree structure
- **tree-orchestrator.tsx** - Optional UI wrapper components (not currently used)

## Important Notes

- Data mutations trigger automatic re-renders via `syncDataLoader`
- Both drag-drop and programmatic adds use `insertItemsAtTarget` for consistency
- The tree instance exposes methods for external control (search, rename, etc.)
- Folders are identified by either having a `children` property or `type: 'folder'`
- Empty folders can be drop targets (no children required)
- CSS provides white arrow indicators that rotate on expand/collapse
- Search functionality integrated with `searchFeature` (Ctrl+F to open)