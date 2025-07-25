# API Reference: React Query Workspace Tree

## Table of Contents

1. [Components](#components)
2. [Hooks](#hooks)
3. [Server Actions](#server-actions)
4. [Types](#types)
5. [Utilities](#utilities)
6. [Query Keys](#query-keys)
7. [Mutations](#mutations)
8. [Error Handling](#error-handling)

## Components

### `WorkspaceTree`

Main component that renders the workspace tree with real database data.

```typescript
function WorkspaceTree(): JSX.Element;
```

#### Features

- ✅ Real-time data fetching with React Query
- ✅ Loading, error, and empty states
- ✅ Drag and drop with database persistence
- ✅ Optimistic updates with error recovery
- ✅ Internal notifications integration

#### States

- **Loading**: Shows spinner and "Loading workspace..." message
- **Error**: Displays error message with retry option
- **Empty**: Shows "No files or folders found" message
- **Loaded**: Renders the interactive tree component

#### Example

```typescript
import { WorkspaceTree } from '@/features/workspace/components/tree/WorkspaceTree';

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <WorkspaceTree />
      </aside>
    </div>
  );
}
```

### `TreeOperationOverlay`

Advanced loading overlay component that replaces the tree interface during operations.

```typescript
function TreeOperationOverlay({
  operationState: OperationState;
  onCancel: () => void;
}): JSX.Element;
```

#### Props

- `operationState` (required): Current operation state with progress and status information
- `onCancel` (required): Callback to cancel the current operation

#### Features

- **Complete UI Replacement**: Overlays the entire tree during operations
- **Real-time Progress**: Animated progress bars with percentages
- **Status-specific Design**: Different icons and colors for each operation stage
- **Current Item Display**: Shows what item is currently being processed
- **Error Handling**: Recovery options and error messages
- **User Interaction Control**: Prevents clicks during operations

#### States

- **Analyzing**: Calculating total operations and nested content
- **Processing**: Executing the actual operations with progress
- **Completing**: Finalizing and cleanup operations
- **Success**: Operation completed successfully
- **Error**: Operation failed with recovery options

#### Example

```typescript
import { TreeOperationOverlay } from '@/features/workspace/components/loading/tree-operation-overlay';
import { useTreeOperationStatus } from '@/features/workspace/hooks/use-tree-operation-status';

function WorkspaceTree() {
  const {
    operationState,
    startOperation,
    resetOperation,
    isOperationInProgress
  } = useTreeOperationStatus();

  const handleBatchMove = async (items, target) => {
    startOperation('batch_move', items.length, 'Preparing move operation...');
    // ... operation logic
  };

  return (
    <div className="workspace-tree">
      {/* Regular tree content */}
      <TreeContent />

      {/* Operation overlay - shows when operations are running */}
      <TreeOperationOverlay
        operationState={operationState}
        onCancel={resetOperation}
      />
    </div>
  );
}
```

### `TreeContent`

Internal component that renders the tree when data is available.

```typescript
function TreeContent({
  workspaceData,
}: {
  workspaceData: WorkspaceTreeData;
}): JSX.Element;
```

#### Props

- `workspaceData` (required): Workspace data containing folders, files, and workspace info

#### Internal Features

- Data transformation from database to tree format
- Optimistic updates for drag and drop
- Mutation handling for database operations
- Real-time synchronization

## Hooks

### `useWorkspaceTree`

Primary hook for fetching workspace tree data with React Query.

```typescript
function useWorkspaceTree(): UseQueryResult<WorkspaceTreeData>;
```

#### Returns

```typescript
{
  data: WorkspaceTreeData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult>;
  isError: boolean;
  isSuccess: boolean;
  status: 'pending' | 'error' | 'success';
}
```

#### Configuration

- **Stale Time**: 5 minutes
- **GC Time**: 10 minutes
- **Retry**: Up to 3 times with exponential backoff
- **Refetch**: On window focus and reconnect

#### Example

```typescript
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';

function WorkspaceComponent() {
  const { data, isLoading, error } = useWorkspaceTree();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <TreeView data={data} />;
}
```

### `useWorkspaceRealtime`

Hook for setting up real-time subscriptions to workspace changes.

```typescript
function useWorkspaceRealtime(): void;
```

#### Features

- Listens to database changes on files and folders tables
- Automatically invalidates React Query cache
- Handles subscription cleanup on unmount

#### Example

```typescript
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';

function WorkspaceProvider({ children }) {
  useWorkspaceRealtime(); // Set up real-time updates
  return <div>{children}</div>;
}
```

### `useTreeOperationStatus`

Hook for managing complex operation states with loading overlays and progress tracking.

```typescript
function useTreeOperationStatus(): {
  operationState: OperationState;
  startOperation: (type: string, totalItems: number, message: string) => void;
  updateProgress: (current: number, message?: string) => void;
  setCompleting: (message: string) => void;
  completeOperation: () => void;
  failOperation: (error: string) => void;
  resetOperation: () => void;
  isOperationInProgress: boolean;
  canInteract: boolean;
};
```

#### Features

- Manages operation lifecycle from start to completion
- Provides progress tracking with current/total counts
- Controls user interaction during operations
- Handles error states with recovery options

#### Example

```typescript
import { useTreeOperationStatus } from '@/features/workspace/hooks/use-tree-operation-status';

function WorkspaceComponent() {
  const {
    operationState,
    startOperation,
    updateProgress,
    completeOperation,
    isOperationInProgress,
    canInteract,
  } = useTreeOperationStatus();

  const handleBatchDelete = async (items) => {
    startOperation('batch_delete', items.length, 'Preparing to delete...');

    for (let i = 0; i < items.length; i++) {
      await deleteItem(items[i]);
      updateProgress(i + 1, `Deleting ${items[i].name}...`);
    }

    completeOperation();
  };

  return (
    <div>
      {isOperationInProgress && <OperationOverlay state={operationState} />}
      <button disabled={!canInteract} onClick={handleBatchDelete}>
        Delete Items
      </button>
    </div>
  );
}
```

### `useTreeSelectionMode`

Hook for managing multi-selection mode with checkbox interface.

```typescript
function useTreeSelectionMode(): {
  isSelectMode: boolean;
  selectedItems: string[];
  selectedItemsCount: number;
  toggleSelectMode: () => void;
  enableSelectMode: () => void;
  disableSelectMode: () => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  isItemSelected: (itemId: string) => boolean;
};
```

#### Features

- Toggle between normal and selection modes
- Track multiple selected items
- Provide selection utilities and state management
- Integrate with batch operations

#### Example

```typescript
import { useTreeSelectionMode } from '@/features/workspace/hooks/use-tree-selection-mode';

function WorkspaceTree() {
  const selectMode = useTreeSelectionMode();

  return (
    <div>
      <button onClick={selectMode.toggleSelectMode}>
        {selectMode.isSelectMode ? 'Cancel' : 'Select Multiple'}
      </button>

      {selectMode.selectedItemsCount > 0 && (
        <div>
          {selectMode.selectedItemsCount} items selected
          <button onClick={selectMode.clearSelection}>Clear</button>
        </div>
      )}

      <TreeContent selectMode={selectMode} />
    </div>
  );
}
```

## Server Actions

### `getWorkspaceTreeAction`

Fetches complete workspace tree data from the database.

```typescript
async function getWorkspaceTreeAction(): Promise<
  ActionResult<WorkspaceTreeData>
>;
```

#### Returns

```typescript
{
  success: boolean;
  data?: {
    workspace: { id: string; name: string };
    folders: FolderData[];
    files: FileData[];
  };
  error?: string;
}
```

#### Security

- Requires authenticated user
- Filters data by user ownership
- Includes proper error handling

#### Example

```typescript
const result = await getWorkspaceTreeAction();

if (result.success) {
  console.log('Workspace:', result.data.workspace);
  console.log('Folders:', result.data.folders);
  console.log('Files:', result.data.files);
} else {
  console.error('Error:', result.error);
}
```

### `updateItemOrderAction`

Updates the display order of items within the same parent.

```typescript
async function updateItemOrderAction(
  parentId: string,
  newChildrenIds: string[]
): Promise<ActionResult<null>>;
```

#### Parameters

- `parentId`: The parent container ID
- `newChildrenIds`: Array of child IDs in new order

#### Returns

```typescript
{
  success: boolean;
  data?: null;
  error?: string;
}
```

#### Database Operations

- Updates `displayOrder` field for all affected items
- Handles both files and folders
- Maintains referential integrity

#### Example

```typescript
const result = await updateItemOrderAction('folder-123', [
  'file-1',
  'file-2',
  'folder-456',
]);

if (result.success) {
  console.log('Order updated successfully');
} else {
  console.error('Failed to update order:', result.error);
}
```

### `moveItemAction`

Moves an item to a different parent container.

```typescript
async function moveItemAction(
  nodeId: string,
  targetId: string
): Promise<ActionResult<any>>;
```

#### Parameters

- `nodeId`: ID of the item to move
- `targetId`: ID of the destination parent ('root' for workspace root)

#### Returns

```typescript
{
  success: boolean;
  data?: FolderData | FileData;
  error?: string;
}
```

#### Database Operations

- Updates `parentId` field for the moved item
- Handles both files and folders
- Supports moving to workspace root

#### Example

```typescript
const result = await moveItemAction('file-123', 'folder-456');

if (result.success) {
  console.log('Item moved successfully:', result.data);
} else {
  console.error('Failed to move item:', result.error);
}
```

### `enhancedBatchMoveItemsAction`

Enhanced batch move operation with progress tracking and nested content handling.

```typescript
async function enhancedBatchMoveItemsAction(
  nodeIds: string[],
  targetId: string,
  progressCallback?: (progress: ProgressInfo) => void
): Promise<ActionResult<any>>;
```

#### Parameters

- `nodeIds`: Array of item IDs to move
- `targetId`: Destination parent ID ('root' for workspace root)
- `progressCallback`: Optional callback for progress updates

#### Features

- Handles nested folder content automatically
- Provides real-time progress updates
- Calculates accurate total operation count
- Reports detailed operation stages

#### Example

```typescript
const result = await enhancedBatchMoveItemsAction(
  ['folder-1', 'file-2', 'file-3'],
  'folder-target',
  progress => {
    console.log(
      `Progress: ${progress.current}/${progress.total} - ${progress.message}`
    );
  }
);
```

### `enhancedBatchDeleteItemsAction`

Enhanced batch delete operation with recursive nested content handling.

```typescript
async function enhancedBatchDeleteItemsAction(
  nodeIds: string[],
  progressCallback?: (progress: ProgressInfo) => void
): Promise<ActionResult<any>>;
```

#### Parameters

- `nodeIds`: Array of item IDs to delete
- `progressCallback`: Optional callback for progress updates

#### Features

- Recursively deletes all nested content
- Prevents orphaned files and folders
- Provides progress tracking for large operations
- Handles mixed file/folder selections

#### Example

```typescript
const result = await enhancedBatchDeleteItemsAction(
  ['folder-with-nested-content', 'standalone-file'],
  progress => {
    updateUI(
      `Deleting ${progress.current}/${progress.total}: ${progress.message}`
    );
  }
);
```

## Types

### `WorkspaceTreeData`

Main data structure returned by the workspace tree API.

```typescript
interface WorkspaceTreeData {
  workspace: {
    id: string;
    name: string;
  };
  folders: FolderData[];
  files: FileData[];
}
```

### `FolderData`

Database representation of a folder.

```typescript
interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### `FileData`

Database representation of a file.

```typescript
interface FileData {
  id: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  size: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `TreeItem`

Tree structure used by the headless-tree component.

```typescript
interface TreeItem {
  name: string;
  children?: string[];
  isFile?: boolean;
}
```

### `ActionResult<T>`

Standard result type for server actions.

```typescript
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Utilities

### `createWorkspaceTreeData`

Converts database data into tree structure compatible with headless-tree.

```typescript
function createWorkspaceTreeData(
  folders: FolderData[],
  files: FileData[],
  workspaceName: string
): Record<string, TreeItem>;
```

#### Parameters

- `folders`: Array of folder data from database
- `files`: Array of file data from database
- `workspaceName`: Name of the workspace for virtual root

#### Returns

Record where keys are item IDs and values are TreeItem objects

#### Features

- Creates virtual root with `VIRTUAL_ROOT_ID`
- Builds parent-child relationships
- Adds `isFile` property for type differentiation
- Handles orphaned items gracefully

#### Example

```typescript
const folders = [
  { id: 'folder1', name: 'Documents', parentId: null },
  { id: 'folder2', name: 'Images', parentId: 'folder1' },
];

const files = [
  { id: 'file1', name: 'readme.txt', parentId: 'folder1' },
  { id: 'file2', name: 'photo.jpg', parentId: 'folder2' },
];

const treeData = createWorkspaceTreeData(folders, files, 'My Workspace');

// Result:
// {
//   'virtual-root': { name: 'My Workspace', children: ['folder1'] },
//   'folder1': { name: 'Documents', children: ['folder2', 'file1'] },
//   'folder2': { name: 'Images', children: ['file2'] },
//   'file1': { name: 'readme.txt', children: [], isFile: true },
//   'file2': { name: 'photo.jpg', children: [], isFile: true }
// }
```

### `VIRTUAL_ROOT_ID`

Constant representing the virtual root of the workspace tree.

```typescript
const VIRTUAL_ROOT_ID = 'virtual-root';
```

#### Usage

- Used as root item ID in tree initialization
- Converted to 'root' when communicating with server actions
- Provides consistent workspace root identification

## Query Keys

### `workspaceQueryKeys`

Centralized query key factory for consistent cache management.

```typescript
export const workspaceQueryKeys = {
  all: () => ['workspace'],
  tree: () => [...workspaceQueryKeys.all(), 'tree'],
  files: () => [...workspaceQueryKeys.all(), 'files'],
  folders: () => [...workspaceQueryKeys.all(), 'folders'],
  realtime: () => [...workspaceQueryKeys.all(), 'realtime'],
};
```

#### Usage

```typescript
// Query for tree data
const { data } = useQuery({
  queryKey: workspaceQueryKeys.tree(),
  queryFn: fetchTreeData,
});

// Invalidate tree cache
queryClient.invalidateQueries({
  queryKey: workspaceQueryKeys.tree(),
});

// Invalidate all workspace data
queryClient.invalidateQueries({
  queryKey: workspaceQueryKeys.all(),
});
```

## Mutations

### Update Order Mutation

Mutation for reordering items within the same parent.

```typescript
const updateOrderMutation = useMutation({
  mutationFn: async ({ parentId, newChildrenIds }) => {
    const result = await updateItemOrderAction(parentId, newChildrenIds);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update item order');
    }
    return result.data;
  },
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    showWorkspaceNotification('items_reordered', {
      itemName: 'Items',
      itemType: 'folder',
      targetLocation: items[variables.parentId]?.name || 'workspace',
    });
  },
  onError: (error, variables) => {
    setItems(treeData); // Rollback optimistic update
    showWorkspaceError(
      'items_reordered',
      {
        itemName: 'Items',
        itemType: 'folder',
        targetLocation: items[variables.parentId]?.name || 'workspace',
      },
      error.message
    );
  },
});
```

#### Usage

```typescript
updateOrderMutation.mutate({
  parentId: 'folder-123',
  newChildrenIds: ['file-1', 'file-2', 'folder-456'],
});
```

### Move Item Mutation

Mutation for moving items to different parents.

```typescript
const moveItemMutation = useMutation({
  mutationFn: async ({ nodeId, targetId }) => {
    const result = await moveItemAction(
      nodeId,
      targetId === VIRTUAL_ROOT_ID ? 'root' : targetId
    );
    if (!result.success) {
      throw new Error(result.error || 'Failed to move item');
    }
    return result.data;
  },
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    const movedItem = items[variables.nodeId];
    const targetItem = items[variables.targetId];
    const isFile = movedItem?.isFile;

    showWorkspaceNotification(isFile ? 'file_moved' : 'folder_moved', {
      itemName: movedItem?.name || 'Item',
      itemType: isFile ? 'file' : 'folder',
      targetLocation: targetItem?.name || 'workspace root',
    });
  },
  onError: (error, variables) => {
    setItems(treeData); // Rollback optimistic update
    const movedItem = items[variables.nodeId];
    const isFile = movedItem?.isFile;

    showWorkspaceError(
      isFile ? 'file_moved' : 'folder_moved',
      {
        itemName: movedItem?.name || 'Item',
        itemType: isFile ? 'file' : 'folder',
      },
      error.message
    );
  },
});
```

#### Usage

```typescript
moveItemMutation.mutate({
  nodeId: 'file-123',
  targetId: 'folder-456',
});
```

## Error Handling

### Error Types

Common error scenarios and their handling:

#### Authentication Errors

```typescript
{
  success: false,
  error: 'User not authenticated'
}
```

#### Database Errors

```typescript
{
  success: false,
  error: 'Failed to fetch workspace tree'
}
```

#### Validation Errors

```typescript
{
  success: false,
  error: 'Invalid item ID provided'
}
```

### Error Recovery

#### Optimistic Update Rollback

```typescript
onError: (error, variables) => {
  // Revert to previous state
  setItems(treeData);

  // Show error notification
  showWorkspaceError(
    'operation_failed',
    {
      itemName: variables.itemName,
      itemType: variables.itemType,
    },
    error.message
  );
};
```

#### Retry Logic

```typescript
const { data, error, refetch } = useWorkspaceTree();

if (error) {
  return (
    <div className="error-state">
      <p>Failed to load workspace: {error.message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

### Error Monitoring

#### Client-side Logging

```typescript
onError: (error, variables) => {
  console.error('Workspace operation failed:', {
    error: error.message,
    operation: 'move_item',
    variables,
    timestamp: new Date().toISOString(),
  });

  // Report to monitoring service
  reportError(error, {
    context: 'workspace-tree',
    operation: 'move_item',
    variables,
  });
};
```

## Performance Considerations

### Caching Strategy

- **Stale Time**: 5 minutes to reduce unnecessary refetches
- **GC Time**: 10 minutes to keep data in memory
- **Invalidation**: Selective invalidation based on operation type

### Optimistic Updates

- Immediate UI feedback for better UX
- Automatic rollback on errors
- Conflict resolution for concurrent operations

### Memory Management

- Proper cleanup of subscriptions
- Efficient data transformations
- Memoization of expensive operations

---

_API Reference Version: 1.0.0_  
_Last Updated: January 2025_  
_Status: Production Ready_
