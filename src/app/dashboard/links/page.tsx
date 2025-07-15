import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { LinksContainer } from '@/features/links';
import { linksQueryKeys } from '@/features/links/lib/query-keys';
import { fetchLinksAction } from '@/features/links/lib/actions/fetch';
import { getQueryClient } from '@/lib/config/query-client';

export const metadata: Metadata = {
  title: 'Links - Foldly',
  description: 'Manage your upload links and collections',
};

export default async function LinksPage() {
  // Server-side query client for SSR prefetching
  const queryClient = getQueryClient();

  // Prefetch links data on the server
  await queryClient.prefetchQuery({
    queryKey: linksQueryKeys.list(),
    queryFn: async () => {
      const result = await fetchLinksAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LinksContainer />
    </HydrationBoundary>
  );
}
