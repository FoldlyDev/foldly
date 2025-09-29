'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkDeleteLinksAction } from '../../lib/actions/delete';
import { linksQueryKeys } from '../../lib/query-keys';
import { toast } from 'sonner';

export function useBulkDeleteLinksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkIds: string[]) => {
      const result = await bulkDeleteLinksAction(linkIds);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete links');
      }
      
      return result;
    },
    onSuccess: (_, linkIds) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      
      toast.success(
        `Successfully deleted ${linkIds.length} link${linkIds.length > 1 ? 's' : ''}`
      );
    },
    onError: (error: Error) => {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Failed to delete links');
    },
  });
}