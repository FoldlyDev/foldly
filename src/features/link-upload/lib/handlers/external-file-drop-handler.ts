'use client';

import { useCallback, useState } from 'react';
import { useLinkUploadStagingStore } from '../../stores/staging-store';

/**
 * External File Drop Handler Hook for Link Upload
 * Manages file drops from outside the application (desktop, file explorer, etc.)
 * 
 * Responsibilities:
 * - Handle files dropped from desktop/file explorer
 * - Store dropped files and target folder information
 * - Open upload modal with dropped files
 * - Clear dropped files state after modal closes
 * 
 * Note: Follows workspace pattern - modal handles adding to staging
 */

export interface DroppedFilesInfo {
  files: File[];
  targetFolderId: string | null;
}

interface UseExternalFileDropHandlerProps {
  linkId: string;
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
  linkId,
}: UseExternalFileDropHandlerProps): ExternalFileDropHandler {
  
  // State to store dropped files information
  const [droppedFiles, setDroppedFiles] = useState<DroppedFilesInfo | null>(null);
  
  // Get modal actions from staging store
  const { openUploadModal } = useLinkUploadStagingStore();
  
  /**
   * Handle external file drops from outside the application
   */
  const handleExternalFileDrop = useCallback((
    files: File[],
    targetFolderId: string | null,
    folderStructure?: { [folder: string]: File[] }
  ) => {
    console.log('📁 [LinkUpload] External files dropped:', {
      fileCount: files.length,
      targetFolderId,
      hasFolderStructure: !!folderStructure,
    });
    
    // Store dropped files for processing
    setDroppedFiles({ files, targetFolderId });
    
    // TODO: Handle folder structure by creating folders first if needed
    if (folderStructure) {
      // In the future, we could automatically create the folder structure
      // For now, we'll just upload all files to the target folder
    }
    
    // Open upload modal to handle the files
    // The modal will receive the files as initialFiles prop
    openUploadModal(targetFolderId || linkId);
  }, [linkId, openUploadModal]);

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