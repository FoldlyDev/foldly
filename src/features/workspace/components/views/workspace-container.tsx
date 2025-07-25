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
            <WorkspaceTree
              onTreeReady={setTreeInstance}
              searchQuery={searchQuery}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />
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