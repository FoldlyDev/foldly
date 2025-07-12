# File Tree System

A comprehensive, cross-feature file tree component system built with React Query + Zustand + dnd-kit for maximum performance, modularity, and scalability.

## 🎯 Key Features

- **Cross-Feature Support**: Works across workspace, files, and upload features
- **Dynamic Data Handling**: No hardcoded content, fully data-driven
- **Context-Aware**: Different behaviors based on usage context
- **Performance Optimized**: React Query + Zustand + virtualization
- **Drag & Drop**: Full dnd-kit integration with multi-item support
- **Accessibility**: Complete keyboard navigation and screen reader support
- **Mobile Responsive**: Touch-friendly interactions

## 🏗️ Architecture

### Component Structure

```
src/components/file-tree/
├── tree-container.tsx         # Main tree wrapper
├── tree-node.tsx             # Individual tree node
├── tree-provider.tsx         # Context provider
├── examples/                 # Usage examples
│   └── basic-usage.tsx      # Basic usage examples
└── index.ts                 # Component exports

src/lib/hooks/file-tree/
├── use-tree-state.ts        # Zustand state management
├── use-tree-actions.ts      # React Query actions
├── use-tree-drag.ts         # Drag and drop logic
├── use-tree-utils.ts        # Utility functions
└── index.ts                 # Hooks exports

src/contexts/file-tree/
├── context-menu-wrapper.tsx # Context menu wrapper
├── workspace-context.tsx    # Workspace context menu
├── files-context.tsx       # Files context menu
├── upload-context.tsx      # Upload context menu
└── index.ts                # Context exports

src/types/file-tree/
├── tree-types.ts           # Core tree interfaces
├── context-types.ts        # Context-specific types
└── index.ts               # Type exports
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { TreeContainer, TreeProvider } from '@/components/file-tree';
import { buildWorkspaceTree } from '@/lib/hooks/file-tree/use-tree-utils';

// Workspace Tree
const WorkspaceTree = () => {
  const { data: workspaceData } = useQuery({
    queryKey: ['workspace-tree'],
    queryFn: fetchWorkspaceTree,
  });

  const treeData = buildWorkspaceTree(
    workspaceData?.folders || [],
    workspaceData?.files || []
  );

  return (
    <TreeProvider contextType='workspace' contextId='workspace-1'>
      <TreeContainer
        contextType='workspace'
        data={treeData}
        multiSelect={true}
        dragEnabled={true}
        contextMenuEnabled={true}
      />
    </TreeProvider>
  );
};
```

### Component Variants

```tsx
// Workspace Tree (Full functionality)
<WorkspaceTreeContainer
  data={workspaceData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
/>

// Files Tree (Read-only with limited actions)
<FilesTreeContainer
  data={linksData}
  multiSelect={true}
  dragEnabled={false}
  contextMenuEnabled={false}
/>

// Upload Tree (Organization during upload)
<UploadTreeContainer
  data={uploadData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
  maxDepth={5}
/>
```

## 📊 Context Types

### 1. Workspace Context

**Purpose**: Personal file management  
**Features**:

- Full CRUD operations
- Folder creation/deletion with inline icons
- File upload/download
- Context menu for all operations
- Drag and drop support

**Usage**:

```tsx
<TreeContainer
  contextType='workspace'
  data={workspaceData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
/>
```

### 2. Files Context

**Purpose**: Link management and workspace integration  
**Features**:

- Two-panel layout (links + mini workspace)
- Links treated as read-only folders
- Drag from links to workspace
- Multi-select operations
- Limited context menu

**Usage**:

```tsx
<TreeContainer
  contextType='files'
  data={linksData}
  multiSelect={true}
  dragEnabled={false}
  contextMenuEnabled={false}
/>
```

### 3. Upload Context

**Purpose**: File organization during upload  
**Features**:

- Dynamic folder creation
- File organization before upload
- Temporary structure management
- Context menu for folder operations only

**Usage**:

```tsx
<TreeContainer
  contextType='upload'
  data={uploadData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
  maxDepth={5}
/>
```

## 🔧 State Management

### Zustand Store

```tsx
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';

const { expandedNodes, selectedNodes, toggleNode, selectNode, clearSelection } =
  useTreeStore();
```

### React Query Integration

```tsx
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions';

const {
  createFolder,
  deleteItem,
  moveItem,
  renameItem,
  downloadItem,
  isLoading,
} = useTreeActions('workspace');
```

## 🎨 Drag and Drop

### Setup

```tsx
import { useTreeDrag } from '@/lib/hooks/file-tree/use-tree-drag';

const { handleDragStart, handleDragOver, handleDragEnd, canDrop, isDragging } =
  useTreeDrag('workspace', 'workspace-1', treeData);
```

### Drag Rules

- **Workspace**: Full drag and drop within workspace
- **Files**: Drag from links to workspace only
- **Upload**: Reorganize files before upload

## 📱 Context Menus

### Workspace Context Menu

- Add Folder
- Rename
- Delete
- Download
- Move
- Duplicate
- Share
- Properties

### Files Context Menu

- Download
- Send to Workspace
- Share

### Upload Context Menu

- Add Folder
- Rename
- Move
- Remove from Upload
- File Info

## 🛠️ Utility Functions

### Tree Builders

