import type { Metadata } from 'next';
import { HomeContainer } from '@/components/features/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard Home | Foldly',
  description:
    'Your file collection dashboard - track links, manage files, and monitor performance',
};

export default function HomePage() {
  // In a real app, you would fetch data here on the server
  // const dashboardData = await getDashboardData();

  return (
    <HomeContainer
    // data={dashboardData}
    // isLoading={false}
    // error={null}
    />
  );
}
