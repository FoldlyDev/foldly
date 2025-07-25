# Migration Guide: From Mock Data to React Query

## Overview

This guide helps you migrate from the previous hardcoded mock data implementation to the new React Query-based system that fetches real database data. The migration maintains all existing functionality while adding database persistence, real-time updates, and improved error handling.

## Table of Contents

1. [Before vs After](#before-vs-after)
2. [Breaking Changes](#breaking-changes)
3. [Migration Steps](#migration-steps)
4. [Code Examples](#code-examples)
5. [Testing Migration](#testing-migration)
6. [Rollback Plan](#rollback-plan)
7. [Performance Considerations](#performance-considerations)

## Before vs After

### Previous Implementation

```typescript
// ❌ Old: Hardcoded mock data
const mockWorkspaceData = {
  'virtual-root': {
    name: 'Workspace',
    children: ['folder1', 'folder2'],
  },
  'folder1': {
    name: 'Documents',
    children: ['file1'],
  },
  'file1': {
    name: 'readme.txt',
    children: [],
    isFile: true,
  },
};

function WorkspaceTree() {
  const [items, setItems] = useState(mockWorkspaceData);
  const tree = useTree({
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children || [],
    },
  });

  return <TreeComponent />;
}
```

### New Implementation

```typescript
// ✅ New: Real database data with React Query
function WorkspaceTree() {
  const { data: workspaceData, isLoading, error } = useWorkspaceTree();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!workspaceData) return <EmptyState />;

  return <TreeContent workspaceData={workspaceData} />;
}

function TreeContent({ workspaceData }) {
  const treeData = useMemo(() => {
    return createWorkspaceTreeData(
      workspaceData.folders,
      workspaceData.files,
      workspaceData.workspace.name
    );
  }, [workspaceData]);

  const [items, setItems] = useState(treeData);
  const tree = useTree({
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children || [],
    },
  });

  return <TreeComponent />;
}
```

## Breaking Changes

### 1. Component Structure

- **Before**: Single component with hardcoded data
- **After**: Split into `WorkspaceTree` (data fetching) and `TreeContent` (rendering)

### 2. Data Source

- **Before**: Static mock data in JavaScript objects
- **After**: Dynamic data from database via React Query

### 3. State Management

- **Before**: Local state only
- **After**: React Query cache + local state for optimistic updates

### 4. Error Handling

- **Before**: No error handling
- **After**: Comprehensive error handling with user feedback

### 5. Loading States

- **Before**: No loading states
- **After**: Loading, error, and empty states

## Migration Steps

### Step 1: Install Dependencies

Ensure you have the required packages:

```bash
npm install @tanstack/react-query
# or
yarn add @tanstack/react-query
```

### Step 2: Set Up React Query Provider

If not already done, wrap your app with QueryClientProvider:

```typescript
// src/app/layout.tsx or src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Step 3: Create Server Actions

Create server actions for database operations:

```typescript
// src/features/workspace/lib/actions/tree-actions.ts
'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function getWorkspaceTreeAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const workspace = await db.workspace.findFirst({
      where: { userId: user.id },
      include: {
        folders: { orderBy: { displayOrder: 'asc' } },
        files: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    return {
      success: true,
      data: {
        workspace: { id: workspace.id, name: workspace.name },
        folders: workspace.folders,
        files: workspace.files,
      },
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch workspace tree' };
  }
}

export async function updateItemOrderAction(parentId, newChildrenIds) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const updatePromises = newChildrenIds.map((childId, index) => {
      return db.file
        .update({
          where: { id: childId },
          data: { displayOrder: index },
        })
        .catch(() =>
          db.folder.update({
            where: { id: childId },
            data: { displayOrder: index },
          })
        );
    });

    await Promise.all(updatePromises);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: 'Failed to update item order' };
  }
}

export async function moveItemAction(nodeId, targetId) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const actualParentId = targetId === 'root' ? null : targetId;

    const result = await db.file
      .update({
        where: { id: nodeId },
        data: { parentId: actualParentId },
      })
      .catch(() =>
        db.folder.update({
          where: { id: nodeId },
          data: { parentId: actualParentId },
        })
      );

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to move item' };
  }
}
```

### Step 4: Create React Query Hook

Create the hook to fetch workspace data:

```typescript
// src/features/workspace/hooks/use-workspace-tree.ts
import { useQuery } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { getWorkspaceTreeAction } from '../lib/actions';

export function useWorkspaceTree() {
  return useQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      const result = await getWorkspaceTreeAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
```

### Step 5: Update Data Transformation

Modify the utility to handle database data:

```typescript
// src/lib/utils/workspace-tree-utils.ts
export function createWorkspaceTreeData(folders, files, workspaceName) {
  const treeData = {};

  // Create virtual root
  treeData[VIRTUAL_ROOT_ID] = {
    name: workspaceName,
    children: [],
    isFile: false,
  };

  // Process folders
  folders.forEach(folder => {
    treeData[folder.id] = {
      name: folder.name,
      children: [],
      isFile: false,
    };

    const parentId = folder.parentId || VIRTUAL_ROOT_ID;
    if (treeData[parentId]) {
      treeData[parentId].children = treeData[parentId].children || [];
      treeData[parentId].children.push(folder.id);
    }
  });

  // Process files
  files.forEach(file => {
    treeData[file.id] = {
      name: file.name,
      children: [],
      isFile: true, // ✅ Add isFile property
    };

    const parentId = file.parentId || VIRTUAL_ROOT_ID;
    if (treeData[parentId]) {
      treeData[parentId].children = treeData[parentId].children || [];
      treeData[parentId].children.push(file.id);
    }
  });

  return treeData;
}
```

### Step 6: Update Component

Replace the old component with the new structure:

```typescript
// src/features/workspace/components/tree/WorkspaceTree.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceTree } from '../../hooks/use-workspace-tree';
import { createWorkspaceTreeData, VIRTUAL_ROOT_ID } from '@/lib/utils/workspace-tree-utils';

// ✅ New: Separate TreeContent component
function TreeContent({ workspaceData }) {
  const queryClient = useQueryClient();

  const treeData = useMemo(() => {
    return createWorkspaceTreeData(
      workspaceData.folders || [],
      workspaceData.files || [],
      workspaceData.workspace?.name || 'Workspace'
    );
  }, [workspaceData]);

  const [items, setItems] = useState(treeData);

  useEffect(() => {
    setItems(treeData);
  }, [treeData]);

  // ✅ New: Mutations for database operations
  const updateOrderMutation = useMutation({
    mutationFn: async ({ parentId, newChildrenIds }) => {
      const result = await updateItemOrderAction(parentId, newChildrenIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update item order');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    },
    onError: () => {
      setItems(treeData); // Rollback optimistic update
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    },
    onError: () => {
      setItems(treeData); // Rollback optimistic update
    },
  });

  const tree = useTree({
    initialState: {
      expandedItems: [VIRTUAL_ROOT_ID],
      selectedItems: [],
    },
    indent: 20,
    rootItemId: VIRTUAL_ROOT_ID,
    getItemName: item => item.getItemData().name,
    isItemFolder: item => {
      const itemData = item.getItemData();
      return !itemData.isFile && (itemData.children?.length ?? 0) >= 0;
    },
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      const parentId = parentItem.getId();
      const parentItemData = items[parentId];

      if (!parentItemData) return;

      // ✅ New: Optimistic update
      setItems(prevItems => ({
        ...prevItems,
        [parentId]: {
          ...parentItemData,
          children: newChildrenIds,
        },
      }));

      // ✅ New: Smart operation detection
      const originalChildren = treeData[parentId]?.children || [];
      const isReorder =
        originalChildren.length === newChildrenIds.length &&
        originalChildren.every(id => newChildrenIds.includes(id));

      if (isReorder) {
        updateOrderMutation.mutate({ parentId, newChildrenIds });
      } else {
        const movedItemId = newChildrenIds.find(
          id => !originalChildren.includes(id)
        );
        if (movedItemId) {
          moveItemMutation.mutate({ nodeId: movedItemId, targetId: parentId });
        }
      }
    }),
    dataLoader: {
      getItem: itemId => items[itemId] || { name: 'Unknown', children: [], isFile: true },
      getChildren: itemId => items[itemId]?.children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Tree rendering logic */}
    </div>
  );
}

// ✅ New: Main component with loading states
export default function WorkspaceTree() {
  const { data: workspaceData, isLoading, error } = useWorkspaceTree();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <ContentLoader className="w-6 h-6" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading workspace...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-destructive">
          Failed to load workspace: {error.message}
        </span>
      </div>
    );
  }

  if (!workspaceData || (workspaceData.folders.length === 0 && workspaceData.files.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-muted-foreground">
          No files or folders found. Create some to get started.
        </span>
      </div>
    );
  }

  return <TreeContent workspaceData={workspaceData} />;
}
```

### Step 7: Add Real-time Updates (Optional)

Set up real-time synchronization:

```typescript
// src/features/workspace/hooks/use-workspace-realtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useWorkspaceRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'files' },
        () => {
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders' },
        () => {
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
}
```

## Code Examples

### Migration Checklist

Use this checklist to ensure complete migration:

```typescript
// ✅ Migration Checklist

// 1. Dependencies installed
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 2. Server actions created
import { getWorkspaceTreeAction, updateItemOrderAction, moveItemAction } from '../lib/actions';

// 3. React Query hook created
import { useWorkspaceTree } from '../hooks/use-workspace-tree';

// 4. Data transformation updated
import { createWorkspaceTreeData } from '@/lib/utils/workspace-tree-utils';

// 5. Component structure updated
function WorkspaceTree() {
  const { data, isLoading, error } = useWorkspaceTree();
  // Loading/error states implemented
  return <TreeContent workspaceData={data} />;
}

// 6. Mutations implemented
const updateOrderMutation = useMutation({
  mutationFn: async ({ parentId, newChildrenIds }) => {
    // Server action call
  },
  onSuccess: () => {
    // Cache invalidation
  },
  onError: () => {
    // Rollback optimistic update
  },
});

// 7. Drag & drop persistence added
const onDrop = createOnDropHandler((parentItem, newChildrenIds) => {
  // Optimistic update
  setItems(/* updated items */);

  // Operation detection
  const isReorder = /* detection logic */;

  // Mutation trigger
  if (isReorder) {
    updateOrderMutation.mutate(/* params */);
  } else {
    moveItemMutation.mutate(/* params */);
  }
});

// 8. Error handling implemented
// 9. Loading states added
// 10. Real-time updates configured (optional)
```

### Before/After Comparison

```typescript
// ❌ Before: Mock data implementation
function WorkspaceTree() {
  const [items, setItems] = useState(mockData);

  const tree = useTree({
    rootItemId: VIRTUAL_ROOT_ID,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children || [],
    },
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      // Only UI update, no persistence
      setItems(prevItems => ({
        ...prevItems,
        [parentId]: { ...parentData, children: newChildrenIds },
      }));
    }),
  });

  return <TreeComponent tree={tree} />;
}