```tsx
import {
  buildWorkspaceTree,
  buildLinksTree,
  buildUploadTree,
} from '@/lib/hooks/file-tree/use-tree-utils';

// Build from workspace data
const workspaceTree = buildWorkspaceTree(folders, files, {
  sortFunction: sortByName,
  filterFunction: filterByType(['folder', 'file']),
  maxDepth: 10,
});

// Build from links data
const linksTree = buildLinksTree(links, linkFiles, {
  sortFunction: sortByDate,
  maxDepth: 5,
});

// Build from upload data
const uploadTree = buildUploadTree(uploadFiles, {
  sortFunction: sortBySize,
  maxDepth: 5,
});
```

### Tree Manipulation

```tsx
import {
  findNodeById,
  flattenTree,
  getParentNodes,
  getChildNodes,
  countNodes,
  calculateTreeSize,
} from '@/lib/hooks/file-tree/use-tree-utils';

// Find specific node
const node = findNodeById(treeData, 'node-id');

// Flatten tree for processing
const flatNodes = flattenTree(treeData);

// Get statistics
const stats = countNodes(treeData);
const totalSize = calculateTreeSize(treeData);
```

### Sorting and Filtering

```tsx
import {
  sortByName,
  sortBySize,
  sortByDate,
  filterByName,
  filterByType,
  filterBySize,
} from '@/lib/hooks/file-tree/use-tree-utils';

// Sort tree
const sortedTree = buildWorkspaceTree(folders, files, {
  sortFunction: sortByName,
});

// Filter tree
const filteredTree = buildWorkspaceTree(folders, files, {
  filterFunction: filterByType(['folder']),
});
```

## ⌨️ Keyboard Navigation

### Supported Keys

- **Arrow Keys**: Navigate between nodes
- **Enter/Space**: Select node
- **Right Arrow**: Expand folder
- **Left Arrow**: Collapse folder
- **Escape**: Close context menu
- **Ctrl/Cmd + Click**: Multi-select

### Accessibility

- Full screen reader support
- ARIA labels and descriptions
- Focus management
- Keyboard shortcuts

## 🎭 Performance

### Optimizations

- **React.memo**: Memoized components
- **Zustand**: Efficient state management
- **React Query**: Smart caching
- **Virtualization**: Large tree support (1000+ nodes)
- **Selective Re-renders**: Optimized subscriptions

### Large Trees

For trees with 1000+ nodes, virtualization is automatically enabled:

```tsx
import { VirtualizedTreeContainer } from '@/components/file-tree';

<VirtualizedTreeContainer
  data={largeTreeData}
  height={400}
  itemSize={32}
  contextType='workspace'
/>;
```

## 📱 Mobile Support

### Touch Interactions

- **Tap**: Select node
- **Long Press**: Context menu
- **Drag**: Move items (on supported contexts)
- **Swipe**: Navigate large trees

### Responsive Design

- Adaptive layout for mobile screens
- Touch-friendly hit targets
- Optimized for one-handed use

## 🧪 Testing

### Unit Tests

```bash
npm test -- file-tree
```

### Integration Tests

```bash
npm test -- file-tree.integration
```

### Performance Tests

```bash
npm test -- file-tree.performance
```

## 🔧 Configuration

### Default Settings

```tsx
const defaultConfig = {
  workspace: {
    allowFolderCreation: true,
    allowFileUpload: true,
    allowDragDrop: true,
    allowContextMenu: true,
    maxDepth: 10,
    showInlineActions: true,
  },
  files: {
    showLinkPanel: true,
    showWorkspacePanel: true,
    allowDragFromLinks: true,
    allowMultiSelect: true,
  },
  upload: {
    allowFolderCreation: true,
    allowFileReorganization: true,
    allowDragDrop: true,
    maxDepth: 5,
    temporaryStructure: true,
  },
};
```

### Custom Configuration

```tsx
<TreeProvider
  contextType='workspace'
  config={{
    allowFolderCreation: false,
    maxDepth: 5,
    showInlineActions: false,
  }}
>
  <TreeContainer {...props} />
</TreeProvider>
```

## 🚨 Error Handling

### Error Boundaries

```tsx
import { TreeErrorBoundary } from '@/components/file-tree';

<TreeErrorBoundary>
  <TreeContainer {...props} />
</TreeErrorBoundary>;
```

### Loading States

```tsx
<TreeContainer
  data={treeData}
  loading={isLoading}
  error={error}
  empty={{
    message: 'No files found',
    icon: '📁',
  }}
/>
```

## 📝 Examples

See the [examples](./examples/) directory for complete usage examples:

- [Basic Usage](./examples/basic-usage.tsx)
- [Advanced Configuration](./examples/advanced-config.tsx)
- [Custom Context Menus](./examples/custom-context.tsx)
- [Performance Optimization](./examples/performance.tsx)

## 🔗 Related Documentation

- [Project Architecture](../../../docs/architecture/ARCHITECTURE.md)
- [Type System](../../../docs/architecture/TYPE_ARCHITECTURE.md)
- [React Query Migration](../../../docs/development/implementations/react-query-migration/)
- [Communication Strategy](../../../docs/architecture/COMMUNICATION_STRATEGY.md)

## 🤝 Contributing

### Development

1. Follow the single source of truth principle
2. Import types from `@/lib/supabase/types`
3. Keep components under 500 lines
4. Follow DRY and SOLID principles
5. Write comprehensive tests

### Pull Requests

1. Include tests for new features
2. Update documentation
3. Follow existing code style
4. Test across all contexts

---

**Status**: ✅ **Production Ready**  
**Version**: 1.0.0  
**Last Updated**: January 2025
