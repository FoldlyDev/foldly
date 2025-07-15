# Troubleshooting Guide: React Query Workspace Tree

## Table of Contents

1. [Common Issues](#common-issues)
2. [Performance Issues](#performance-issues)
3. [Data Synchronization Problems](#data-synchronization-problems)
4. [Drag & Drop Issues](#drag--drop-issues)
5. [Authentication & Authorization](#authentication--authorization)
6. [Real-time Updates](#real-time-updates)
7. [Debug Tools](#debug-tools)
8. [Error Monitoring](#error-monitoring)

## Common Issues

### Issue 1: Tree Not Rendering

**Symptoms:**

- Component shows loading state indefinitely
- No error messages
- Empty tree container

**Possible Causes:**

```typescript
// ❌ Missing React Query provider
function App() {
  return <WorkspaceTree />; // Will fail without QueryClient
}

// ✅ Proper setup
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceTree />
    </QueryClientProvider>
  );
}
```

**Solutions:**

1. Ensure React Query is properly configured
2. Check that `useWorkspaceTree` hook is being called
3. Verify server action is returning data

**Debug Steps:**

```typescript
// Add debugging to component
export default function WorkspaceTree() {
  const { data, isLoading, error } = useWorkspaceTree();

  console.log('Tree Debug:', { data, isLoading, error });

  // ... rest of component
}
```

### Issue 2: "useTree must be called conditionally" Error

**Symptoms:**

- React error about conditional hook usage
- Component crashes on render

**Cause:**

```typescript
// ❌ Calling useTree before data is ready
function WorkspaceTree() {
  const { data, isLoading } = useWorkspaceTree();
  const tree = useTree({ ... }); // Called unconditionally

  if (isLoading) return <Loading />;
  return <TreeComponent />;
}
```

**Solution:**

```typescript
// ✅ Only call useTree when data is ready
function WorkspaceTree() {
  const { data, isLoading } = useWorkspaceTree();

  if (isLoading) return <Loading />;
  return <TreeContent workspaceData={data} />;
}

function TreeContent({ workspaceData }) {
  const tree = useTree({ ... }); // Only called when data exists
  return <TreeComponent />;
}
```

### Issue 3: Data Not Updating After Operations

**Symptoms:**

- Drag & drop operations don't persist
- Changes not reflected in UI
- Stale data showing

**Possible Causes:**

- Cache not being invalidated
- Mutation not triggering
- Server action returning incorrect response

**Solutions:**

1. Check mutation configuration:

```typescript
const mutation = useMutation({
  mutationFn: async variables => {
    const result = await serverAction(variables);
    if (!result.success) {
      throw new Error(result.error); // Important: throw on failure
    }
    return result.data;
  },
  onSuccess: () => {
    // Ensure cache invalidation
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
  },
});
```

2. Verify server action response format:

```typescript
// ✅ Correct format
export async function moveItemAction(nodeId, targetId) {
  try {
    const result = await updateDatabase(nodeId, targetId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Issue 4: Memory Leaks

**Symptoms:**

- Browser memory usage increasing over time
- Performance degradation
- React DevTools showing unmounted components

**Causes:**

- Real-time subscriptions not cleaned up
- Event listeners not removed
- Mutations not properly cancelled

**Solutions:**

1. Proper subscription cleanup:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('workspace-changes')
    .on(
      'postgres_changes',
      {
        /* config */
      },
      handler
    )
    .subscribe();

  return () => {
    subscription.unsubscribe(); // Critical: cleanup on unmount
  };
}, []);
```

2. Cancel mutations on unmount:

```typescript
useEffect(() => {
  return () => {
    // Cancel any pending mutations
    queryClient.cancelQueries({ queryKey: workspaceQueryKeys.tree() });
  };
}, []);
```

## Performance Issues

### Issue 1: Slow Initial Load

**Symptoms:**

- Long loading times
- UI freezing during data transformation
- Poor user experience

**Debugging:**

```typescript
// Add performance monitoring
const treeData = useMemo(() => {
  console.time('Tree Data Transformation');
  const result = createWorkspaceTreeData(folders, files, workspaceName);
  console.timeEnd('Tree Data Transformation');
  return result;
}, [folders, files, workspaceName]);
```

**Solutions:**

1. Implement pagination for large datasets
2. Use virtual scrolling for many items
3. Optimize data transformation:

```typescript
// ✅ Optimized transformation
export function createWorkspaceTreeData(folders, files, workspaceName) {
  const treeData = {};

  // Pre-allocate root
  treeData[VIRTUAL_ROOT_ID] = {
    name: workspaceName,
    children: [],
    isFile: false,
  };

  // Process folders first (single pass)
  for (const folder of folders) {
    treeData[folder.id] = {
      name: folder.name,
      children: [],
      isFile: false,
    };
  }

  // Then process files (single pass)
  for (const file of files) {
    treeData[file.id] = {
      name: file.name,
      children: [],
      isFile: true,
    };
  }

  // Build relationships (efficient single pass)
  for (const folder of folders) {
    const parentId = folder.parentId || VIRTUAL_ROOT_ID;
    if (treeData[parentId]) {
      treeData[parentId].children.push(folder.id);
    }
  }

  for (const file of files) {
    const parentId = file.parentId || VIRTUAL_ROOT_ID;
    if (treeData[parentId]) {
      treeData[parentId].children.push(file.id);
    }
  }

  return treeData;
}
```

### Issue 2: Frequent Re-renders

**Symptoms:**

- Component re-rendering on every state change
- React DevTools showing unnecessary renders
- Performance degradation

**Solutions:**

1. Memoize expensive calculations:

```typescript
const treeData = useMemo(() => {
  return createWorkspaceTreeData(folders, files, workspaceName);
}, [folders, files, workspaceName]);
```

2. Use React.memo for stable components:

```typescript
const TreeItem = React.memo(({ item }) => {
  // Component implementation
});
```

3. Stabilize callback references:

```typescript
const onDrop = useCallback(
  (parentItem, newChildrenIds) => {
    // Handle drop logic
  },
  [items, mutations]
);
```

## Data Synchronization Problems

### Issue 1: Stale Data After Real-time Updates

**Symptoms:**

- Changes from other users not showing
- Own changes not reflected immediately
- Inconsistent state across tabs

**Debugging:**

```typescript
// Add subscription debugging
useEffect(() => {
  const subscription = supabase
    .channel('workspace-changes')
    .on(
      'postgres_changes',
      {
        /* config */
      },
      payload => {
        console.log('Real-time update:', payload);
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      }
    )
    .subscribe(status => {
      console.log('Subscription status:', status);
    });

  return () => subscription.unsubscribe();
}, []);
```

**Solutions:**

1. Verify subscription configuration
2. Check database triggers are working
3. Ensure proper cache invalidation

### Issue 2: Optimistic Updates Not Rolling Back

**Symptoms:**

- UI shows successful operation but database operation failed
- Inconsistent state between UI and server
- No error feedback to user

**Root Cause:**

```typescript
// ❌ Missing error handling
const mutation = useMutation({
  mutationFn: async variables => {
    const result = await serverAction(variables);
    // No error thrown on failure
    return result;
  },
  // No onError handler
});
```

**Solution:**

```typescript
// ✅ Proper error handling
const mutation = useMutation({
  mutationFn: async variables => {
    const result = await serverAction(variables);
    if (!result.success) {
      throw new Error(result.error); // Must throw for onError to trigger
    }
    return result.data;
  },
  onError: (error, variables) => {
    // Rollback optimistic update
    setItems(previousState);

    // Show error notification
    showWorkspaceError(
      'operation_failed',
      {
        itemName: 'Operation',
        itemType: 'general',
      },
      error.message
    );
  },
});
```

## Drag & Drop Issues

### Issue 1: Drag & Drop Not Working

**Symptoms:**

- Items not draggable
- Drop zones not responding
- No visual feedback

**Debugging:**

```typescript
// Check tree configuration
const tree = useTree({
  // ... other config
  canReorder: true, // Must be true for drag & drop
  onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
    console.log('Drop triggered:', { parentItem, newChildrenIds });
    // Handle drop logic
  }),
  features: [
    dragAndDropFeature, // Must be included
    // ... other features
  ],
});
```

**Solutions:**

1. Verify drag and drop feature is enabled
2. Check `canReorder` is set to true
3. Ensure drop handler is properly configured

### Issue 2: Drag & Drop Operations Not Persisting

**Symptoms:**

- Drag & drop works visually but changes don't persist
- Page refresh loses changes
- No database updates

**Debugging:**

```typescript
const onDrop = createOnDropHandler((parentItem, newChildrenIds) => {
  console.log('Drop handler called:', { parentItem, newChildrenIds });

  // Check if mutation is being triggered
  const isReorder = /* detection logic */;

  if (isReorder) {
    console.log('Triggering reorder mutation');
    updateOrderMutation.mutate({ parentId, newChildrenIds });
  } else {
    console.log('Triggering move mutation');
    moveItemMutation.mutate({ nodeId, targetId });
  }
});
```

**Solutions:**

1. Verify mutation is being triggered
2. Check server action is executing
3. Ensure database permissions are correct

### Issue 3: Incorrect Operation Detection

**Symptoms:**

- Move operations treated as reorders
- Reorder operations treated as moves
- Incorrect server actions called

**Root Cause:**

```typescript
// ❌ Incorrect detection logic
const isReorder = newChildrenIds.length === originalChildren.length;
```

**Solution:**

```typescript
// ✅ Correct detection logic
const isReorder =
  originalChildren.length === newChildrenIds.length &&
  originalChildren.every(id => newChildrenIds.includes(id));
```

## Authentication & Authorization

### Issue 1: "User not authenticated" Errors

**Symptoms:**

- Server actions returning authentication errors
- Data not loading for authenticated users
- Inconsistent authentication state

**Debugging:**

```typescript
// Check authentication state
export async function getWorkspaceTreeAction() {
  const user = await getCurrentUser();
  console.log('User in server action:', user);

  if (!user) {
    console.log('No user found, authentication failed');
    return { success: false, error: 'User not authenticated' };
  }

  // ... rest of action
}
```

**Solutions:**

1. Verify authentication middleware is working
2. Check token validity and refresh logic
3. Ensure proper session management

### Issue 2: Permission Denied Errors

**Symptoms:**

- User can see data but cannot modify
- Operations fail with permission errors
- Inconsistent access across features

**Solutions:**

1. Verify database permissions:

```sql
-- Check user permissions
SELECT * FROM information_schema.role_table_grants
WHERE grantee = 'workspace_user';
```

2. Implement proper authorization checks:

```typescript
export async function moveItemAction(nodeId, targetId) {
  const user = await getCurrentUser();

  // Check if user owns the workspace
  const workspace = await db.workspace.findFirst({
    where: {
      userId: user.id,
      files: { some: { id: nodeId } },
    },
  });

  if (!workspace) {
    return { success: false, error: 'Unauthorized' };
  }

  // ... proceed with operation
}
```

## Real-time Updates

### Issue 1: Real-time Updates Not Working

**Symptoms:**

- Changes from other users not appearing
- Own changes not syncing across tabs
- Subscription appears to be working but no updates

**Debugging:**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('workspace-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'files' },
      payload => {
        console.log('File change:', payload);
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      }
    )
    .subscribe(status => {
      console.log('Subscription status:', status);
    });

  return () => subscription.unsubscribe();
}, []);
```

**Solutions:**

1. Verify database triggers are enabled
2. Check subscription configuration
3. Ensure proper table permissions

### Issue 2: Too Many Real-time Updates

**Symptoms:**

- Excessive network requests
- Performance degradation
- UI flickering from frequent updates

**Solutions:**

1. Implement debouncing:

```typescript
import { debounce } from 'lodash';

const debouncedInvalidate = debounce(() => {
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
}, 500);

useEffect(() => {
  const subscription = supabase
    .channel('workspace-changes')
    .on(
      'postgres_changes',
      {
        /* config */
      },
      debouncedInvalidate
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

2. Use selective invalidation:

```typescript
.on('postgres_changes', { event: '*', table: 'files' }, (payload) => {
  // Only invalidate if it affects current user's workspace
  if (payload.new.workspaceId === currentWorkspaceId) {
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
  }
})
```

## Debug Tools

### React Query DevTools

Enable React Query DevTools for debugging:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Custom Debug Hook

Create a debug hook for workspace tree state:

```typescript
function useWorkspaceTreeDebug() {
  const { data, isLoading, error } = useWorkspaceTree();

  useEffect(() => {
    console.group('Workspace Tree Debug');
    console.log('Loading:', isLoading);
    console.log('Error:', error);
    console.log('Data:', data);
    console.log('Folders:', data?.folders?.length || 0);
    console.log('Files:', data?.files?.length || 0);
    console.groupEnd();
  }, [data, isLoading, error]);

  return { data, isLoading, error };
}
```

### Performance Monitoring

Add performance monitoring to identify bottlenecks:

```typescript
// In your component
useEffect(() => {
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('workspace-tree')) {
        console.log('Performance:', entry.name, entry.duration);
      }
    }
  });

  observer.observe({ entryTypes: ['measure'] });

  return () => observer.disconnect();
}, []);

// Mark performance points
performance.mark('workspace-tree-render-start');
// ... rendering logic
performance.mark('workspace-tree-render-end');
performance.measure(
  'workspace-tree-render',
  'workspace-tree-render-start',
  'workspace-tree-render-end'
);
```

## Error Monitoring

### Client-side Error Tracking

Implement comprehensive error tracking:

```typescript
function reportError(error, context) {
  // Send to monitoring service (Sentry, LogRocket, etc.)
  console.error('Workspace Tree Error:', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
}

// Use in mutations
const mutation = useMutation({
  onError: (error, variables) => {
    reportError(error, {
      operation: 'move_item',
      variables,
      component: 'WorkspaceTree',
    });
  },
});
```

### Server-side Error Logging

Add proper logging to server actions:

```typescript
export async function moveItemAction(nodeId, targetId) {
  try {
    // ... operation logic
    return { success: true, data: result };
  } catch (error) {
    // Log error with context
    console.error('Move item action failed:', {
      error: error.message,
      stack: error.stack,
      nodeId,
      targetId,
      timestamp: new Date().toISOString(),
    });

    return { success: false, error: 'Failed to move item' };
  }
}
```

### Health Checks

Implement health checks for critical dependencies:

```typescript
function useWorkspaceHealthCheck() {
  const [health, setHealth] = useState({
    queryClient: true,
    supabase: true,
    authentication: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check query client
        const queryClient = useQueryClient();
        const queryState = queryClient.getQueryState(workspaceQueryKeys.tree());

        // Check Supabase connection
        const { data, error } = await supabase
          .from('workspaces')
          .select('count');

        // Check authentication
        const user = await getCurrentUser();

        setHealth({
          queryClient: !!queryClient,
          supabase: !error,
          authentication: !!user,
        });
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return health;
}
```

## Quick Reference

### Common Error Messages

| Error Message                          | Likely Cause           | Solution                  |
| -------------------------------------- | ---------------------- | ------------------------- |
| "User not authenticated"               | Authentication failure | Check auth middleware     |
| "Failed to fetch workspace tree"       | Database connection    | Verify database setup     |
| "Cannot read property 'children'"      | Data structure issue   | Check data transformation |
| "useTree must be called conditionally" | Hook timing            | Use conditional rendering |
| "Mutation failed"                      | Server action error    | Check server action logic |

### Performance Benchmarks

| Operation           | Expected Time | Warning Threshold |
| ------------------- | ------------- | ----------------- |
| Initial load        | < 500ms       | > 2s              |
| Tree transformation | < 100ms       | > 500ms           |
| Drag & drop         | < 50ms        | > 200ms           |
| Cache invalidation  | < 10ms        | > 100ms           |

---

_Troubleshooting Guide Version: 1.0.0_  
_Last Updated: January 2025_  
_Status: Production Ready_
