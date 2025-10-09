import type { Metadata } from 'next';
import { UserSettings, SettingsSkeleton } from '@/modules/settings';
import { ModuleErrorBoundary } from '@/components/core/ModuleErrorBoundary';
import { FadeTransitionWrapper } from '@/components/layout/PageFadeRevealEffect';

export const metadata: Metadata = {
  title: 'Settings | Foldly',
  description: 'Manage your account, profile, and security settings with Clerk',
};

export default function SettingsPage() {
  return (
    <ModuleErrorBoundary moduleName="settings">
      <FadeTransitionWrapper
        isLoading={false}
        loadingComponent={<SettingsSkeleton />}
      >
        <UserSettings />
      </FadeTransitionWrapper>
    </ModuleErrorBoundary>
  );
}
