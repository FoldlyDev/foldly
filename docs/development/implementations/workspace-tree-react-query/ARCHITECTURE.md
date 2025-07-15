# Architecture: React Query Workspace Tree Implementation

## System Overview

This document outlines the architectural decisions and technical implementation details for integrating React Query with the workspace tree component, enabling real database data fetching and persistent drag-and-drop operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Query Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  useWorkspaceTree Hook                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Query Client  │  │   Real-time     │  │   Cache         │     │
│  │   Management    │  │   Subscription  │  │   Management    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Data Flow
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Component Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│  WorkspaceTree Component                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Loading       │  │   Error         │  │   Tree Content  │     │
│  │   States        │  │   Handling      │  │   Rendering     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Selection     │  │   Operation     │  │   Progress      │     │
│  │   Mode          │  │   Overlay       │  │   Tracking      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User Actions
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  Enhanced Server Actions & Mutations                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Batch Move    │  │   Batch Delete  │  │   Nested        │     │
│  │   Operations    │  │   Operations    │  │   Management    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Progress      │  │   Update Order  │  │   Optimistic    │     │
│  │   Callbacks     │  │   Action        │  │   Updates       │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Database Operations
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Database Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Files Table   │  │   Folders Table │  │   Workspace     │     │
│  │   + Recursive   │  │   + Nested      │  │   Table         │     │
│  │   Operations    │  │   Management    │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Data Layer (`useWorkspaceTree`)

**Purpose**: Manages data fetching, caching, and real-time synchronization

**Key Features**:

- React Query integration for efficient data fetching
- Real-time subscriptions for live updates
- Automatic cache invalidation and refetching
- Error handling and retry logic

```typescript
// Hook signature
function useWorkspaceTree(): {
  data: WorkspaceTreeData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult>;
};
```

**Implementation Details**:

- Uses `workspaceQueryKeys.tree()` for cache key management
- Integrates with `useWorkspaceRealtime` for live updates
- Handles loading states and error conditions
- Provides automatic refetching on window focus

### 2. UI Layer (`WorkspaceTree`)

**Purpose**: Renders the tree interface with proper loading states and error handling

**Architecture Pattern**: Conditional rendering with dedicated sub-components

```typescript
// Component structure
WorkspaceTree
├── Loading State (ContentLoader)
├── Error State (Error message)
├── Empty State (No files message)
└── TreeContent (Main tree rendering)
```

**State Management**:

- Separates data fetching from UI rendering
- Uses conditional rendering to ensure tree initializes only with data
- Manages local state for optimistic updates

### 3. Business Logic Layer (Mutations)

**Purpose**: Handles user interactions and database persistence

**Key Operations**:

#### Move Item Mutation

```typescript
const moveItemMutation = useMutation({
  mutationFn: async ({ nodeId, targetId }) => {
    const result = await moveItemAction(nodeId, targetId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    showWorkspaceNotification('file_moved', { ... });
  },
  onError: () => {
    setItems(treeData); // Rollback optimistic update
    showWorkspaceError('file_moved', { ... });
  }
});
```

#### Update Order Mutation

```typescript
const updateOrderMutation = useMutation({
  mutationFn: async ({ parentId, newChildrenIds }) => {
    const result = await updateItemOrderAction(parentId, newChildrenIds);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
  // Similar success/error handling
});
```

## Key Design Decisions

### 1. Conditional Component Rendering

**Problem**: `useTree` hook was being called before React Query data was ready

**Solution**: Separate `TreeContent` component that only renders when data is available

```typescript
// Before (problematic)
function WorkspaceTree() {
  const { data, isLoading } = useWorkspaceTree();
  const tree = useTree({ ... }); // Called even when data is undefined

  if (isLoading) return <Loading />;
  return <TreeComponent />;
}

// After (solution)
function WorkspaceTree() {
  const { data, isLoading } = useWorkspaceTree();

  if (isLoading) return <Loading />;
  return <TreeContent workspaceData={data} />;
}

function TreeContent({ workspaceData }) {
  const tree = useTree({ ... }); // Only called when data is ready
  return <TreeComponent />;
}
```

### 2. Optimistic Updates with Rollback

**Problem**: Need immediate UI feedback while ensuring data consistency

**Solution**: Optimistic updates with automatic rollback on errors

