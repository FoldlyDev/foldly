import { redirect } from 'next/navigation';
import { Onboarding } from '@/modules/onboarding';
import { checkOnboardingStatus } from '@/lib/actions';

export default async function OnboardingPage() {
  // Auth check handled by middleware

  const status = await checkOnboardingStatus();

  // If user has a workspace, redirect to dashboard
  if (status.hasWorkspace) {
    redirect('/dashboard/workspace');
  }

  // User is authenticated but has no workspace, show onboarding
  return <Onboarding />;
}
