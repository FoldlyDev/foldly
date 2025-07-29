'use client';

import { useState, lazy, Suspense } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { WorkspaceSkeleton } from '../skeletons/workspace-skeleton';

// Lazy load the heavy WorkspaceTree component
const WorkspaceTree = lazy(() => import('../tree/WorkspaceTree'));

export function WorkspaceContainer() {
  // Get workspace data with loading states
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceTree();

  // Set up real-time subscription for workspace changes
  useWorkspaceRealtime(workspaceData?.workspace?.id);

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

  // Show skeleton while loading
  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <div className='dashboard-container workspace-layout'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-red-600 mb-2'>
              Failed to load workspace
            </h3>
            <p className='text-gray-600 mb-4'>
              {error?.message ||
                'An error occurred while loading your workspace'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
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
