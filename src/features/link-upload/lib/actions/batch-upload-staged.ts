'use server';

import { createBatchAction, uploadFileAction, completeBatchAction } from './index';
import { createLinkFolderAction } from './link-folder-actions';
import type { BatchUploadPayload, BatchUploadProgress } from '../../types';
import type { DatabaseResult } from '@/lib/database/types/common';

// =============================================================================
// TYPES
// =============================================================================

interface BatchUploadResult {
  success: boolean;
  data?: {
    batchId: string;
    uploadedFiles: number;
    createdFolders: number;
    totalProcessed: number;
  };
  error?: string;
  progress?: BatchUploadProgress;
}

// =============================================================================
// BATCH UPLOAD ACTION - Process All Staged Items
// =============================================================================

/**
 * Upload all staged files and create all staged folders in batch
 * This handles the entire upload process for optimistic UI updates
 */
export async function batchUploadStagedItemsAction(
  payload: BatchUploadPayload
): Promise<BatchUploadResult> {
  try {
    const totalItems = payload.files.length + payload.folders.length;
    let completedItems = 0;
    const errors: Array<{ itemId: string; itemName: string; error: string }> = [];
    const folderIdMap = new Map<string, string>(); // staging ID -> database ID

    // Step 1: Create batch for tracking uploader information
    // We create a batch even for folder-only uploads to track who uploaded them
    let batchId: string | undefined;
    let batchResult: any; // Store batch result for file uploads
    
    // Create a batch if we have files OR folders to upload
    if (payload.files.length > 0 || payload.folders.length > 0) {
      // Get the uploader name from the payload level (set by the modal via staging store)
      const uploaderName = payload.uploaderName || 'Anonymous';
      
      // For folder-only uploads, create a minimal batch
      if (payload.files.length === 0) {
        // Create a batch with no files, just to track the uploader
        batchResult = await createBatchAction({
          linkId: payload.linkId,
          files: [], // Empty files array for folder-only uploads
          uploaderName: uploaderName,
          ...(payload.uploaderEmail && { uploaderEmail: payload.uploaderEmail }),
          ...(payload.uploaderMessage && { uploaderMessage: payload.uploaderMessage }),
        });
      } else {
        // Normal batch creation with files
        batchResult = await createBatchAction({
          linkId: payload.linkId,
          files: payload.files.map(file => ({
            fileName: file.file.name,
            fileSize: file.file.size,
            mimeType: file.file.type,
            uploaderName: file.uploaderName || uploaderName,
          })),
          uploaderName: uploaderName,
          ...(payload.uploaderEmail && { uploaderEmail: payload.uploaderEmail }),
          ...(payload.uploaderMessage && { uploaderMessage: payload.uploaderMessage }),
        });
      }
      
      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Failed to create upload batch');
      }
      
      batchId = batchResult.data.batchId;
    }

    // Step 2: Process folders in hierarchical order (parents before children)
    // First, organize folders by depth level
    const foldersByDepth = new Map<number, typeof payload.folders>();
    const maxDepth = organizeFoldersByDepth(payload.folders, foldersByDepth);
    
    // Process folders level by level, starting from root (depth 0)
    for (let depth = 0; depth <= maxDepth; depth++) {
      const foldersAtDepth = foldersByDepth.get(depth) || [];
      
      // Sort folders at this depth by their sort order if provided
      const sortedFolders = foldersAtDepth.sort((a, b) => {
        const aOrder = (a as any).sortOrder ?? 0;
        const bOrder = (b as any).sortOrder ?? 0;
        return aOrder - bOrder;
      });
      
      for (let i = 0; i < sortedFolders.length; i++) {
        const folder = sortedFolders[i];
        
        try {
          // Resolve parent folder ID from staging ID to database ID
          let parentFolderId = folder.parentFolderId;
          if (parentFolderId && folderIdMap.has(parentFolderId)) {
            parentFolderId = folderIdMap.get(parentFolderId);
          }
          
          // Create folder with sort order
          const result = await createLinkFolderActionWithSortOrder(
            payload.linkId,
            folder.name,
            parentFolderId,
            i, // sortOrder based on position
            batchId // Pass the batchId to associate folder with uploader
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to create folder');
          }
          
          // Map staging ID to database ID for child references
          if (result.data?.folderId) {
            folderIdMap.set(folder.id, result.data.folderId);
          }
          
          completedItems++;
        } catch (error) {
          errors.push({
            itemId: folder.id,
            itemName: folder.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          completedItems++;
        }
      }
    }

    // Step 3: Upload all files grouped by parent folder to maintain sort order
    if (payload.files.length > 0 && batchId) {
      // Group files by parent folder
      const filesByParent = new Map<string | undefined, typeof payload.files>();
      
      for (const file of payload.files) {
        const parentKey = file.parentFolderId || 'root';
        if (!filesByParent.has(parentKey)) {
          filesByParent.set(parentKey, []);
        }
        filesByParent.get(parentKey)!.push(file);
      }
      
      // Process files for each parent, maintaining sort order
      for (const [parentKey, filesInParent] of filesByParent) {
        // Sort files by their original order or name
        const sortedFiles = filesInParent.sort((a, b) => {
          const aOrder = (a as any).sortOrder ?? 0;
          const bOrder = (b as any).sortOrder ?? 0;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.file.name.localeCompare(b.file.name);
        });
        
        for (let i = 0; i < sortedFiles.length; i++) {
          const filePayload = sortedFiles[i];
          const batchFileIndex = payload.files.indexOf(filePayload);
          const batchFile = batchResult.data.files[batchFileIndex];
          
          if (!batchFile) {
            errors.push({
              itemId: filePayload.id,
              itemName: filePayload.file.name,
              error: 'Batch file not found',
            });
            completedItems++;
            continue;
          }
          
          try {
            // Resolve parent folder ID from staging ID to database ID
            let parentFolderId = filePayload.parentFolderId;
            if (parentFolderId && folderIdMap.has(parentFolderId)) {
              parentFolderId = folderIdMap.get(parentFolderId);
            }
            
            // Upload file with sort order
            const uploadResult = await uploadFileActionWithSortOrder({
              batchId,
              fileId: batchFile.id,
              file: filePayload.file,
              folderId: parentFolderId,
              sortOrder: i, // Maintain sort order within parent
            });
            
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'Failed to upload file');
            }
            
            completedItems++;
          } catch (error) {
            errors.push({
              itemId: filePayload.id,
              itemName: filePayload.file.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            completedItems++;
          }
        }
      }

      // Step 4: Complete the batch (only if we created one)
      if (batchId) {
        const completeResult = await completeBatchAction(batchId);
        
        if (!completeResult.success) {
          // Don't fail the entire operation if batch completion fails
        }
      }
    }

    const uploadedFiles = payload.files.length - errors.filter(e => payload.files.some(f => f.id === e.itemId)).length;
    const createdFolders = payload.folders.length - errors.filter(e => payload.folders.some(f => f.id === e.itemId)).length;

    // Single summary log showing what was uploaded
    if (uploadedFiles > 0 || createdFolders > 0) {
      console.log('Upload completed:', {
        files: uploadedFiles,
        folders: createdFolders,
        errors: errors.length,
      });
    }

    return {
      success: true,
      data: {
        batchId: batchId || '', // batchId may be empty for folder-only uploads
        uploadedFiles,
        createdFolders,
        totalProcessed: completedItems,
      },
      progress: {
        total: totalItems,
        completed: completedItems,
        failed: errors.length,
        errors,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch upload failed',
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Organize folders by their depth level for hierarchical processing
 * Returns the maximum depth found
 */
function organizeFoldersByDepth(
  folders: Array<{ id: string; name: string; parentFolderId?: string }>,
  foldersByDepth: Map<number, typeof folders>
): number {
  const folderDepths = new Map<string, number>();
  let maxDepth = 0;
  
  // Calculate depth for each folder
  const calculateDepth = (folderId: string): number => {
    if (folderDepths.has(folderId)) {
      return folderDepths.get(folderId)!;
    }
    
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return 0;
    
    let depth = 0;
    if (folder.parentFolderId) {
      // Check if parent is another staging folder
      const parentExists = folders.some(f => f.id === folder.parentFolderId);
      if (parentExists) {
        depth = calculateDepth(folder.parentFolderId) + 1;
      }
    }
    
    folderDepths.set(folderId, depth);
    maxDepth = Math.max(maxDepth, depth);
    return depth;
  };
  
  // Calculate depth for all folders and organize them
  for (const folder of folders) {
    const depth = calculateDepth(folder.id);
    
    if (!foldersByDepth.has(depth)) {
      foldersByDepth.set(depth, []);
    }
    foldersByDepth.get(depth)!.push(folder);
  }
  
  return maxDepth;
}

/**
 * Enhanced version of createLinkFolderAction that includes sort order
 */
async function createLinkFolderActionWithSortOrder(
  linkId: string,
  folderName: string,
  parentFolderId?: string,
  sortOrder: number = 0,
  batchId?: string
) {
  // Pass sortOrder to the action
  return createLinkFolderAction(linkId, folderName, parentFolderId, batchId, sortOrder);
}

/**
 * Enhanced version of uploadFileAction that includes sort order
 */
async function uploadFileActionWithSortOrder(params: {
  batchId: string;
  fileId: string;
  file: File;
  folderId?: string;
  sortOrder?: number;
}) {
  // Pass sortOrder to the action (when it's updated to support it)
  return uploadFileAction({
    batchId: params.batchId,
    fileId: params.fileId,
    file: params.file,
    folderId: params.folderId,
    sortOrder: params.sortOrder,
  });
}

// =============================================================================
// PROGRESS TRACKING HELPER
// =============================================================================

/**
 * Get upload progress for UI updates
 * Note: This is an internal helper, not a server action
 */
function createUploadProgressTracker() {
  let currentProgress: BatchUploadProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    errors: [],
  };

  return {
    updateProgress: (progress: Partial<BatchUploadProgress>) => {
      currentProgress = { ...currentProgress, ...progress };
      return currentProgress;
    },
    getProgress: () => currentProgress,
    reset: () => {
      currentProgress = {
        total: 0,
        completed: 0,
        failed: 0,
        errors: [],
      };
    },
  };
}