```typescript
// Pattern used
const mutation = useMutation({
  mutationFn: async variables => {
    // Optimistically update UI first
    setItems(optimisticState);

    // Then perform database operation
    const result = await serverAction(variables);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
  onError: () => {
    setItems(previousState); // Rollback on error
  },
});
```

### 3. Unified Drop Handler

**Problem**: Handle both reorder (same parent) and move (different parent) operations

**Solution**: Smart detection in single drop handler

```typescript
const onDrop = createOnDropHandler((parentItem, newChildrenIds) => {
  const originalChildren = treeData[parentId]?.children || [];

  // Detect operation type
  const isReorder =
    originalChildren.length === newChildrenIds.length &&
    originalChildren.every(id => newChildrenIds.includes(id));

  if (isReorder) {
    updateOrderMutation.mutate({ parentId, newChildrenIds });
  } else {
    const movedItemId = newChildrenIds.find(
      id => !originalChildren.includes(id)
    );
    moveItemMutation.mutate({ nodeId: movedItemId, targetId: parentId });
  }
});
```

### 4. Virtual Root Management

**Problem**: Handle workspace root consistently across the application

**Solution**: Use `VIRTUAL_ROOT_ID` constant for root identification

```typescript
const VIRTUAL_ROOT_ID = 'virtual-root';

// Usage in tree initialization
const tree = useTree({
  rootItemId: VIRTUAL_ROOT_ID,
  initialState: {
    expandedItems: [VIRTUAL_ROOT_ID],
  },
});

// Usage in server actions
const actualParentId = targetId === VIRTUAL_ROOT_ID ? 'root' : targetId;
```

## Data Flow

### 1. Initial Load

```
User loads page → useWorkspaceTree → React Query fetches data →
Tree renders with real data → User sees workspace files/folders
```

### 2. Drag & Drop Operation

```
User drags item → onDrop handler → Optimistic UI update →
Server action → Database update → Cache invalidation →
Real-time sync → UI confirmation
```

### 3. Error Handling

```
Operation fails → Mutation onError → Rollback optimistic update →
Show error notification → User sees original state
```

## Performance Considerations

### 1. Data Transformation Optimization

**Pattern**: Memoized data transformation

```typescript
const treeData = useMemo(() => {
  return createWorkspaceTreeData(
    workspaceData.folders || [],
    workspaceData.files || [],
    workspaceData.workspace?.name || 'Workspace'
  );
}, [workspaceData]);
```

### 2. Mutation State Management

**Pattern**: Selective UI updates during mutations

```typescript
{(updateOrderMutation.isPending || moveItemMutation.isPending) && (
  <span className='ml-2 text-blue-600'>Updating...</span>
)}
```

### 3. Cache Management

**Pattern**: Efficient query key structure

```typescript
// Hierarchical cache keys
export const workspaceQueryKeys = {
  tree: () => ['workspace', 'tree'],
  files: () => ['workspace', 'files'],
  folders: () => ['workspace', 'folders'],
};
```

## Error Handling Strategy

### 1. Component Level

- Loading states for data fetching
- Error boundaries for unexpected errors
- Graceful degradation for empty states

### 2. Mutation Level

- Optimistic updates with rollback
- User-friendly error messages
- Automatic retry for transient failures

### 3. Network Level

- React Query retry logic
- Offline handling
- Stale-while-revalidate caching

## Security Considerations

### 1. Server Actions

- All database operations go through server actions
- Proper authorization checks in server actions
- Input validation and sanitization

### 2. Client-side Validation

- Optimistic updates validated on server
- Client state synchronized with server state
- No sensitive data in client-side mutations

## Testing Strategy

### 1. Unit Tests

- Component rendering with different data states
- Hook behavior and state management
- Utility functions for data transformation

### 2. Integration Tests

- Full user interaction flows
- Drag and drop operations
- Error scenarios and recovery

### 3. E2E Tests

- Complete workspace tree workflows
- Real-time synchronization
- Cross-session updates

## Future Enhancements

### 1. Performance Optimizations

- Virtual scrolling for large trees
- Selective component updates
- Background synchronization

### 2. Feature Additions

- Collaborative editing indicators
- Conflict resolution for concurrent updates
- Advanced filtering and search

### 3. Developer Experience

- Enhanced error messages
- Better debugging tools
- Performance monitoring

---

_Architecture version: 1.0.0_
_Last updated: January 2025_
_Status: Production Ready_
