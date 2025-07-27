import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayoutWrapper } from '@/components/ui/layout/dashboard-layout-wrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/unauthorized');
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
