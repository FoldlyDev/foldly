import type { Metadata } from 'next';
import { WorkspaceContainer } from '@/features/workspace';

export const metadata: Metadata = {
  title: 'Dashboard wroskapce | Foldly',
  description:
    'Your file collection dashboard workspace - track links, manage files, and monitor performance',
};

export default function HomePage() {
  // In a real app, you would fetch data here on the server
  // const dashboardData = await getDashboardData();

  return (
    <WorkspaceContainer
    // data={dashboardData}
    // isLoading={false}
    // error={null}
    />
  );
}
