import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayoutWrapper } from '@/components/layout/dashboard-layout-wrapper';
import { checkOnboardingStatusAction } from '@/features/onboarding/lib/actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/unauthorized');
  }

  // Check if user has completed onboarding
  const onboardingStatus = await checkOnboardingStatusAction();

  // If user hasn't completed onboarding (no workspace), redirect to onboarding
  if (!onboardingStatus.hasWorkspace) {
    redirect('/onboarding');
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
