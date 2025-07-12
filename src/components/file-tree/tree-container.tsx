// =============================================================================
// TREE CONTAINER - Main container component for file tree
// =============================================================================
// 🎯 Universal tree container with drag-and-drop and context menu support

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { TreeNode } from './tree-node';
import { useTreeDrag } from '@/lib/hooks/file-tree/use-tree-drag';
import { useTreeStore } from '@/lib/hooks/file-tree/use-tree-state';
import type { TreeContainerProps } from '@/types/file-tree';

// =============================================================================
// TREE CONTAINER COMPONENT
// =============================================================================

const TreeContainerComponent: React.FC<TreeContainerProps> = ({
  contextType,
  data,
  onNodeSelect,
  onNodeExpand,
  onNodeAction,
  multiSelect = false,
  dragEnabled = true,
  contextMenuEnabled = true,
  maxDepth = 10,
  className = '',
  loading = false,
  empty = {
    message: 'No files or folders',
    icon: null,
  },
}) => {
  const { reset } = useTreeStore();

  const {
    draggedItems,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    collisionDetection,
    getDragOverlay,
  } = useTreeDrag(contextType, undefined, data);

  // =============================================================================
  // COMPONENT LIFECYCLE
  // =============================================================================

  // Reset tree state when component unmounts
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId);
    },
    [onNodeSelect]
  );

  const handleNodeExpand = useCallback(
    (nodeId: string) => {
      onNodeExpand?.(nodeId);
    },
    [onNodeExpand]
  );

  const handleNodeAction = useCallback(
    (action: string, nodeId: string) => {
      onNodeAction?.(action, nodeId);
    },
    [onNodeAction]
  );

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderEmptyState = useCallback(
    () => (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        {empty.icon && (
          <div className='mb-3 text-4xl opacity-50'>{empty.icon}</div>
        )}
        <p className='text-muted-foreground text-sm'>{empty.message}</p>
      </div>
    ),
    [empty]
  );

  const renderLoadingState = useCallback(
    () => (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
      </div>
    ),
    []
  );

  // =============================================================================
  // SORTABLE CONTEXT
  // =============================================================================

  const sortableIds = useMemo(() => {
    return data.map(node => node.id);
  }, [data]);

  // =============================================================================
  // RENDER TREE NODES
  // =============================================================================

  const renderTreeNodes = useCallback(() => {
    if (loading) return renderLoadingState();
    if (!data || data.length === 0) return renderEmptyState();

    return data.map(node => (
      <TreeNode
        key={node.id}
        node={node}
        contextType={contextType}
        level={0}
        multiSelect={multiSelect}
        dragEnabled={dragEnabled}
        contextMenuEnabled={contextMenuEnabled}
        maxDepth={maxDepth}
        onSelect={handleNodeSelect}
        onExpand={handleNodeExpand}
        onAction={handleNodeAction}
      />
    ));
  }, [
    loading,
    data,
    contextType,
    multiSelect,
    dragEnabled,
    contextMenuEnabled,
    maxDepth,
    handleNodeSelect,
    handleNodeExpand,
    handleNodeAction,
    renderLoadingState,
    renderEmptyState,
  ]);

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  const containerClasses = useMemo(() => {
    return [
      'file-tree',
      'relative',
      'w-full',
      'h-full',
      'overflow-auto',
      'focus:outline-none',
      isDragging && 'select-none',
      className,
    ]
      .filter(Boolean)
      .join(' ');
  }, [isDragging, className]);

  if (!dragEnabled) {
    return (
      <div className={containerClasses}>
        <div className='space-y-0.5'>{renderTreeNodes()}</div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={containerClasses}>
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-0.5'>{renderTreeNodes()}</div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>{isDragging && getDragOverlay()}</DragOverlay>
      </div>
    </DndContext>
  );
};

// =============================================================================
// TREE CONTAINER VARIANTS
// =============================================================================

/**
 * Workspace Tree Container
 */
export const WorkspaceTreeContainer: React.FC<
  Omit<TreeContainerProps, 'contextType'>
> = props => (
  <TreeContainerComponent
    {...props}
    contextType='workspace'
    multiSelect={props.multiSelect ?? true}
    dragEnabled={props.dragEnabled ?? true}
    contextMenuEnabled={props.contextMenuEnabled ?? true}
    empty={{
      message: 'No files or folders in workspace',
      icon: '📁',
      ...props.empty,
    }}
  />
);

/**
 * Files Tree Container
 */
export const FilesTreeContainer: React.FC<
  Omit<TreeContainerProps, 'contextType'>
> = props => (
  <TreeContainerComponent
    {...props}
    contextType='files'
    multiSelect={props.multiSelect ?? true}
    dragEnabled={props.dragEnabled ?? false}
    contextMenuEnabled={props.contextMenuEnabled ?? false}
    empty={{
      message: 'No links selected',
      icon: '🔗',
      ...props.empty,
    }}
  />
);

/**
 * Upload Tree Container
 */
export const UploadTreeContainer: React.FC<
  Omit<TreeContainerProps, 'contextType'>
> = props => (
  <TreeContainerComponent
    {...props}
    contextType='upload'
    multiSelect={props.multiSelect ?? true}
    dragEnabled={props.dragEnabled ?? true}
    contextMenuEnabled={props.contextMenuEnabled ?? true}
    maxDepth={props.maxDepth ?? 5}
    empty={{
      message: 'No files to upload',
      icon: '📤',
      ...props.empty,
    }}
  />
);

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export const TreeContainer = memo(TreeContainerComponent);
export { TreeContainerComponent };

// Default export for convenience
export default TreeContainer;
