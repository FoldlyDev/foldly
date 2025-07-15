# Implementation Guide: React Query Workspace Tree

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Implementation](#step-by-step-implementation)
3. [Key Components](#key-components)
4. [Data Flow Implementation](#data-flow-implementation)
5. [Error Handling Implementation](#error-handling-implementation)
6. [Testing Your Implementation](#testing-your-implementation)
7. [Performance Optimizations](#performance-optimizations)
8. [Common Issues](#common-issues)

## Prerequisites

Before implementing the React Query workspace tree, ensure you have:

### Required Dependencies

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@headless-tree/core": "^1.0.0",
  "@headless-tree/react": "^1.0.0",
  "lucide-react": "^0.400.0"
}
```

### Required Infrastructure

- ✅ React Query client configured in your app
- ✅ Server actions for workspace operations
- ✅ Database schema for files and folders
- ✅ Internal notifications system
- ✅ Workspace authentication and authorization

### File Structure

```
src/features/workspace/
├── components/
│   └── tree/
│       └── WorkspaceTree.tsx
├── hooks/
│   ├── use-workspace-tree.ts
│   └── use-workspace-realtime.ts
├── lib/
│   ├── actions/
│   │   ├── tree-actions.ts
│   │   └── index.ts
│   └── query-keys.ts
└── utils/
    └── workspace-tree-utils.ts
```

## Step-by-Step Implementation

### Step 1: Set Up Query Keys

Create a centralized query key system for consistent caching:

```typescript
// src/features/workspace/lib/query-keys.ts
export const workspaceQueryKeys = {
  all: () => ['workspace'],
  tree: () => [...workspaceQueryKeys.all(), 'tree'],
  files: () => [...workspaceQueryKeys.all(), 'files'],
  folders: () => [...workspaceQueryKeys.all(), 'folders'],
  realtime: () => [...workspaceQueryKeys.all(), 'realtime'],
};
```

### Step 2: Create Data Transformation Utilities

Convert database data to tree format:

```typescript
// src/lib/utils/workspace-tree-utils.ts
export const VIRTUAL_ROOT_ID = 'virtual-root';

export interface TreeItem {
  name: string;
  children?: string[];
  isFile?: boolean;
}

export function createWorkspaceTreeData(
  folders: any[],
  files: any[],
  workspaceName: string
): Record<string, TreeItem> {
  const treeData: Record<string, TreeItem> = {};

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

    // Add to parent's children
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
      children: [], // Files have no children
      isFile: true,
    };

    // Add to parent's children
    const parentId = file.parentId || VIRTUAL_ROOT_ID;
    if (treeData[parentId]) {
      treeData[parentId].children = treeData[parentId].children || [];
      treeData[parentId].children.push(file.id);
    }
  });

  return treeData;
}
```

### Step 3: Create React Query Hook

Implement the data fetching hook:

```typescript
// src/features/workspace/hooks/use-workspace-tree.ts
import { useQuery } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { getWorkspaceTreeAction } from '../lib/actions';
import { useWorkspaceRealtime } from './use-workspace-realtime';

export function useWorkspaceTree() {
  // Set up real-time subscription
  useWorkspaceRealtime();

  return useQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      const result = await getWorkspaceTreeAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### Step 4: Implement Server Actions

Create the server actions for database operations:

```typescript
// src/features/workspace/lib/actions/tree-actions.ts
'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getWorkspaceTreeAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Fetch workspace data
    const workspace = await db.workspace.findFirst({
      where: { userId: user.id },
      include: {
        folders: {
          orderBy: { displayOrder: 'asc' },
        },
        files: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    return {
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
        folders: workspace.folders,
        files: workspace.files,
      },
    };
  } catch (error) {
    console.error('Error fetching workspace tree:', error);
    return {
      success: false,
      error: 'Failed to fetch workspace tree',
    };
  }
}

export async function updateItemOrderAction(
  parentId: string,
  newChildrenIds: string[]
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update display order for all children
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

    revalidatePath('/dashboard');
    return { success: true, data: null };
  } catch (error) {
    console.error('Error updating item order:', error);
    return {
      success: false,
      error: 'Failed to update item order',
    };
  }
}

export async function moveItemAction(nodeId: string, targetId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const actualParentId = targetId === 'root' ? null : targetId;

    // Try to update as file first, then as folder
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

    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error moving item:', error);
    return {
      success: false,
      error: 'Failed to move item',
    };
  }
}
```

### Step 5: Create the Component Structure

Implement the main component with proper loading states:

```typescript
// src/features/workspace/components/tree/WorkspaceTree.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceTree } from '../../hooks/use-workspace-tree';
import { createWorkspaceTreeData, VIRTUAL_ROOT_ID } from '@/lib/utils/workspace-tree-utils';
import { ContentLoader } from '@/components/ui';

// TreeContent component - only renders when data is ready
function TreeContent({ workspaceData }: { workspaceData: any }) {
  const queryClient = useQueryClient();

  // Convert database data to tree format
  const treeData = useMemo(() => {
    return createWorkspaceTreeData(
      workspaceData.folders || [],
      workspaceData.files || [],
      workspaceData.workspace?.name || 'Workspace'
    );
  }, [workspaceData]);

  // Local state for optimistic updates
  const [items, setItems] = useState<Record<string, TreeItem>>(treeData);

  // Update items when treeData changes
  useEffect(() => {
    setItems(treeData);
  }, [treeData]);

  // Implement mutations here...
  // (See full implementation in the actual component)

  return (
    <div className="workspace-tree">
      {/* Tree implementation */}
    </div>
  );
}

// Main component with loading states
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

### Step 6: Implement Mutations

Add mutation handling for drag and drop operations:

```typescript
// Inside TreeContent component
const updateOrderMutation = useMutation({
  mutationFn: async ({
    parentId,
    newChildrenIds,
  }: {
    parentId: string;
    newChildrenIds: string[];
  }) => {
    const result = await updateItemOrderAction(parentId, newChildrenIds);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update item order');
    }
    return result.data;
  },
  onSuccess: (data, variables) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

    // Show success notification
    showWorkspaceNotification('items_reordered', {
      itemName: 'Items',
      itemType: 'folder',
      targetLocation: items[variables.parentId]?.name || 'workspace',
    });
  },
  onError: (error, variables) => {
    // Rollback optimistic update
    setItems(treeData);

    // Show error notification
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

### Step 7: Set Up Real-time Updates

Implement real-time synchronization:

```typescript
// src/features/workspace/hooks/use-workspace-realtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';

export function useWorkspaceRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscription
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

## Data Flow Implementation

### 1. Initial Load Flow

```typescript
// Component mounts → useWorkspaceTree → React Query
const { data, isLoading, error } = useWorkspaceTree();

// Hook triggers query
const result = await getWorkspaceTreeAction();

// Data transformation
const treeData = createWorkspaceTreeData(folders, files, workspaceName);

// Component renders with data
return <TreeContent workspaceData={data} />;
```

### 2. Drag & Drop Flow

```typescript
// User initiates drag
const onDrop = createOnDropHandler((parentItem, newChildrenIds) => {
  // 1. Optimistic update
  setItems(prevItems => ({
    ...prevItems,
    [parentId]: { ...parentItemData, children: newChildrenIds }
  }));

  // 2. Determine operation type
  const isReorder = /* logic to detect reorder vs move */;

  // 3. Execute mutation
  if (isReorder) {
    updateOrderMutation.mutate({ parentId, newChildrenIds });
  } else {
    moveItemMutation.mutate({ nodeId: movedItemId, targetId: parentId });
  }
});
```

## Error Handling Implementation

### 1. Component-Level Error Handling

```typescript
// Loading state
if (isLoading) return <LoadingSpinner />;

// Error state
if (error) return <ErrorMessage error={error} />;

// Empty state
if (!data) return <EmptyState />;
```

### 2. Mutation Error Handling

```typescript
const mutation = useMutation({
  onError: (error, variables) => {
    // 1. Rollback optimistic update
    setItems(treeData);

    // 2. Show user-friendly error
    showWorkspaceError(
      'operation_failed',
      {
        itemName: variables.itemName,
        itemType: variables.itemType,
      },
      error.message
    );

    // 3. Optional: Report to monitoring service
    reportError(error, { operation: 'move_item', variables });
  },
});
```

## Testing Your Implementation

### 1. Unit Tests

```typescript
// Test data transformation
describe('createWorkspaceTreeData', () => {
  it('should convert database data to tree format', () => {
    const folders = [{ id: 'folder1', name: 'Folder 1', parentId: null }];
    const files = [{ id: 'file1', name: 'File 1.txt', parentId: 'folder1' }];

    const result = createWorkspaceTreeData(folders, files, 'Workspace');

    expect(result['virtual-root']).toBeDefined();
    expect(result['folder1'].isFile).toBe(false);
    expect(result['file1'].isFile).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
// Test component with mock data
describe('WorkspaceTree', () => {
  it('should render loading state initially', () => {
    const { getByText } = render(<WorkspaceTree />);
    expect(getByText('Loading workspace...')).toBeInTheDocument();
  });

  it('should render tree when data is loaded', async () => {
    // Mock successful data fetch
    const { getByText } = render(<WorkspaceTree />);
    await waitFor(() => {
      expect(getByText('Workspace')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimizations

### 1. Memoization

```typescript
// Memoize expensive transformations
const treeData = useMemo(() => {
  return createWorkspaceTreeData(folders, files, workspaceName);
}, [folders, files, workspaceName]);
```

### 2. Selective Updates

```typescript
// Only update UI during mutations
{mutation.isPending && (
  <span className="text-blue-600">Updating...</span>
)}
```

### 3. Efficient Cache Keys

```typescript
// Hierarchical cache keys for better invalidation
export const workspaceQueryKeys = {
  tree: () => ['workspace', 'tree'],
  item: (id: string) => ['workspace', 'item', id],
};
```

## Common Issues

### Issue 1: Tree Not Updating After Drag & Drop

**Problem**: Tree doesn't reflect database changes
**Solution**: Ensure cache invalidation after mutations

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
};
```

### Issue 2: Race Conditions

**Problem**: Multiple rapid operations cause inconsistent state
**Solution**: Implement proper loading states and disable actions during mutations

```typescript
const isUpdating = updateOrderMutation.isPending || moveItemMutation.isPending;

<TreeItem disabled={isUpdating}>
```

### Issue 3: Memory Leaks

**Problem**: Real-time subscriptions not cleaned up
**Solution**: Proper cleanup in useEffect

```typescript
useEffect(() => {
  const subscription = /* setup subscription */;
  return () => subscription.unsubscribe();
}, []);
```

---

_Implementation Guide Version: 1.0.0_
_Last Updated: January 2025_
_Status: Production Ready_
