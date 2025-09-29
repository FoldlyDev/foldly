import type { Metadata } from 'next';
import { WorkspaceContainer } from '@/features/workspace/components/views/workspace-container';
import { WorkspaceErrorBoundary } from '@/features/workspace/components/ui/workspace-error-boundary';

export const metadata: Metadata = {
  title: 'Dashboard Workspace | Foldly',
  description:
    'Your file collection dashboard workspace - track links, manage files, and monitor performance',
};

export default function WorkspacePage() {
  return (
    <WorkspaceErrorBoundary>
      <WorkspaceContainer />
    </WorkspaceErrorBoundary>
  );
}
