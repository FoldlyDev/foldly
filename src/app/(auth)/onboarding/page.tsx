import { redirect } from 'next/navigation';
import { OnboardingContainer } from '@/features/onboarding';
import { checkOnboardingStatusAction } from '@/features/onboarding/lib/actions';

export default async function OnboardingPage() {
  // Auth check handled by middleware

  const status = await checkOnboardingStatusAction();

  // If user has a workspace, redirect to dashboard
  if (status.hasWorkspace) {
    redirect('/dashboard/workspace');
  }

  // User is authenticated but has no workspace, show onboarding
  return <OnboardingContainer />;
}
