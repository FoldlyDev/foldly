'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { FileService } from '@/lib/services/shared/file-service';
import { FolderService } from '@/lib/services/shared/folder-service';
import type { DatabaseId } from '@/lib/supabase/types';

// =============================================================================
// ENHANCED BATCH OPERATIONS WITH NESTED CONTENT SUPPORT
// =============================================================================

/**
 * Enhanced batch move with nested content analysis
 */
export async function enhancedBatchMoveItemsAction(
  nodeIds: DatabaseId[],
  targetId: DatabaseId | 'root'
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (nodeIds.length === 0) {
      return { success: true, data: { nodeIds, targetId } };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // Get user's workspace first
    const { workspaceService } = await import('@/lib/services/workspace');
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get all files and folders to categorize the nodeIds
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFoldersByWorkspace(workspace.id),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      throw new Error('Failed to fetch workspace data');
    }

    // Separate files and folders
    const filesToMove = nodeIds.filter(id =>
      filesResult.data.some((file: any) => file.id === id)
    );
    const foldersToMove = nodeIds.filter(id =>
      foldersResult.data.some((folder: any) => folder.id === id)
    );

    // Calculate total operations (including nested content)
    const folderOperationMap = new Map<DatabaseId, number>();
    for (const folderId of foldersToMove) {
      const nestedFilesResult = await folderService.getNestedFiles(folderId);
      const nestedFoldersResult =
        await folderService.getNestedFolders(folderId);

      const nestedCount =
        (nestedFilesResult.success ? nestedFilesResult.data.length : 0) +
        (nestedFoldersResult.success ? nestedFoldersResult.data.length : 0) +
        1; // +1 for the folder itself

      folderOperationMap.set(folderId, nestedCount);
    }

    const totalOperations =
      filesToMove.length +
      Array.from(folderOperationMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );

    // Determine actual target ID
    const actualTargetId = targetId === 'root' ? workspace.id : targetId;
    let currentOperation = 0;

    console.log('🚚 Starting enhanced batch move:', {
      nodeIds,
      targetId,
      actualTargetId,
      filesToMove: filesToMove.length,
      foldersToMove: foldersToMove.length,
      totalOperations,
    });

    // Handle file conflicts and batch move files
    if (filesToMove.length > 0) {
      console.log(`📁 Processing ${filesToMove.length} files for conflicts...`);

      // Handle conflicts for each file before batch move
      const conflictResolvedFiles: { id: string; newName?: string }[] = [];

      // Get existing files in target folder to check for conflicts
      let existingFileNames: string[] = [];
      if (actualTargetId && actualTargetId !== workspace.id) {
        // Moving to a specific folder
        const existingFilesResult =
          await fileService.getFilesByFolder(actualTargetId);
        if (existingFilesResult.success) {
          existingFileNames = existingFilesResult.data.map(f => f.fileName);
        }
      } else {
        // Moving to root - get root files
        const existingRootFilesResult =
          await fileService.getRootFilesByWorkspace(workspace.id);
        if (existingRootFilesResult.success) {
          existingFileNames = existingRootFilesResult.data.map(f => f.fileName);
        }
      }

      // Check each file for conflicts and resolve them
      for (const fileId of filesToMove) {
        const fileResult = await fileService.getFileById(fileId);
        if (fileResult.success) {
          const file = fileResult.data;
          const currentFileName = file.fileName;

          // Check if name conflicts with existing files (excluding files in the current move batch)
          const conflictWithExisting =
            existingFileNames.includes(currentFileName);
          const conflictWithBatch = conflictResolvedFiles.some(
            f =>
              f.newName === currentFileName || (!f.newName && f.id !== fileId)
          );

          if (conflictWithExisting || conflictWithBatch) {
            // Import the generateUniqueName function
            const { generateUniqueName } = await import(
              '@/features/files/utils/file-operations'
            );

            // Get all names to avoid (existing + already resolved in this batch)
            const allNamesToAvoid = [
              ...existingFileNames,
              ...conflictResolvedFiles.map(f => f.newName || currentFileName),
            ];

            // Generate unique name
            const uniqueName = generateUniqueName(
              currentFileName,
              allNamesToAvoid
            );

            if (uniqueName !== currentFileName) {
              // Rename the file to avoid conflict
              const renameResult = await fileService.renameFile(
                fileId,
                uniqueName
              );
              if (!renameResult.success) {
                throw new Error(
                  `Failed to rename file ${currentFileName}: ${renameResult.error}`
                );
              }

              conflictResolvedFiles.push({ id: fileId, newName: uniqueName });
              console.log(
                `🔄 Renamed "${currentFileName}" to "${uniqueName}" to avoid conflict`
              );
            } else {
              conflictResolvedFiles.push({ id: fileId });
            }
          } else {
            conflictResolvedFiles.push({ id: fileId });
          }

          // Add this file's name to existing names for next iteration
          existingFileNames.push(file.fileName);
        }
      }

      console.log(`📁 Moving ${filesToMove.length} files in batch...`);

      const batchMoveResult = await fileService.batchMoveFiles(
        filesToMove,
        actualTargetId
      );

      if (!batchMoveResult.success) {
        throw new Error(`Failed to batch move files: ${batchMoveResult.error}`);
      }

      currentOperation += filesToMove.length;
      console.log(`✅ Batch moved ${filesToMove.length} files successfully`);
    }

    // Batch move folders (handles nested content automatically)
    if (foldersToMove.length > 0) {
      console.log(`📂 Moving ${foldersToMove.length} folders in batch...`);

      const batchMoveResult = await folderService.batchMoveFolders(
        foldersToMove,
        actualTargetId
      );

      if (!batchMoveResult.success) {
        throw new Error(
          `Failed to batch move folders: ${batchMoveResult.error}`
        );
      }

      // Add all expected operations for moved folders
      const folderOperations = Array.from(folderOperationMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      currentOperation += folderOperations;
      console.log(
        `✅ Batch moved ${foldersToMove.length} folders successfully`
      );
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    console.log('✅ Enhanced batch move completed:', {
      movedFiles: filesToMove.length,
      movedFolders: foldersToMove.length,
      totalOperations,
    });

    return {
      success: true,
      data: {
        movedItems: nodeIds,
        targetId: actualTargetId,
        summary: {
          movedFiles: filesToMove.length,
          movedFolders: foldersToMove.length,
          totalOperations,
        },
      },
    };
  } catch (error) {
    console.error('❌ ENHANCED_BATCH_MOVE_ACTION_FAILED:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to batch move items',
    };
  }
}

/**
 * Enhanced batch delete with nested content analysis
 */
export async function enhancedBatchDeleteItemsAction(nodeIds: DatabaseId[]) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Authentication required');
    }

    if (nodeIds.length === 0) {
      return { success: true, data: { nodeIds } };
    }

    const fileService = new FileService();
    const folderService = new FolderService();

    // Get user's workspace first
    const { workspaceService } = await import('@/lib/services/workspace');
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get all files and folders to categorize the nodeIds
    const [filesResult, foldersResult] = await Promise.all([
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFoldersByWorkspace(workspace.id),
    ]);

    if (!filesResult.success || !foldersResult.success) {
      throw new Error('Failed to fetch workspace data');
    }

    // Separate files and folders
    const filesToDelete = nodeIds.filter(id =>
      filesResult.data.some((file: any) => file.id === id)
    );
    const foldersToDelete = nodeIds.filter(id =>
      foldersResult.data.some((folder: any) => folder.id === id)
    );

    // Calculate total operations (including nested content)
    const folderOperationMap = new Map<DatabaseId, number>();
    for (const folderId of foldersToDelete) {
      const nestedFilesResult = await folderService.getNestedFiles(folderId);
      const nestedFoldersResult =
        await folderService.getNestedFolders(folderId);

      const nestedCount =
        (nestedFilesResult.success ? nestedFilesResult.data.length : 0) +
        (nestedFoldersResult.success ? nestedFoldersResult.data.length : 0) +
        1; // +1 for the folder itself

      folderOperationMap.set(folderId, nestedCount);
    }

    const totalOperations =
      filesToDelete.length +
      Array.from(folderOperationMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );

    let currentOperation = 0;

    console.log('🗑️ Starting enhanced batch delete:', {
      nodeIds,
      filesToDelete: filesToDelete.length,
      foldersToDelete: foldersToDelete.length,
      totalOperations,
    });

    // Batch delete files (much faster than individual deletes)
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${filesToDelete.length} files in batch...`);

      const batchDeleteResult =
        await fileService.batchDeleteFiles(filesToDelete);

      if (!batchDeleteResult.success) {
        throw new Error(
          `Failed to batch delete files: ${batchDeleteResult.error}`
        );
      }

      currentOperation += filesToDelete.length;
      console.log(
        `✅ Batch deleted ${filesToDelete.length} files successfully`
      );
    }

    // Batch delete folders (handles nested content automatically)
    if (foldersToDelete.length > 0) {
      console.log(`🗂️ Deleting ${foldersToDelete.length} folders in batch...`);

      const batchDeleteResult =
        await folderService.batchDeleteFolders(foldersToDelete);

      if (!batchDeleteResult.success) {
        throw new Error(
          `Failed to batch delete folders: ${batchDeleteResult.error}`
        );
      }

      // Add all expected operations for deleted folders
      const folderOperations = Array.from(folderOperationMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      currentOperation += folderOperations;
      console.log(
        `✅ Batch deleted ${foldersToDelete.length} folders successfully`
      );
    }

    // Revalidate the workspace page
    revalidatePath('/dashboard/workspace');

    console.log('✅ Enhanced batch delete completed:', {
      deletedFiles: filesToDelete.length,
      deletedFolders: foldersToDelete.length,
      totalOperations,
    });

    return {
      success: true,
      data: {
        deletedItems: nodeIds,
        summary: {
          deletedFiles: filesToDelete.length,
          deletedFolders: foldersToDelete.length,
          totalOperations,
        },
      },
    };
  } catch (error) {
    console.error('❌ ENHANCED_BATCH_DELETE_ACTION_FAILED:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to batch delete items',
    };
  }
}
