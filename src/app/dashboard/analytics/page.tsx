import type { Metadata } from 'next';
import { Analytics, AnalyticsSkeleton } from '@/modules/analytics';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { FadeTransitionWrapper } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Analytics & Insights | Foldly',
  description: 'Track your file collection performance and growth metrics',
};

export default function AnalyticsPage() {
  // In a real app, you would fetch data here on the server
  // const analyticsData = await getAnalyticsData();

  return (
    <ModuleErrorBoundary moduleName="analytics">
      <FadeTransitionWrapper
        isLoading={false}
        loadingComponent={<AnalyticsSkeleton />}
      >
        <Analytics
        // data={analyticsData}
        // isLoading={false}
        // error={null}
        />
      </FadeTransitionWrapper>
    </ModuleErrorBoundary>
  );
}