// ✅ After: React Query implementation
function WorkspaceTree() {
  const { data: workspaceData, isLoading, error } = useWorkspaceTree();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!workspaceData) return <EmptyState />;

  return <TreeContent workspaceData={workspaceData} />;
}

function TreeContent({ workspaceData }) {
  const queryClient = useQueryClient();

  const treeData = useMemo(() => {
    return createWorkspaceTreeData(
      workspaceData.folders,
      workspaceData.files,
      workspaceData.workspace.name
    );
  }, [workspaceData]);

  const [items, setItems] = useState(treeData);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ parentId, newChildrenIds }) => {
      const result = await updateItemOrderAction(parentId, newChildrenIds);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    },
    onError: () => {
      setItems(treeData); // Rollback
    },
  });

  const tree = useTree({
    rootItemId: VIRTUAL_ROOT_ID,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children || [],
    },
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      // Optimistic update
      setItems(prevItems => ({
        ...prevItems,
        [parentId]: { ...parentData, children: newChildrenIds },
      }));

      // Database persistence
      const isReorder = /* detection logic */;
      if (isReorder) {
        updateOrderMutation.mutate({ parentId, newChildrenIds });
      } else {
        moveItemMutation.mutate({ nodeId, targetId: parentId });
      }
    }),
  });

  return <TreeComponent tree={tree} />;
}
```

## Testing Migration

### Unit Tests

Update tests to handle async data:

```typescript
// ❌ Before: Synchronous mock data tests
describe('WorkspaceTree', () => {
  it('should render with mock data', () => {
    const { getByText } = render(<WorkspaceTree />);
    expect(getByText('Documents')).toBeInTheDocument();
  });
});

