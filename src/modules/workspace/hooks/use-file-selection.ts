// =============================================================================
// FILE SELECTION HOOK - Multi-Select State Management
// =============================================================================
// Manages multi-select state for files (checkboxes, bulk actions)
// Pattern: Composable primitive (matches use-link-form-primitives.ts)

import { useState, useCallback } from 'react';

/**
 * File selection state and actions
 */
export interface UseFileSelectionReturn {
  /** Set of selected file IDs */
  selectedFiles: Set<string>;
  /** Whether selection mode is active */
  isSelectMode: boolean;
  /** Enable selection mode */
  enableSelectMode: () => void;
  /** Disable selection mode and clear selections */
  disableSelectMode: () => void;
  /** Toggle selection mode */
  toggleSelectMode: () => void;
  /** Toggle selection for a single file */
  toggleFile: (fileId: string) => void;
  /** Select all files from provided list */
  selectAll: (fileIds: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if a file is selected */
  isFileSelected: (fileId: string) => boolean;
  /** Get count of selected files */
  selectedCount: number;
}

/**
 * Hook for managing file multi-select state
 *
 * @returns File selection state and actions
 *
 * @example
 * ```tsx
 * function FileGrid() {
 *   const selection = useFileSelection();
 *
 *   return (
 *     <>
 *       <button onClick={selection.toggleSelectMode}>
 *         {selection.isSelectMode ? 'Cancel' : 'Select'}
 *       </button>
 *
 *       {files.map(file => (
 *         <FileCard
 *           key={file.id}
 *           file={file}
 *           isSelected={selection.isFileSelected(file.id)}
 *           onSelect={() => selection.toggleFile(file.id)}
 *           showCheckbox={selection.isSelectMode}
 *         />
 *       ))}
 *
 *       {selection.selectedCount > 0 && (
 *         <BulkActionsBar
 *           count={selection.selectedCount}
 *           onDelete={() => handleDelete(selection.selectedFiles)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useFileSelection(): UseFileSelectionReturn {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const enableSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  const disableSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedFiles(new Set());
  }, []);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => !prev);
    if (isSelectMode) {
      // If turning off, clear selections
      setSelectedFiles(new Set());
    }
  }, [isSelectMode]);

  const toggleFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((fileIds: string[]) => {
    setSelectedFiles(new Set(fileIds));
    setIsSelectMode(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const isFileSelected = useCallback(
    (fileId: string) => {
      return selectedFiles.has(fileId);
    },
    [selectedFiles]
  );

  return {
    selectedFiles,
    isSelectMode,
    enableSelectMode,
    disableSelectMode,
    toggleSelectMode,
    toggleFile,
    selectAll,
    clearSelection,
    isFileSelected,
    selectedCount: selectedFiles.size,
  };
}
