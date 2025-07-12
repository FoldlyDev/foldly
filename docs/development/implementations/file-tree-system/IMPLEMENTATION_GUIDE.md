# File Tree System Implementation Guide

## Overview

This guide provides step-by-step implementation instructions for the dynamic file tree component system following the architecture defined in `ARCHITECTURE.md`.

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Create Base Directory Structure

```bash
mkdir -p src/components/file-tree
mkdir -p src/lib/hooks/file-tree
mkdir -p src/contexts/file-tree
mkdir -p src/types/file-tree
```

#### 1.2 Define Base Types

```typescript
// src/types/file-tree/tree-types.ts
import {
  TreeNode,
  WorkspaceFile,
  Link,
  UploadFile,
} from '@/lib/supabase/types';

export interface TreeContainerProps {
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

export interface TreeNodeProps {
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

export interface TreeState {
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

#### 1.3 Create Zustand Store

```typescript
// src/lib/hooks/file-tree/use-tree-state.ts
import { create } from 'zustand';
import { TreeState } from '@/types/file-tree';

export const useTreeStore = create<TreeState>((set, get) => ({
  expandedNodes: new Set(),
  selectedNodes: new Set(),
  draggedItems: [],
  contextMenuNode: null,

  toggleNode: (nodeId: string) => {
    set(state => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { expandedNodes: newExpanded };
    });
  },

  selectNode: (nodeId: string, multiSelect = false) => {
    set(state => {
      const newSelected = new Set(multiSelect ? state.selectedNodes : []);
      if (newSelected.has(nodeId)) {
        newSelected.delete(nodeId);
      } else {
        newSelected.add(nodeId);
      }
      return { selectedNodes: newSelected };
    });
  },

  setDraggedItems: (items: TreeNode[]) => {
    set({ draggedItems: items });
  },

  showContextMenu: (nodeId: string) => {
    set({ contextMenuNode: nodeId });
  },

  hideContextMenu: () => {
    set({ contextMenuNode: null });
  },
}));
```

#### 1.4 Create React Query Hooks

```typescript
// src/lib/hooks/file-tree/use-tree-actions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTreeStore } from './use-tree-state';

export const useTreeActions = (
  contextType: 'workspace' | 'files' | 'upload'
) => {
  const queryClient = useQueryClient();
  const { selectNode, toggleNode } = useTreeStore();

  const createFolder = useMutation({
    mutationFn: async (data: { name: string; parentId?: string }) => {
      // Implementation based on contextType
      switch (contextType) {
        case 'workspace':
          return await createWorkspaceFolder(data);
        case 'upload':
          return await createUploadFolder(data);
        default:
          throw new Error('Create folder not supported for this context');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', contextType] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (nodeId: string) => {
      // Implementation based on contextType
      switch (contextType) {
        case 'workspace':
          return await deleteWorkspaceItem(nodeId);
        case 'upload':
          return await deleteUploadItem(nodeId);
        default:
          throw new Error('Delete not supported for this context');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', contextType] });
    },
  });

  const moveItem = useMutation({
    mutationFn: async (data: { nodeId: string; targetId: string }) => {
      // Implementation based on contextType
      switch (contextType) {
        case 'workspace':
          return await moveWorkspaceItem(data);
        case 'files':
          return await moveFileToWorkspace(data);
        case 'upload':
          return await moveUploadItem(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', contextType] });
    },
  });

  return {
    createFolder,
    deleteItem,
    moveItem,
    selectNode,
    toggleNode,
  };
};
```

### Phase 2: Core Components (Week 2)

#### 2.1 Create Tree Container Component

```typescript
// src/components/file-tree/tree-container.tsx
import { memo, useCallback } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { TreeContainerProps } from '@/types/file-tree'
import { TreeNode } from './tree-node'
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions'

const TreeContainerComponent = ({
  contextType,
  data,
  multiSelect = false,
  dragEnabled = true,
  contextMenuEnabled = true,
  className,
  ...props
}: TreeContainerProps) => {
  const { moveItem } = useTreeActions(contextType)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!dragEnabled) return

    const { active, over } = event
    if (over && active.id !== over.id) {
      moveItem.mutate({
        nodeId: active.id as string,
        targetId: over.id as string,
      })
    }
  }, [dragEnabled, moveItem])

  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No files or folders</div>
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={`file-tree ${className}`} {...props}>
        {data.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            contextType={contextType}
            level={0}
            multiSelect={multiSelect}
            dragEnabled={dragEnabled}
            contextMenuEnabled={contextMenuEnabled}
          />
        ))}
      </div>
    </DndContext>
  )
}

