'use client';

import { useCallback, useState } from 'react';
import { useWorkspaceModalStore } from '@/features/workspace/stores/workspace-modal-store';

/**
 * External File Drop Handler Hook
 * Manages file drops from outside the application (desktop, file explorer, etc.)
 * 
 * Responsibilities:
 * - Handle files dropped from desktop/file explorer into the workspace
 * - Store dropped files and target folder information
 * - Open upload modal with dropped files
 * - Clear dropped files state after modal closes
 * - Future: Handle folder structure creation
 * 
 * Note: This is different from drag-drop-handler which handles internal tree item movements
 */

export interface DroppedFilesInfo {
  files: File[];
  targetFolderId: string | null;
}

interface UseExternalFileDropHandlerProps {
  workspaceId?: string;
}

interface ExternalFileDropHandler {
  droppedFiles: DroppedFilesInfo | null;
  setDroppedFiles: (files: DroppedFilesInfo | null) => void;
  handleExternalFileDrop: (
    files: File[], 
    targetFolderId: string | null, 
    folderStructure?: { [folder: string]: File[] }
  ) => void;
  clearDroppedFiles: () => void;
}

export function useExternalFileDropHandler({
  workspaceId,
}: UseExternalFileDropHandlerProps): ExternalFileDropHandler {
  
  // State to store dropped files information
  const [droppedFiles, setDroppedFiles] = useState<DroppedFilesInfo | null>(null);

  /**
   * Handle external file drops from outside the application
   */
  const handleExternalFileDrop = useCallback((
    files: File[],
    targetFolderId: string | null,
    folderStructure?: { [folder: string]: File[] }
  ) => {
    
    // Store dropped files for processing
    setDroppedFiles({ files, targetFolderId });
    
    // TODO: Handle folder structure by creating folders first if needed
    if (folderStructure) {
      // In the future, we could automatically create the folder structure
      // For now, we'll just upload all files to the target folder
    }
    
    // Open upload modal to handle the files
    // Access the store directly since we're in a callback
    useWorkspaceModalStore.getState().openUploadModal(workspaceId, targetFolderId || undefined);
  }, [workspaceId]);

  /**
   * Clear dropped files state
   */
  const clearDroppedFiles = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  return {
    droppedFiles,
    setDroppedFiles,
    handleExternalFileDrop,
    clearDroppedFiles,
  };
}