import type { Metadata } from 'next';
import { UserWorkspace, WorkspaceSkeleton } from '@/modules/workspace';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { PageFadeRevealEffect } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Dashboard Workspace | Foldly',
  description:
    'Your file collection dashboard workspace - track links, manage files, and monitor performance',
};

export default function WorkspacePage() {
  return (
    <ModuleErrorBoundary moduleName="workspace">
      <PageFadeRevealEffect
        isLoading={false}
        loadingComponent={<WorkspaceSkeleton />}
      >
        <UserWorkspace />
      </PageFadeRevealEffect>
    </ModuleErrorBoundary>
  );
}
