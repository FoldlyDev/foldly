// =============================================================================
// FOLDER NAVIGATION HOOK - Breadcrumb State Management
// =============================================================================
// Manages current folder navigation state and breadcrumb hierarchy
// Uses global useFolderHierarchy hook for data fetching

import { useState, useCallback } from 'react';
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
 * Hook for managing folder navigation state
 * Integrates with global useFolderHierarchy hook for breadcrumb data
 *
 * @param initialFolderId - Initial folder ID to navigate to
 * @returns Folder navigation state and actions
 *
 * @example
 * ```tsx
 * function FolderBreadcrumb() {
 *   const nav = useFolderNavigation();
 *
 *   return (
 *     <nav>
 *       <button onClick={nav.navigateToRoot}>Root</button>
 *       {nav.hierarchy?.map(folder => (
 *         <button key={folder.id} onClick={() => nav.navigateToFolder(folder.id)}>
 *           / {folder.name}
 *         </button>
 *       ))}
 *     </nav>
 *   );
 * }
 *
 * function FileGrid() {
 *   const nav = useFolderNavigation();
 *   const { data: files } = useFolderFiles(nav.currentFolderId);
 *
 *   return (
 *     <>
 *       <FolderBreadcrumb />
 *       {files?.map(file => <FileCard key={file.id} file={file} />)}
 *     </>
 *   );
 * }
 * ```
 */
export function useFolderNavigation(
  initialFolderId: string | null = null
): UseFolderNavigationReturn {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);

  // Fetch folder hierarchy for breadcrumb
  const { data: hierarchy, isLoading: isLoadingHierarchy } = useFolderHierarchy(
    currentFolderId || '', // Empty string when null (query will be disabled)
    {
      enabled: !!currentFolderId, // Only fetch when not at root
    }
  );

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(null);
  }, []);

  const navigateToParent = useCallback(() => {
    if (hierarchy && hierarchy.length > 1) {
      // Navigate to parent (second-to-last in hierarchy)
      const parent = hierarchy[hierarchy.length - 2];
      setCurrentFolderId(parent?.id || null);
    } else {
      // No parent, go to root
      setCurrentFolderId(null);
    }
  }, [hierarchy]);

  return {
    currentFolderId,
    navigateToFolder,
    navigateToRoot,
    navigateToParent,
    hierarchy,
    isLoadingHierarchy,
  };
}
