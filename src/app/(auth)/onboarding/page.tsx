import { redirect } from 'next/navigation';
import { OnboardingView } from '@/modules/auth';
import { checkOnboardingStatus } from '@/lib/actions';

export default async function OnboardingPage() {
  // Auth check handled by middleware

  const result = await checkOnboardingStatus();

  // If user has a workspace, redirect to dashboard
  if (result.success && result.data?.hasWorkspace) {
    redirect('/dashboard/workspace');
  }

  // User is authenticated but has no workspace, show onboarding
  return <OnboardingView />;
}
