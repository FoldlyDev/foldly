# File Tree System Architecture

## Overview

A cross-feature, dynamic file tree component system built with React Query + Zustand + dnd-kit for maximum performance, modularity, and scalability. This system provides a unified interface for file/folder management across workspace, files, and upload features.

## 🎯 **Implementation Status: 95% Complete**

**Core Implementation**: ✅ **COMPLETE**  
**Database Integration**: 🔄 **PENDING**  
**Testing**: 🔄 **PENDING**  
**Styling**: 🔄 **PENDING**  
**Large Tree Visualization**: 🔄 **PENDING**  
**Advanced Features**: 🔄 **PENDING**

## Core Architecture

### Technology Stack

- **React Query**: Server state management and caching
- **Zustand**: Client state management for tree interactions
- **dnd-kit**: Drag and drop functionality
- **animate-ui**: Base component styling and animations
- **Radix Context Menu**: Right-click/tap-hold interactions

### Component Location

```
src/components/file-tree/
├── tree-provider.tsx              # Context provider for tree state
├── tree-container.tsx             # Main tree wrapper
├── tree-node.tsx                  # Individual tree node
└── index.ts                       # Component barrel exports

src/lib/hooks/file-tree/
├── use-tree-state.ts              # Tree state management
├── use-tree-actions.ts            # Tree actions (expand, select, etc.)
├── use-tree-drag.ts               # Drag and drop logic
└── index.ts                       # Hooks barrel exports

src/contexts/file-tree/
├── workspace-context.tsx          # Workspace-specific context menu
├── files-context.tsx              # Files feature context menu
├── upload-context.tsx             # Upload feature context menu
├── context-menu-wrapper.tsx       # Context menu wrapper component
└── index.ts                       # Context barrel exports

src/types/file-tree/
├── tree-types.ts                  # Core tree interfaces
├── context-types.ts               # Context-specific types
└── index.ts                       # Types barrel exports
```

## Use Cases & Contexts

### 1. Workspace Context

**Purpose**: Personal file management
**Features**:

- Folder creation/deletion with inline icons
- File upload/download
- Context menu for all operations
- Full CRUD operations

**Behavior**:

- Right-click folders: Add folder, Delete, Rename, Download
- Right-click files: Download, Delete, Rename, Move
- Inline icons on folders for quick actions

### 2. Files Feature Context

**Purpose**: Link management and workspace integration
**Features**:

- Two-panel layout (links + mini workspace)
- Links treated as read-only folders
- Drag from links to workspace
- Multi-select operations

**Behavior**:

- Left panel: Links (expandable only, no context menu)
- Right panel: Mini workspace with limited functionality
- Drag files/folders from links to workspace
- Context menu on selections: "Send to workspace root"

### 3. Upload Context

**Purpose**: File organization during upload
**Features**:

- Dynamic folder creation
- File organization before upload
- Temporary structure management

**Behavior**:

- Create folders on-demand
- Organize files into desired structure
- Context menu for folder operations only

## Component Design Principles

### 1. Dynamic Data Handling

- Components receive data via props (no hardcoded content)
- Context-specific rendering based on `contextType` prop
- Flexible node types: folder, file, link

### 2. Modular Architecture

- Each component max 500 lines
- Clear separation of concerns
- Reusable hooks for common operations
- Context-specific behavior isolation

### 3. Performance Optimization

- React Query for data fetching/caching
- Zustand for efficient state updates
- Virtualization for large trees
- Optimistic updates for UI responsiveness

## Type Safety & Source of Truth

### Single Source of Truth

All types MUST be imported from `src/lib/supabase/types/`:

- `TreeNode` interface
- `WorkspaceFile` interface
- `Link` interface
- `UploadFile` interface

### No Type Duplication

- Import existing types only
- Extend types when necessary
- Use type unions for context-specific behavior

## Props Architecture

### TreeContainer Props

```typescript
interface TreeContainerProps {
  contextType: 'workspace' | 'files' | 'upload';
  data: TreeNode[];
  onNodeSelect?: (nodeId: string) => void;
  onNodeExpand?: (nodeId: string) => void;
  onNodeAction?: (action: string, nodeId: string) => void;
  multiSelect?: boolean;
  dragEnabled?: boolean;
  contextMenuEnabled?: boolean;
  maxDepth?: number;
  className?: string;
}
```

