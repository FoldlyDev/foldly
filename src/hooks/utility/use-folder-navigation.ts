// =============================================================================
// FOLDER NAVIGATION HOOK - URL-Synced Folder Navigation
// =============================================================================
// Manages current folder navigation state with URL synchronization
// Enables bookmarking, sharing, browser back/forward, and refresh persistence
//
// URL Pattern: /dashboard/workspace?folder=abc-123
//
// Features:
// - Syncs folder state with URL search params
// - Browser back/forward navigation works
// - Shareable folder URLs
// - Refresh persistence
// - Breadcrumb hierarchy data

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useFolderHierarchy } from '@/hooks';

/**
 * Folder navigation state and actions
 */
export interface UseFolderNavigationReturn {
  /** Current folder ID (null = root) */
  currentFolderId: string | null;
  /** Navigate to a specific folder */
  navigateToFolder: (folderId: string | null) => void;
  /** Navigate to root */
  navigateToRoot: () => void;
  /** Navigate to parent folder */
  navigateToParent: () => void;
  /** Folder hierarchy from root to current (for breadcrumb) */
  hierarchy: Awaited<ReturnType<typeof useFolderHierarchy>>['data'];
  /** Whether hierarchy is loading */
  isLoadingHierarchy: boolean;
}

/**
 * Hook for managing folder navigation with URL synchronization
 * Integrates with URL search params for shareable, bookmarkable folder navigation
 *
 * URL Pattern:
 * - Root: /dashboard/workspace
 * - Folder: /dashboard/workspace?folder=abc-123
 *
 * @returns Folder navigation state and actions
 *
 * @example
 * ```tsx
 * function WorkspaceView() {
 *   const nav = useFolderNavigation();
 *   const { data: files } = useFilesByFolder(nav.currentFolderId);
 *
 *   return (
 *     <>
 *       <FolderBreadcrumb
 *         currentFolderId={nav.currentFolderId}
 *         onNavigate={nav.navigateToFolder}
 *       />
 *       {files?.map(file => <FileCard key={file.id} file={file} />)}
 *     </>
 *   );
 * }
 * ```
 */
export function useFolderNavigation(): UseFolderNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL search params
  const folderFromUrl = searchParams?.get('folder') || null;
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(folderFromUrl);

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const folderParam = searchParams?.get('folder') || null;
    if (folderParam !== currentFolderId) {
      setCurrentFolderId(folderParam);
    }
  }, [searchParams, currentFolderId]);

  // Fetch folder hierarchy for breadcrumb
  const { data: hierarchy, isLoading: isLoadingHierarchy } = useFolderHierarchy(
    currentFolderId || '', // Empty string when null (query will be disabled)
    {
      enabled: !!currentFolderId, // Only fetch when not at root
    }
  );

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);

      // Update URL
      if (folderId) {
        // Navigate to folder: add ?folder=id
        router.push(`${pathname}?folder=${folderId}`, { scroll: false });
      } else {
        // Navigate to root: remove query param
        router.push(pathname, { scroll: false });
      }
    },
    [router, pathname]
  );

  const navigateToRoot = useCallback(() => {
    navigateToFolder(null);
  }, [navigateToFolder]);

  const navigateToParent = useCallback(() => {
    if (hierarchy && hierarchy.length > 1) {
      // Navigate to parent (second-to-last in hierarchy)
      const parent = hierarchy[hierarchy.length - 2];
      navigateToFolder(parent?.id || null);
    } else {
      // No parent, go to root
      navigateToRoot();
    }
  }, [hierarchy, navigateToFolder, navigateToRoot]);

  return {
    currentFolderId,
    navigateToFolder,
    navigateToRoot,
    navigateToParent,
    hierarchy,
    isLoadingHierarchy,
  };
}
