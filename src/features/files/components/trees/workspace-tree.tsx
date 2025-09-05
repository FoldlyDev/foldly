'use client';

import React, { lazy, Suspense, useMemo } from 'react';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import { useWorkspaceData } from '../../hooks/use-workspace-data';
import { useTreeFactory } from '../../hooks/tree/use-tree-factory';
import { workspaceReadOnlyTreeConfig } from '../../lib/tree-configs/readonly-tree';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

export interface WorkspaceTreeProps {
  onCopyToWorkspace?: (items: any[], targetFolderId: string) => Promise<void>;
  onExternalFileDrop?: (files: File[], targetFolderId?: string) => void;
}

export function WorkspaceTree({ onCopyToWorkspace, onExternalFileDrop }: WorkspaceTreeProps) {
  // Fetch workspace data with React Query
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceData();

  // Transform workspace data to tree format
  const treeData = useMemo(() => {
    if (!workspaceData) return {};
    return transformToTreeStructure(
      workspaceData.folders || [],
      workspaceData.files || [],
      workspaceData.workspace
    );
  }, [workspaceData]);

  // Get initially expanded items (workspace root)
  const initialExpandedItems = useMemo(() => {
    return workspaceData?.workspace?.id ? [workspaceData.workspace.id] : [];
  }, [workspaceData?.workspace?.id]);

  // Check if workspace has any files or folders - moved before useTreeFactory hook
  const hasContent = useMemo(() => {
    return (workspaceData?.files && workspaceData.files.length > 0) || 
           (workspaceData?.folders && workspaceData.folders.length > 0);
  }, [workspaceData]);

  // Use the tree factory with read-only workspace configuration
  const factoryProps: Parameters<typeof useTreeFactory>[0] = {
    treeId: `files-workspace-${workspaceData?.workspace?.id || 'loading'}`,
    config: workspaceReadOnlyTreeConfig,
    data: treeData,
  };
  
  // Only add onCopyToWorkspace if it's defined
  if (onCopyToWorkspace) {
    factoryProps.onCopyToWorkspace = onCopyToWorkspace;
  }
  
  const { treeProps } = useTreeFactory(factoryProps);

  // Loading state
  if (isLoading) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-loading">
          <div className="files-tree-spinner" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-empty">
          <p className="files-tree-empty-text text-destructive">
            Failed to load workspace: {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state - no workspace data
  if (!workspaceData?.workspace?.id) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-empty">
          <p className="files-tree-empty-text">No workspace data available</p>
        </div>
      </div>
    );
  }

  // Empty workspace - show "No files available" instead of tree with upload highlight
  if (!hasContent) {
    return (
      <div className="files-tree-wrapper">
        <div className="flex flex-col items-center justify-center h-64 p-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Your workspace is a blank canvas
            </p>
            <p className="text-xs text-muted-foreground/70">
              Waiting for your first masterpiece
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="files-tree-wrapper">
      <div className="files-tree-content">
        <Suspense
          fallback={
            <div className="files-tree-loading">
              <div className="files-tree-spinner" />
            </div>
          }
        >
          <FileTree
            {...treeProps}
            initialExpandedItems={initialExpandedItems}
            searchQuery=""
            // Override external file drop if provided (for OS file drops to workspace)
            {...(onExternalFileDrop && { onExternalFileDrop })}
          />
        </Suspense>
      </div>
    </div>
  );
}