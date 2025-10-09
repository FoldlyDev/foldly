import type { Metadata } from 'next';
import { UserLinks, LinksSkeleton } from '@/modules/links';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { FadeTransitionWrapper } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Links - Foldly',
  description: 'Manage your upload links and collections',
};

export default function LinksPage() {
  return (
    <ModuleErrorBoundary moduleName="links">
      <FadeTransitionWrapper
        isLoading={false}
        loadingComponent={<LinksSkeleton />}
      >
        <UserLinks />
      </FadeTransitionWrapper>
    </ModuleErrorBoundary>
  );
}