// ✅ After: Async data tests
describe('WorkspaceTree', () => {
  it('should render loading state initially', () => {
    const { getByText } = render(<WorkspaceTree />);
    expect(getByText('Loading workspace...')).toBeInTheDocument();
  });

  it('should render tree when data is loaded', async () => {
    // Mock successful data fetch
    mockUseWorkspaceTree.mockReturnValue({
      data: mockWorkspaceData,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<WorkspaceTree />);
    await waitFor(() => {
      expect(getByText('Documents')).toBeInTheDocument();
    });
  });

  it('should handle error states', async () => {
    mockUseWorkspaceTree.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    });

    const { getByText } = render(<WorkspaceTree />);
    expect(getByText(/Failed to load workspace/)).toBeInTheDocument();
  });
});
```

### Integration Tests

Test the complete flow:

```typescript
describe('WorkspaceTree Integration', () => {
  it('should persist drag and drop operations', async () => {
    // Mock server actions
    const mockUpdateOrder = jest.fn().mockResolvedValue({ success: true });

    const { getByText, getByTestId } = render(<WorkspaceTree />);

    // Wait for data to load
    await waitFor(() => {
      expect(getByText('Documents')).toBeInTheDocument();
    });

    // Simulate drag and drop
    const dragItem = getByTestId('tree-item-file1');
    const dropTarget = getByTestId('tree-item-folder2');

    await act(async () => {
      fireEvent.dragStart(dragItem);
      fireEvent.dragOver(dropTarget);
      fireEvent.drop(dropTarget);
    });

    // Verify server action was called
    expect(mockUpdateOrder).toHaveBeenCalledWith('folder2', ['file1']);
  });
});
```

## Rollback Plan

### Quick Rollback

If you need to quickly rollback to the previous implementation:

1. **Revert Component**: Replace new WorkspaceTree with old version
2. **Restore Mock Data**: Bring back hardcoded mock data
3. **Remove Dependencies**: Uninstall React Query if not used elsewhere
4. **Update Tests**: Revert test changes

### Rollback Code

```typescript
// Emergency rollback component
function WorkspaceTreeRollback() {
  const [items, setItems] = useState(mockWorkspaceData);

  const tree = useTree({
    rootItemId: VIRTUAL_ROOT_ID,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children || [],
    },
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems(prevItems => ({
        ...prevItems,
        [parentItem.getId()]: {
          ...prevItems[parentItem.getId()],
          children: newChildrenIds,
        },
      }));
    }),
  });

  return <TreeComponent tree={tree} />;
}
```

### Gradual Rollback

For a more controlled rollback:

1. **Feature Flag**: Use feature flag to switch between implementations
2. **A/B Testing**: Test with subset of users
3. **Monitoring**: Monitor for issues after deployment
4. **Staged Rollout**: Gradually increase user percentage

```typescript
function WorkspaceTree() {
  const { isReactQueryEnabled } = useFeatureFlags();

  if (isReactQueryEnabled) {
    return <WorkspaceTreeReactQuery />;
  }

  return <WorkspaceTreeLegacy />;
}
```

## Performance Considerations

### Before Migration

- **Memory Usage**: Static data, low memory usage
- **Network**: No network requests
- **Responsiveness**: Instant updates (UI only)
- **Scalability**: Limited to mock data size

### After Migration

- **Memory Usage**: React Query cache + component state
- **Network**: Initial fetch + mutations + real-time updates
- **Responsiveness**: Optimistic updates with server sync
- **Scalability**: Handles real database data

### Optimization Tips

1. **Memoization**: Use useMemo for expensive transformations
2. **Debouncing**: Debounce real-time updates
3. **Cache Management**: Configure appropriate stale/gc times
4. **Batch Updates**: Group related mutations when possible

```typescript
// Optimized data transformation
const treeData = useMemo(() => {
  if (!workspaceData) return {};

  return createWorkspaceTreeData(
    workspaceData.folders,
    workspaceData.files,
    workspaceData.workspace.name
  );
}, [
  workspaceData?.folders,
  workspaceData?.files,
  workspaceData?.workspace?.name,
]);

// Debounced real-time updates
const debouncedInvalidate = useMemo(
  () =>
    debounce(() => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    }, 500),
  [queryClient]
);
```

## Success Metrics

Track these metrics to measure migration success:

### Technical Metrics

- **Load Time**: Time to first render
- **Error Rate**: Failed requests/operations
- **Cache Hit Rate**: React Query cache efficiency
- **Memory Usage**: Browser memory consumption

### User Experience Metrics

- **Responsiveness**: Time for UI updates
- **Data Freshness**: How current the data is
- **Error Recovery**: Success rate of retry operations
- **Feature Adoption**: Usage of new capabilities

### Business Metrics

- **User Satisfaction**: Reduced support tickets
- **Data Integrity**: Consistency between UI and database
- **Real-time Collaboration**: Cross-session synchronization
- **System Reliability**: Uptime and availability

---

_Migration Guide Version: 1.0.0_  
_Last Updated: January 2025_  
_Status: Production Ready_
