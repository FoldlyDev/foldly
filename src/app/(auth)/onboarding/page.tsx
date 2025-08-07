import { redirect } from 'next/navigation';
import { OnboardingContainer } from '@/features/onboarding';
import { checkOnboardingStatusAction } from '@/features/onboarding/lib/actions';

export default async function OnboardingPage() {
  const status = await checkOnboardingStatusAction();

  // Redirect to sign-in if not authenticated
  if (!status.authenticated) {
    redirect('/sign-in');
  }

  // If user has a workspace, redirect to dashboard
  if (status.hasWorkspace) {
    redirect('/dashboard/workspace');
  }

  // User is authenticated but has no workspace, show onboarding
  return <OnboardingContainer />;
}
