import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardContainer } from '@/components/features/dashboard';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // TODO: When Supabase is set up, fetch real data here
  // const dashboardData = await fetchDashboardData(userId);

  return (
    <DashboardContainer
      // data={dashboardData} // Will be used when Supabase is connected
      isLoading={false}
      error={null}
    />
  );
}
