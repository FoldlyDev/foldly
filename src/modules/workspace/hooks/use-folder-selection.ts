// =============================================================================
// FOLDER SELECTION HOOK - Multi-Select State Management
// =============================================================================
// Manages multi-select state for folders (checkboxes, bulk actions)
// Pattern: Composable primitive (matches use-file-selection.ts)

import { useState, useCallback } from 'react';

/**
 * Folder selection state and actions
 */
export interface UseFolderSelectionReturn {
  /** Set of selected folder IDs */
  selectedFolders: Set<string>;
  /** Whether selection mode is active */
  isSelectMode: boolean;
  /** Enable selection mode */
  enableSelectMode: () => void;
  /** Disable selection mode and clear selections */
  disableSelectMode: () => void;
  /** Toggle selection mode */
  toggleSelectMode: () => void;
  /** Toggle selection for a single folder */
  toggleFolder: (folderId: string) => void;
  /** Select all folders from provided list */
  selectAll: (folderIds: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if a folder is selected */
  isFolderSelected: (folderId: string) => boolean;
  /** Get count of selected folders */
  selectedCount: number;
}

/**
 * Hook for managing folder multi-select state
 *
 * @returns Folder selection state and actions
 *
 * @example
 * ```tsx
 * function FolderGrid() {
 *   const selection = useFolderSelection();
 *
 *   return (
 *     <>
 *       <button onClick={selection.toggleSelectMode}>
 *         {selection.isSelectMode ? 'Cancel' : 'Select'}
 *       </button>
 *
 *       {folders.map(folder => (
 *         <FolderCard
 *           key={folder.id}
 *           folder={folder}
 *           isSelected={selection.isFolderSelected(folder.id)}
 *           onSelect={() => selection.toggleFolder(folder.id)}
 *           showCheckbox={selection.isSelectMode}
 *         />
 *       ))}
 *
 *       {selection.selectedCount > 0 && (
 *         <BulkActionsBar
 *           count={selection.selectedCount}
 *           onDelete={() => handleDelete(selection.selectedFolders)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useFolderSelection(): UseFolderSelectionReturn {
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const enableSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  const disableSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedFolders(new Set());
  }, []);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => !prev);
    if (isSelectMode) {
      // If turning off, clear selections
      setSelectedFolders(new Set());
    }
  }, [isSelectMode]);

  const toggleFolder = useCallback((folderId: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((folderIds: string[]) => {
    setSelectedFolders(new Set(folderIds));
    setIsSelectMode(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFolders(new Set());
  }, []);

  const isFolderSelected = useCallback(
    (folderId: string) => {
      return selectedFolders.has(folderId);
    },
    [selectedFolders]
  );

  return {
    selectedFolders,
    isSelectMode,
    enableSelectMode,
    disableSelectMode,
    toggleSelectMode,
    toggleFolder,
    selectAll,
    clearSelection,
    isFolderSelected,
    selectedCount: selectedFolders.size,
  };
}
