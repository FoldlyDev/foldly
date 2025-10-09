import { DashboardLayoutWrapper } from "@/components/layout/DashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check handled by middleware

  // Check if user has completed onboarding
  // const onboardingStatus = await checkOnboardingStatusAction();

  // If user hasn't completed onboarding (no workspace), redirect to onboarding
  // if (!onboardingStatus.hasWorkspace) {
  //   redirect('/onboarding');
  // }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
