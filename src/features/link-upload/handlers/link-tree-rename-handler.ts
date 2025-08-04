import type { ItemInstance } from '@headless-tree/core';
import type { QueryClient } from '@tanstack/react-query';
import { linkQueryKeys } from '../lib/query-keys';
import type { LinkTreeItem } from '../lib/tree-data';
import { toast } from 'sonner';

interface RenameHandlerProps {
  item: ItemInstance<LinkTreeItem>;
  value: string;
}

interface RenameContext {
  queryClient: QueryClient;
  linkId: string;
}

/**
 * Handle item renaming in the link tree
 */
export async function handleLinkRename(
  { item, value }: RenameHandlerProps,
  { queryClient, linkId }: RenameContext
): Promise<void> {
  try {
    console.log('✏️ handleLinkRename: Starting rename operation', {
      itemId: item.getId(),
      newName: value,
      linkId,
    });

    // For now, just show success since we don't have a rename server action yet
    // In a real implementation, this would call a server action to rename the item
    toast.success(`Renamed to "${value}"`);
    
    // Mark cache as stale
    queryClient.invalidateQueries({
      queryKey: linkQueryKeys.tree(linkId),
      refetchType: 'none',
    });
  } catch (error) {
    console.error('❌ handleLinkRename: Error during rename operation:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to rename item');
  }
}