export const TreeContainer = memo(TreeContainerComponent)
```

#### 2.2 Create Tree Node Component

```typescript
// src/components/file-tree/tree-node.tsx
import { memo, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { TreeNodeProps } from '@/types/file-tree'
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state'
import { ContextMenuWrapper } from '@/contexts/file-tree/context-menu-wrapper'

const TreeNodeComponent = ({
  node,
  contextType,
  level,
  multiSelect = false,
  dragEnabled = true,
  contextMenuEnabled = true
}: TreeNodeProps) => {
  const { expandedNodes, selectedNodes, toggleNode, selectNode } = useTreeStore()

  const isExpanded = expandedNodes.has(node.id)
  const isSelected = selectedNodes.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: node.id,
    disabled: !dragEnabled,
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    disabled: !dragEnabled || node.type !== 'folder',
  })

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      toggleNode(node.id)
    }
  }, [hasChildren, node.id, toggleNode])

  const handleSelect = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    selectNode(node.id, multiSelect && event.metaKey)
  }, [node.id, multiSelect, selectNode])

  const renderIcon = () => {
    if (node.type === 'folder' || node.type === 'link') {
      return <Folder className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const renderExpandIcon = () => {
    if (!hasChildren) return <div className="w-4 h-4" />
    return isExpanded ?
      <ChevronDown className="w-4 h-4" /> :
      <ChevronRight className="w-4 h-4" />
  }

  const nodeContent = (
    <div
      ref={setDropRef}
      className={`
        flex items-center gap-2 px-2 py-1 rounded cursor-pointer
        hover:bg-muted/50 transition-colors
        ${isSelected ? 'bg-primary/10' : ''}
        ${level > 0 ? `ml-${level * 4}` : ''}
      `}
      onClick={handleSelect}
      {...(dragEnabled ? { ref: setDragRef, ...attributes, ...listeners } : {})}
    >
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-4 h-4 hover:bg-muted rounded"
      >
        {renderExpandIcon()}
      </button>
      {renderIcon()}
      <span className="flex-1 truncate">{node.name}</span>
    </div>
  )

  return (
    <div>
      {contextMenuEnabled ? (
        <ContextMenuWrapper contextType={contextType} node={node}>
          {nodeContent}
        </ContextMenuWrapper>
      ) : (
        nodeContent
      )}

      {isExpanded && hasChildren && (
        <div className="ml-4">
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              contextType={contextType}
              level={level + 1}
              multiSelect={multiSelect}
              dragEnabled={dragEnabled}
              contextMenuEnabled={contextMenuEnabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const TreeNode = memo(TreeNodeComponent)
```

### Phase 3: Context Menu System (Week 3)

#### 3.1 Create Context Menu Wrapper

```typescript
// src/contexts/file-tree/context-menu-wrapper.tsx
import { memo } from 'react'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@/components/ui/shadcn/context-menu'
import { WorkspaceContextMenu } from './workspace-context'
import { FilesContextMenu } from './files-context'
import { UploadContextMenu } from './upload-context'
import { TreeNode } from '@/lib/supabase/types'

interface ContextMenuWrapperProps {
  contextType: 'workspace' | 'files' | 'upload'
  node: TreeNode
  children: React.ReactNode
}

const ContextMenuWrapperComponent = ({
  contextType,
  node,
  children,
}: ContextMenuWrapperProps) => {
  const renderContextMenu = () => {
    switch (contextType) {
      case 'workspace':
        return <WorkspaceContextMenu node={node} />
      case 'files':
        return <FilesContextMenu node={node} />
      case 'upload':
        return <UploadContextMenu node={node} />
      default:
        return null
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {renderContextMenu()}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const ContextMenuWrapper = memo(ContextMenuWrapperComponent)
```

#### 3.2 Create Context-Specific Menus

```typescript
// src/contexts/file-tree/workspace-context.tsx
import { memo, useCallback } from 'react'
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/shadcn/context-menu'
import { Download, Trash2, Edit3, FolderPlus } from 'lucide-react'
import { TreeNode } from '@/lib/supabase/types'
import { useTreeActions } from '@/lib/hooks/file-tree/use-tree-actions'

interface WorkspaceContextMenuProps {
  node: TreeNode
}

const WorkspaceContextMenuComponent = ({ node }: WorkspaceContextMenuProps) => {
  const { createFolder, deleteItem } = useTreeActions('workspace')

  const handleCreateFolder = useCallback(() => {
    createFolder.mutate({
      name: 'New Folder',
      parentId: node.type === 'folder' ? node.id : undefined,
    })
  }, [createFolder, node])

  const handleDelete = useCallback(() => {
    deleteItem.mutate(node.id)
  }, [deleteItem, node.id])

  const handleDownload = useCallback(() => {
    // Implementation for download
    console.log('Download', node.name)
  }, [node.name])

  const handleRename = useCallback(() => {
    // Implementation for rename
    console.log('Rename', node.name)
  }, [node.name])

  return (
    <>
      {node.type === 'folder' && (
        <>
          <ContextMenuItem onClick={handleCreateFolder}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Add Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      <ContextMenuItem onClick={handleDownload}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </ContextMenuItem>

      <ContextMenuItem onClick={handleRename}>
        <Edit3 className="w-4 h-4 mr-2" />
        Rename
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleDelete} variant="destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </ContextMenuItem>
    </>
  )
}

export const WorkspaceContextMenu = memo(WorkspaceContextMenuComponent)
```

## Component Usage Examples

### Workspace Usage

```typescript
// In workspace feature
import { TreeContainer } from '@/components/file-tree'
import { useQuery } from '@tanstack/react-query'

const WorkspaceFilesView = () => {
  const { data: workspaceData } = useQuery({
    queryKey: ['workspace-tree'],
    queryFn: fetchWorkspaceTree,
  })

  return (
    <TreeContainer
      contextType="workspace"
      data={workspaceData || []}
      multiSelect={true}
      dragEnabled={true}
      contextMenuEnabled={true}
    />
  )
}
```

### Files Feature Usage

```typescript
// In files feature
import { TreeContainer } from '@/components/file-tree'

const FilesView = () => {
  const { data: linksData } = useQuery({
    queryKey: ['links-tree'],
    queryFn: fetchLinksTree,
  })

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Links panel */}
      <TreeContainer
        contextType="files"
        data={linksData || []}
        multiSelect={true}
        dragEnabled={false}
        contextMenuEnabled={false}
      />

      {/* Mini workspace panel */}
      <TreeContainer
        contextType="workspace"
        data={workspaceData || []}
        multiSelect={true}
        dragEnabled={true}
        contextMenuEnabled={true}
      />
    </div>
  )
}
```

## Testing Strategy

### Unit Tests

```typescript
// src/components/file-tree/__tests__/tree-container.test.tsx
import { render, screen } from '@testing-library/react'
import { TreeContainer } from '../tree-container'
import { mockTreeData } from './mocks'

describe('TreeContainer', () => {
  it('renders tree nodes correctly', () => {
    render(
      <TreeContainer
        contextType="workspace"
        data={mockTreeData}
      />
    )

    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('file1.txt')).toBeInTheDocument()
  })
})
```

## Performance Considerations

### Virtualization for Large Trees

```typescript
// For trees with 1000+ nodes
import { FixedSizeList as List } from 'react-window'

const VirtualizedTreeContainer = ({ data, ...props }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TreeNode node={data[index]} {...props} />
    </div>
  )

  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={32}
    >
      {Row}
    </List>
  )
}
```

## Deployment Checklist

- [ ] All components max 500 lines
- [ ] Types imported from `src/lib/supabase/types`
- [ ] Components in `src/components/file-tree/`
- [ ] Hooks in `src/lib/hooks/file-tree/`
- [ ] Contexts in `src/contexts/file-tree/`
- [ ] Types in `src/types/file-tree/`
- [ ] React Query integration complete
- [ ] Zustand store implemented
- [ ] Context menus working
- [ ] Drag and drop functional
- [ ] Tests passing
- [ ] Performance optimized
- [ ] Accessibility verified
- [ ] Mobile responsive
