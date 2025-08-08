import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useGeneratingLinksStore } from '../store/generating-links-store';

async function fetchFoldersWithLinksAction(): Promise<string[]> {
  const response = await fetch('/api/workspace/folders-with-links');
  if (!response.ok) {
    throw new Error('Failed to fetch folders with links');
  }
  const data = await response.json();
  return data.folderIds || [];
}

export function useFoldersWithLinks() {
  const { userId } = useAuth();
  const setFoldersWithLinks = useGeneratingLinksStore((state) => state.setFoldersWithLinks);
  
  return useQuery({
    queryKey: ['folders-with-links', userId],
    queryFn: async () => {
      const folderIds = await fetchFoldersWithLinksAction();
      setFoldersWithLinks(folderIds);
      return folderIds;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}