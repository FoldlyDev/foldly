// =============================================================================
// TREE NODE - Individual tree node component
// =============================================================================
// 🎯 Reusable tree node with expand/collapse, selection, and context menu

import React, { memo, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Link,
  MoreHorizontal,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import { useNodeDrag, useNodeDrop } from '@/lib/hooks/file-tree/use-tree-drag';
import { ContextMenuWrapper } from '@/contexts/file-tree/context-menu-wrapper';
import { Button } from '@/components/ui/shadcn/button';
import type {
  TreeNode as TreeNodeType,
  TreeNodeProps,
} from '@/types/file-tree';

// =============================================================================
// TREE NODE COMPONENT
// =============================================================================

const TreeNodeComponent: React.FC<
  TreeNodeProps & {
    onSelect?: (nodeId: string) => void;
    onExpand?: (nodeId: string) => void;
    onAction?: (action: string, nodeId: string) => void;
    maxDepth?: number;
  }
> = ({
  node,
  contextType,
  level,
  multiSelect = false,
  dragEnabled = true,
  contextMenuEnabled = true,
  maxDepth = 10,
  onSelect,
  onExpand,
  onAction,
  className = '',
}) => {
  const {
    expandedNodes,
    selectedNodes,
    loadingNodes,
    toggleNode,
    selectNode,
    showContextMenu,
  } = useTreeStore();

  // =============================================================================
  // NODE STATE
  // =============================================================================

  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodes.has(node.id);
  const isLoading = loadingNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren && node.type !== 'file';

  // =============================================================================
  // DRAG AND DROP
  // =============================================================================

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: node.id,
    disabled: !dragEnabled,
    data: {
      type: 'tree-node',
      node,
    },
  });

  const { isDragging: isNodeDragging } = useNodeDrag(node, dragEnabled);
  const { setNodeRef: setDropRef, isDragOver } = useNodeDrop(node, dragEnabled);

  const isDragging = isSortableDragging || isNodeDragging;

  // =============================================================================
  // STYLES
  // =============================================================================

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const nodeClasses = useMemo(() => {
    return [
      'tree-node',
      'group',
      'relative',
      'select-none',
      'rounded-md',
      'transition-all',
      'duration-200',
      'ease-in-out',

      // Interaction states
      'hover:bg-muted/50',
      'focus:bg-muted/50',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2',

      // Selection state
      isSelected && 'bg-primary/10 border-primary/20',

      // Drag states
      isDragging && 'opacity-50 scale-95',
      isDragOver && 'bg-primary/5 border-primary/30',

      // Loading state
      isLoading && 'opacity-75',

      // Custom classes
      className,
    ]
      .filter(Boolean)
      .join(' ');
  }, [isSelected, isDragging, isDragOver, isLoading, className]);

  const contentClasses = useMemo(() => {
    return [
      'flex',
      'items-center',
      'gap-2',
      'px-2',
      'py-1.5',
      'w-full',
      'text-left',
      'text-sm',
      level > 0 && `ml-${Math.min(level * 4, 12)}`,
    ]
      .filter(Boolean)
      .join(' ');
  }, [level]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (canExpand) {
        toggleNode(node.id);
        onExpand?.(node.id);
      }
    },
    [canExpand, node.id, toggleNode, onExpand]
  );

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      const isMultiSelect = multiSelect && (event.metaKey || event.ctrlKey);
      selectNode(node.id, isMultiSelect);
      onSelect?.(node.id);
    },
    [node.id, multiSelect, selectNode, onSelect]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (contextMenuEnabled) {
        showContextMenu(node.id, { x: event.clientX, y: event.clientY });
      }
    },
    [contextMenuEnabled, node.id, showContextMenu]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSelect(event as any);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (canExpand && !isExpanded) {
            handleToggle(event as any);
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (canExpand && isExpanded) {
            handleToggle(event as any);
          }
          break;
      }
    },
    [canExpand, isExpanded, handleSelect, handleToggle]
  );

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderExpandIcon = useCallback(() => {
    if (!canExpand) {
      return <div className='w-4 h-4' />;
    }

    if (isLoading) {
      return (
        <div className='w-4 h-4 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-3 w-3 border-b border-current'></div>
        </div>
      );
    }

    return (
      <Button
        variant='ghost'
        size='sm'
        className='w-4 h-4 p-0 hover:bg-muted rounded-sm'
        onClick={handleToggle}
        tabIndex={-1}
      >
        {isExpanded ? (
          <ChevronDown className='w-3 h-3' />
        ) : (
          <ChevronRight className='w-3 h-3' />
        )}
      </Button>
    );
  }, [canExpand, isLoading, isExpanded, handleToggle]);

  const renderNodeIcon = useCallback(() => {
    const iconClass = 'w-4 h-4';

    switch (node.type) {
      case 'folder':
        return <Folder className={iconClass} />;
      case 'file':
        return <File className={iconClass} />;
      case 'link':
        return <Link className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  }, [node.type]);

  const renderNodeActions = useCallback(() => {
    if (!contextMenuEnabled) return null;

    return (
      <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
        <Button
          variant='ghost'
          size='sm'
          className='w-4 h-4 p-0 hover:bg-muted rounded-sm'
          onClick={handleContextMenu}
          tabIndex={-1}
        >
          <MoreHorizontal className='w-3 h-3' />
        </Button>
      </div>
    );
  }, [contextMenuEnabled, handleContextMenu]);

  const renderNodeContent = useCallback(
    () => (
      <div
        ref={node => {
          setSortableRef(node);
          setDropRef(node);
        }}
        className={nodeClasses}
        style={sortableStyle}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role='treeitem'
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={level + 1}
        {...(dragEnabled ? { ...attributes, ...listeners } : {})}
      >
        <div className={contentClasses}>
          {renderExpandIcon()}
          {renderNodeIcon()}
          <span className='flex-1 truncate font-medium'>{node.name}</span>
          {node.size && (
            <span className='text-xs text-muted-foreground'>
              {formatFileSize(node.size)}
            </span>
          )}
          {renderNodeActions()}
        </div>
      </div>
    ),
    [
      setSortableRef,
      setDropRef,
      nodeClasses,
      sortableStyle,
      handleSelect,
      handleContextMenu,
      handleKeyDown,
      canExpand,
      isExpanded,
      isSelected,
      level,
      dragEnabled,
      attributes,
      listeners,
      contentClasses,
      renderExpandIcon,
      renderNodeIcon,
      node.name,
      node.size,
      renderNodeActions,
    ]
  );

  // =============================================================================
  // RENDER CHILDREN
  // =============================================================================

  const renderChildren = useCallback(() => {
    if (!isExpanded || !hasChildren || level >= maxDepth) {
      return null;
    }

    return (
      <div className='children' role='group'>
        {node.children!.map(child => (
          <TreeNodeComponent
            key={child.id}
            node={child}
            contextType={contextType}
            level={level + 1}
            multiSelect={multiSelect}
            dragEnabled={dragEnabled}
            contextMenuEnabled={contextMenuEnabled}
            maxDepth={maxDepth}
            onSelect={onSelect}
            onExpand={onExpand}
            onAction={onAction}
          />
        ))}
      </div>
    );
  }, [
    isExpanded,
    hasChildren,
    level,
    maxDepth,
    node.children,
    contextType,
    multiSelect,
    dragEnabled,
    contextMenuEnabled,
    onSelect,
    onExpand,
    onAction,
  ]);

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  const nodeElement = contextMenuEnabled ? (
    <ContextMenuWrapper contextType={contextType} node={node}>
      {renderNodeContent()}
    </ContextMenuWrapper>
  ) : (
    renderNodeContent()
  );

  return (
    <div className='tree-node-wrapper'>
      {nodeElement}
      {renderChildren()}
    </div>
  );
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const TreeNode = memo(TreeNodeComponent);
export { TreeNodeComponent };

// Default export for convenience
export default TreeNode;
