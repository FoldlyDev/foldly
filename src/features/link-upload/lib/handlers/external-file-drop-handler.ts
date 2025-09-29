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
      folderStructureKeys: folderStructure ? Object.keys(folderStructure) : []
    });
    
    // Get staging store functions
    const { addStagedFolder, addStagedFiles } = useLinkUploadStagingStore.getState();
    
    // If we have a folder structure, create the folders and add files to them
    if (folderStructure && Object.keys(folderStructure).length > 0) {
      // Create a map to track created folder IDs
      const folderIdMap = new Map<string, string>();
      
      // Sort folder paths by depth to create parents before children
      const folderPaths = Object.keys(folderStructure).sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        return depthA - depthB;
      });
      
      // Create folders and add files
      folderPaths.forEach(folderPath => {
        const filesInFolder = folderStructure[folderPath];
        if (!filesInFolder || filesInFolder.length === 0) return; // Skip empty folders
        
        // Parse the folder path to get folder names
        const pathParts = folderPath.split('/').filter(p => p);
        let currentParentId = targetFolderId;
        
        // Create nested folder structure
        pathParts.forEach((folderName, index) => {
          const pathUpToHere = pathParts.slice(0, index + 1).join('/');
          
          // Check if this folder was already created
          if (!folderIdMap.has(pathUpToHere)) {
            // Create the folder
            const folderId = addStagedFolder(folderName, currentParentId);
            folderIdMap.set(pathUpToHere, folderId);
            console.log('Created staged folder:', { folderName, folderId, parentId: currentParentId });
          }
          
          // Update parent for next iteration
          currentParentId = folderIdMap.get(pathUpToHere)!;
        });
        
        // Add files to the deepest folder in this path
        const finalFolderId = folderIdMap.get(folderPath);
        if (finalFolderId && filesInFolder.length > 0) {
          addStagedFiles(filesInFolder, finalFolderId);
          console.log('Added files to folder:', { 
            folderPath, 
            folderId: finalFolderId, 
            fileCount: filesInFolder.length 
          });
        }
      });
      
      // Don't open modal - files are already staged
      // The tree will update automatically through the staging store
    } else {
      // No folder structure - just add files directly
      // Store dropped files for processing via modal
      setDroppedFiles({ files, targetFolderId });
      
      // Open upload modal to handle the files
      // The modal will receive the files as initialFiles prop
      openUploadModal(targetFolderId || linkId);
    }
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