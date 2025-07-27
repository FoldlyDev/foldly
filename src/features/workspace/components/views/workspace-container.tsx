'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';

// Lazy load the heavy WorkspaceTree component
const WorkspaceTree = lazy(() => import('../tree/WorkspaceTree'));

export function WorkspaceContainer() {
  const queryClient = useQueryClient();
  const [isClientReady, setIsClientReady] = useState(false);

  // Ensure QueryClient is available before calling hooks
  useEffect(() => {
    if (queryClient) {
      setIsClientReady(true);
    }
  }, [queryClient]);

  // Get workspace data only when client is ready
  const { data: workspaceData } = useWorkspaceTree();

  // Set up real-time subscription for workspace changes
  const { isSubscribed } = useWorkspaceRealtime(workspaceData?.workspace?.id);

  // Tree instance state
  const [treeInstance, setTreeInstance] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleClearSelection = () => {
    // Clear tree instance selection
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    // Clear local state
    setSelectedItems([]);
  };

  // Show skeleton loader until QueryClient is ready
  if (!isClientReady) {
    const WorkspaceSkeleton = lazy(() =>
      import('../skeletons/workspace-skeleton').then(m => ({
        default: m.WorkspaceSkeleton,
      }))
    );

    return (
      <Suspense
        fallback={<div className='animate-pulse bg-gray-200 h-64 rounded-lg' />}
      >
        <WorkspaceSkeleton />
      </Suspense>
    );
  }

  return (
    <div className='dashboard-container workspace-layout'>
      <div className='workspace-header'>
        <WorkspaceHeader />
      </div>

      <div className='workspace-toolbar'>
        <WorkspaceToolbar
          treeInstance={treeInstance}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedItems={selectedItems}
          onClearSelection={handleClearSelection}
        />
      </div>

      <div className='workspace-tree-container'>
        <div className='workspace-tree-wrapper'>
          <div className='workspace-tree-content'>
            <Suspense
              fallback={
                <div className='flex items-center justify-center h-64'>
                  <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              }
            >
              <WorkspaceTree
                onTreeReady={setTreeInstance}
                searchQuery={searchQuery}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </Suspense>
          </div>

          <div className='workspace-tree-footer'>
            <p className='workspace-tree-footer-text'>
              Drag items to workspace root or between folders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
