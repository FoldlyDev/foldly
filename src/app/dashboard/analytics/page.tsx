import type { Metadata } from 'next';
import { AnalyticsContainer } from '@/features/analytics';

export const metadata: Metadata = {
  title: 'Analytics & Insights | Foldly',
  description: 'Track your file collection performance and growth metrics',
};

export default function AnalyticsPage() {
  // In a real app, you would fetch data here on the server
  // const analyticsData = await getAnalyticsData();

  return (
    <AnalyticsContainer
    // data={analyticsData}
    // isLoading={false}
    // error={null}
    />
  );
}
