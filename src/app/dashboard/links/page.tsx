import type { Metadata } from 'next';
import { LinksContainer } from '@/components/features/links/links-container';

export default function LinksPage() {
  // In a real app, you would fetch data here on the server
  // const linksData = await getLinksData();

  return (
    <LinksContainer
    // initialData={linksData}
    // isLoading={false}
    // error={null}
    />
  );
}
