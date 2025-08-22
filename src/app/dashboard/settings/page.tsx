import type { Metadata } from 'next';
import { SettingsContainer } from '@/features/settings';

export const metadata: Metadata = {
  title: 'Settings | Foldly',
  description: 'Manage your account, profile, and security settings with Clerk',
};

export default function SettingsPage() {
  return <SettingsContainer />;
}
