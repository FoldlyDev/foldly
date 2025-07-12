'use server';

import { auth } from '@clerk/nextjs/server';
import { workspaceService } from '@/lib/services/workspace';
import { FileService } from '@/lib/services/shared/file-service';
import { FolderService } from '@/lib/services/shared/folder-service';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface WorkspaceTreeData {
  folders: any[];
  files: any[];
  workspace: {
    id: string;
    name: string;
  };
  stats: {
    folderCount: number;
    fileCount: number;
    totalSize: number;
  };
}

export async function fetchWorkspaceTreeAction(): Promise<
  ActionResult<WorkspaceTreeData>
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Initialize services
    const fileService = new FileService();
    const folderService = new FolderService();

    // Fetch data from database
    const [foldersResult, filesResult, statsResult] = await Promise.all([
      folderService.getFoldersByWorkspace(workspace.id),
      fileService.getFilesByWorkspace(workspace.id),
      folderService.getFolderStats(workspace.id),
    ]);

    // Handle errors
    if (!foldersResult.success) {
      return { success: false, error: foldersResult.error };
    }

    if (!filesResult.success) {
      return { success: false, error: filesResult.error };
    }

    if (!statsResult.success) {
      return { success: false, error: statsResult.error };
    }

    // Calculate total file size
    const totalSize = filesResult.data.reduce(
      (sum, file) => sum + (file.fileSize || 0),
      0
    );

    const treeData: WorkspaceTreeData = {
      folders: foldersResult.data,
      files: filesResult.data,
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      stats: {
        folderCount: statsResult.data.folderCount,
        fileCount: statsResult.data.fileCount,
        totalSize,
      },
    };

    console.log(
      `✅ WORKSPACE_TREE_FETCHED: ${workspace.id} - ${treeData.folders.length} folders, ${treeData.files.length} files`
    );

    return { success: true, data: treeData };
  } catch (error) {
    console.error('❌ WORKSPACE_TREE_FETCH_FAILED:', error);
    return { success: false, error: (error as Error).message };
  }
}

// TODO: Future real implementation for reference
/*
export async function fetchWorkspaceTreeActionReal(): Promise<ActionResult<WorkspaceTreeData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's workspace
    const workspace = await workspaceService.getWorkspaceByUserId(userId);
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // Fetch folders and files from database
    const [workspaceFolders, workspaceFiles] = await Promise.all([
      db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            eq(folders.workspaceId, workspace.id),
            eq(folders.isArchived, false)
          )
        )
        .orderBy(folders.path),
      
      db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            eq(files.processingStatus, 'completed')
          )
        )
        .orderBy(files.fileName),
    ]);

    return {
      success: true,
      data: {
        folders: workspaceFolders,
        files: workspaceFiles,
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
      },
    };
  } catch (error) {
    console.error('Failed to fetch workspace tree:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workspace tree',
    };
  }
}
*/
