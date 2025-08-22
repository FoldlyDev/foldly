import { useQuery } from '@tanstack/react-query';
import { fetchPublicFilesAction } from '../lib/actions/fetch-public-files';
import type { FileTreeNode } from '../types';

export function usePublicFiles(linkId: string) {
  return useQuery<FileTreeNode[]>({
    queryKey: ['public-files', linkId],
    queryFn: async () => {
      const result = await fetchPublicFilesAction({ linkId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch files');
      }
      return result.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}