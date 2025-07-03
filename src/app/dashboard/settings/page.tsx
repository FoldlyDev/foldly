import type { Metadata } from 'next';
import { SettingsContainer } from '@/components/features/settings';

export const metadata: Metadata = {
  title: 'Settings | Foldly',
  description: 'Manage your account, privacy, and notification preferences',
};

export default function SettingsPage() {
  // In a real app, you would fetch data here on the server
  // const settingsData = await getSettingsData();

  return (
    <SettingsContainer
    // initialData={settingsData}
    // isLoading={false}
    // error={null}
    />
  );
}
