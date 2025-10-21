import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { checkOnboardingStatus } from '@/lib/actions';

export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check handled by middleware

  // Check if user has completed onboarding
  const result = await checkOnboardingStatus();

  // If user hasn't completed onboarding (no workspace), redirect to onboarding
  if (!result.success || !result.data?.hasWorkspace) {
    redirect('/onboarding');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
