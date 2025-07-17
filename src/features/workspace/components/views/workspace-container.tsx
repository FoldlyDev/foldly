'use client';

import { useState, useEffect } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import WorkspaceTree from '../tree/WorkspaceTree';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useSelectMode } from '@/features/workspace/hooks/use-select-mode';
import type { WorkspaceTreeItem } from '@/features/workspace/types/tree';

export function WorkspaceContainer() {
  // Get workspace data
  const { data: workspaceData, isLoading } = useWorkspaceTree();

  // Set up real-time subscription for workspace changes
  const { isSubscribed } = useWorkspaceRealtime(workspaceData?.workspace?.id);

  // Select mode state - shared between toolbar and tree
  const selectMode = useSelectMode();

  // Tree instance state
  const [treeInstance, setTreeInstance] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='home-container w-full h-screen mx-auto bg-[var(--neutral-50)] flex flex-col'>
      <WorkspaceHeader />
      <WorkspaceToolbar
        selectMode={selectMode}
        treeInstance={treeInstance}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Enhanced tree container with better space and accessibility */}
      <div className='flex-1 w-full max-w-md p-6 overflow-hidden flex flex-col'>
        <div className='flex-1 min-h-0 bg-white rounded-lg border border-[var(--neutral-200)] shadow-sm p-4'>
          <WorkspaceTree
            selectMode={selectMode}
            onTreeReady={setTreeInstance}
            searchQuery={searchQuery}
          />
        </div>

        {/* Root drop zone indicator for better UX */}
        <div className='mt-2 text-xs text-muted-foreground text-center'>
          Drag items to workspace root or between folders
        </div>
      </div>
    </div>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
