import type { Metadata } from 'next';
import { LinksContainer } from '@/features/links';

export const metadata: Metadata = {
  title: 'Links - Foldly',
  description: 'Manage your upload links and collections',
};

export default function LinksPage() {
  return <LinksContainer />;
}