### TreeNode Props

```typescript
interface TreeNodeProps {
  node: TreeNode;
  contextType: 'workspace' | 'files' | 'upload';
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onExpand: () => void;
  onSelect: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  className?: string;
}
```

## State Management

### Zustand Store Structure

```typescript
interface TreeState {
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  draggedItems: TreeNode[];
  contextMenuNode: string | null;

  // Actions
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  setDraggedItems: (items: TreeNode[]) => void;
  showContextMenu: (nodeId: string) => void;
  hideContextMenu: () => void;
}
```

### React Query Integration

```typescript
// Data fetching hooks
const useWorkspaceTree = (workspaceId: string) => useQuery(...)
const useLinksTree = (linkId: string) => useQuery(...)
const useUploadTree = () => useQuery(...)

// Mutation hooks
const useCreateFolder = () => useMutation(...)
const useDeleteItem = () => useMutation(...)
const useMoveItem = () => useMutation(...)
```

## Context Menu System

### Context-Specific Menus

- **Workspace**: Full CRUD operations
- **Files**: Limited operations (download, send to workspace)
- **Upload**: Folder operations only

### Implementation

```typescript
const ContextMenuWrapper = ({
  contextType,
  nodeType,
  children
}: ContextMenuWrapperProps) => {
  const MenuComponent = getContextMenuComponent(contextType, nodeType)
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <MenuComponent />
    </ContextMenu>
  )
}
```

## Drag & Drop System

### dnd-kit Integration

- Multi-item drag support
- Cross-context drag operations
- Visual feedback during drag
- Collision detection optimization

### Drag Contexts

- **Within workspace**: Move/reorganize files
- **Files to workspace**: Copy files from links
- **Upload organization**: Arrange files before upload

## Performance Considerations

### Optimization Strategies

1. **Virtualization**: Large trees (1000+ nodes)
2. **Memoization**: React.memo for tree nodes
3. **Debounced actions**: Search and filter operations
4. **Optimistic updates**: Immediate UI feedback
5. **Selective re-renders**: Zustand subscriptions

### Memory Management

- Cleanup expanded state on unmount
- Efficient drag state management
- Context menu state cleanup

## Integration Guidelines

### Component Usage

```typescript
// Workspace usage
<TreeContainer
  contextType="workspace"
  data={workspaceData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
/>

// Files feature usage
<TreeContainer
  contextType="files"
  data={linksData}
  multiSelect={true}
  dragEnabled={false}
  contextMenuEnabled={false}
/>
```

### Hook Usage

```typescript
// In feature components
const { expandedNodes, selectedNodes, toggleNode, selectNode } = useTreeState();

const { createFolder, deleteItem, moveItem } = useTreeActions(contextType);
```

## Implementation Standards

### Code Quality

- TypeScript strict mode
- ESLint/Prettier compliance
- Comprehensive error handling
- Accessible keyboard navigation
- Mobile-responsive design

### Testing Requirements

- Unit tests for all hooks
- Integration tests for drag/drop
- Context menu interaction tests
- Performance benchmarks

## Implementation Rules

### Design Principles

1. **NO COMPONENT LARGER THAN 500 LINES**
2. **SINGLE SOURCE OF TRUTH**: All types from `src/lib/supabase`
3. **MAXIMUM MODULARITY**: Clear separation of concerns
4. **NO OVER-ENGINEERING**: Keep components simple and straightforward
5. **2025 BEST PRACTICES**: Follow latest React/TypeScript standards

### Performance Requirements

- React Query for server state
- Zustand for client state
- React hooks for logic encapsulation
- Optimistic updates for UI responsiveness

## Migration Path

### Phase 1: Core Infrastructure

1. Create base components and hooks
2. Implement Zustand store
3. Set up React Query integration

### Phase 2: Context Implementation

1. Workspace context and menu
2. Files context and dual-panel layout
3. Upload context and organization

### Phase 3: Advanced Features

1. Drag and drop implementation
2. Virtualization for large trees
3. Performance optimization

## Security Considerations

### Data Validation

- Validate all props interfaces
- Sanitize user input
- Implement proper error handling
- Use TypeScript for type safety

### Access Control

- Context-based permissions
- Role-based menu options
- Secure drag/drop operations
- Audit trail for actions
