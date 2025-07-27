// =============================================================================
// STORAGE SERVER ACTIONS - Next.js App Router Compatible
// =============================================================================
// 🎯 Server actions for storage operations that properly separate server/client concerns

'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getUserStorageDashboard,
  canUserUpload,
  uploadFileWithTracking,
  deleteFileWithTracking,
  syncStorageWithSupabase,
  getStorageBreakdownByType,
  type UserStorageInfo,
  type StorageValidationResult,
} from './storage-tracking-service';

// =============================================================================
// STORAGE DASHBOARD ACTIONS
// =============================================================================

/**
 * Server action to get user storage dashboard
 */
export async function getUserStorageDashboardAction(userPlanKey: string = 'free') {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    const dashboard = await getUserStorageDashboard(userId, userPlanKey);
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error fetching user storage dashboard:', error);
    return { 
      success: false, 
      error: 'Failed to fetch storage dashboard',
      data: null 
    };
  }
}

/**
 * Server action to get storage breakdown by type
 */
export async function getStorageBreakdownAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    const breakdown = await getStorageBreakdownByType(userId);
    return { success: true, data: breakdown };
  } catch (error) {
    console.error('Error fetching storage breakdown:', error);
    return { 
      success: false, 
      error: 'Failed to fetch storage breakdown',
      data: null 
    };
  }
}

/**
 * Server action to validate if user can upload a file
 */
export async function validateUploadAction(fileSizeBytes: number, userPlanKey: string = 'free') {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    if (fileSizeBytes <= 0) {
      return { 
        success: false, 
        error: 'Invalid file size',
        data: null 
      };
    }

    const validation = await canUserUpload(userId, fileSizeBytes, userPlanKey);
    return { success: true, data: validation };
  } catch (error) {
    console.error('Error validating upload:', error);
    return { 
      success: false, 
      error: 'Failed to validate upload',
      data: null 
    };
  }
}

// =============================================================================
// FILE OPERATIONS ACTIONS
// =============================================================================

/**
 * Server action to upload file with tracking
 */
export async function uploadFileAction(
  fileData: {
    file: File;
    storagePath: string;
    metadata: {
      linkId?: string;
      batchId?: string;
      workspaceId?: string;
      folderId?: string;
    };
  },
  userPlanKey: string = 'free'
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    const result = await uploadFileWithTracking(
      userId,
      fileData.file,
      fileData.storagePath,
      fileData.metadata,
      userPlanKey
    );

    return { success: result.success, data: result.fileId, error: result.error };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { 
      success: false, 
      error: 'Failed to upload file',
      data: null 
    };
  }
}

/**
 * Server action to delete file with tracking
 */
export async function deleteFileAction(fileId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    const result = await deleteFileWithTracking(fileId, userId);
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { 
      success: false, 
      error: 'Failed to delete file' 
    };
  }
}

/**
 * Server action to sync storage with Supabase
 */
export async function syncStorageAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    const result = await syncStorageWithSupabase(userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error syncing storage:', error);
    return { 
      success: false, 
      error: 'Failed to sync storage',
      data: null 
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  UserStorageInfo,
  StorageValidationResult,
} from './storage-tracking-service';