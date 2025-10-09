import type { Metadata } from 'next';
import { UserLinks, LinksSkeleton } from '@/modules/links';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { PageFadeRevealEffect } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Links - Foldly',
  description: 'Manage your upload links and collections',
};

export default function LinksPage() {
  return (
    <ModuleErrorBoundary moduleName="links">
      <PageFadeRevealEffect
        isLoading={false}
        loadingComponent={<LinksSkeleton />}
      >
        <UserLinks />
      </PageFadeRevealEffect>
    </ModuleErrorBoundary>
  );
}
