'use client';

import { useState, useEffect } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { ContentLoader } from '@/components/ui';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import WorkspaceTree from '../tree/WorkspaceTree';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import type { WorkspaceTreeItem } from '@/features/workspace/types/tree';

export function WorkspaceContainer() {
  // Get workspace data
  const { data: workspaceData, isLoading } = useWorkspaceTree();

  // Set up real-time subscription for workspace changes
  const { isSubscribed } = useWorkspaceRealtime(workspaceData?.workspace?.id);

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <WorkspaceHeader />
      <WorkspaceToolbar />

      <div className='flex h-[calc(100vh-120px)]'>
        {/* Tree sidebar */}
        <div className='w-full border-r border-border bg-background/50 backdrop-blur-sm p-4'>
          <WorkspaceTree />
        </div>
      </div>
    </div>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
