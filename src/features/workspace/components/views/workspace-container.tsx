'use client';

import { useState } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import WorkspaceTree from '../tree/WorkspaceTree';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';

export function WorkspaceContainer() {
  // Get workspace data
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

  return (
    <div className='dashboard-container w-full h-screen mx-auto bg-[var(--neutral-50)] flex flex-col'>
      <WorkspaceHeader />
      <WorkspaceToolbar
        treeInstance={treeInstance}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedItems={selectedItems}
        onClearSelection={handleClearSelection}
      />

      {/* Tree container */}
      <div className='flex-1 w-full max-w-md p-6 overflow-hidden flex flex-col'>
        <div className='flex-1 min-h-0 bg-white rounded-lg border border-[var(--neutral-200)] shadow-sm p-4'>
          <WorkspaceTree
            onTreeReady={setTreeInstance}
            searchQuery={searchQuery}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        </div>

        {/* Root drop zone indicator */}
        <div className='mt-2 text-xs text-muted-foreground text-center'>
          Drag items to workspace root or between folders
        </div>
      </div>
    </div>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;