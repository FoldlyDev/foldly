import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayoutWrapper } from '@/features/dashboard';

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
