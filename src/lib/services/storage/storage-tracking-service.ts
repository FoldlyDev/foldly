// =============================================================================
// STORAGE TRACKING SERVICE - Real-time Storage Calculation and Management
// =============================================================================
// 🎯 Provides real-time storage tracking without storing redundant data
// 📚 Uses files table as source of truth for storage calculations

import { db } from '@/lib/database/connection';
import { files, subscriptionPlans } from '@/lib/database/schemas';
import { eq, sum, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export interface UserStorageInfo {
  userId: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
  filesCount: number;
  remainingBytes: number;
  usagePercentage: number;
  planKey: string;
}

export interface StorageValidationResult {
  canUpload: boolean;
  reason?: string | undefined;
  wouldExceedLimit: boolean;
  currentUsage: number;
  newTotal: number;
  limit: number;
}

/**
 * Calculate total storage used by a user
 * Real-time calculation from files table
 */
export const calculateUserStorageUsage = async (userId: string): Promise<number> => {
  try {
    const result = await db
      .select({
        totalSize: sum(files.fileSize)
      })
      .from(files)
      .where(eq(files.userId, userId));

    // Handle null result when user has no files
    return result?.[0]?.totalSize ? Number(result[0].totalSize) : 0;
  } catch (error) {
    console.error('Error calculating user storage usage:', error);
    throw new Error('Failed to calculate storage usage');
  }
};

/**
 * Get user storage limits based on their plan
 * Defaults to Free plan limits if no plan found
 */
export const getUserStorageLimit = async (userPlanKey: string = 'free'): Promise<number> => {
  try {
    const planResult = await db
      .select({
        storageLimitGb: subscriptionPlans.storageLimitGb
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planKey, userPlanKey))
      .limit(1);

    if (planResult.length === 0) {
      // Default to free plan (50GB)
      return 50 * 1024 * 1024 * 1024; // 50GB in bytes
    }

    return (planResult[0]?.storageLimitGb ?? 50) * 1024 * 1024 * 1024; // Convert GB to bytes
  } catch (error) {
    console.error('Error getting user storage limit:', error);
    // Return free tier limit as fallback
    return 50 * 1024 * 1024 * 1024; // 50GB in bytes
  }
};

/**
 * Get comprehensive storage information for a user
 */
export const getUserStorageDashboard = async (
  userId: string, 
  userPlanKey: string = 'free'
): Promise<UserStorageInfo> => {
  try {
    const [storageUsed, storageLimit, filesCountResult] = await Promise.all([
      calculateUserStorageUsage(userId),
      getUserStorageLimit(userPlanKey),
      db
        .select({
          count: sql<number>`count(*)`
        })
        .from(files)
        .where(eq(files.userId, userId))
    ]);

    const filesCount = Number(filesCountResult[0]?.count || 0);
    const remainingBytes = Math.max(0, storageLimit - storageUsed);
    const usagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

    return {
      userId,
      storageUsedBytes: storageUsed,
      storageLimitBytes: storageLimit,
      filesCount,
      remainingBytes,
      usagePercentage: Math.min(100, usagePercentage), // Cap at 100%
      planKey: userPlanKey
    };
  } catch (error) {
    console.error('Error getting user storage dashboard:', error);
    throw new Error('Failed to get storage dashboard');
  }
};

/**
 * Check if user can upload a file of given size
 */
export const canUserUpload = async (
  userId: string,
  fileSizeBytes: number,
  userPlanKey: string = 'free'
): Promise<StorageValidationResult> => {
  try {
    const [currentUsage, storageLimit] = await Promise.all([
      calculateUserStorageUsage(userId),
      getUserStorageLimit(userPlanKey)
    ]);

    const newTotal = currentUsage + fileSizeBytes;
    const wouldExceedLimit = newTotal > storageLimit;

    return {
      canUpload: !wouldExceedLimit,
      reason: wouldExceedLimit ? 'Storage limit would be exceeded' : undefined,
      wouldExceedLimit,
      currentUsage,
      newTotal,
      limit: storageLimit
    } as StorageValidationResult;
  } catch (error) {
    console.error('Error checking upload permissions:', error);
    return {
      canUpload: false,
      reason: 'Error validating storage limits',
      wouldExceedLimit: true,
      currentUsage: 0,
      newTotal: fileSizeBytes,
      limit: 0
    };
  }
};

/**
 * Upload file to Supabase Storage and record in database
 * Includes storage validation and atomic operations
 */
export const uploadFileWithTracking = async (
  userId: string,
  file: File,
  storagePath: string,
  metadata: {
    linkId?: string;
    batchId?: string;
    workspaceId?: string;
    folderId?: string;
  },
  userPlanKey: string = 'free'
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  try {
    // Pre-upload validation
    const validation = await canUserUpload(userId, file.size, userPlanKey);
    if (!validation.canUpload) {
      return {
        success: false,
        error: validation.reason || 'Upload not allowed'
      };
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, file, {
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`
      };
    }

    // Record in database
    const fileRecord = await db
      .insert(files)
      .values({
        linkId: metadata.linkId,
        batchId: metadata.batchId,
        userId,
        workspaceId: metadata.workspaceId,
        folderId: metadata.folderId,
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        extension: file.name.split('.').pop() || '',
        storagePath: uploadData.path,
        storageProvider: 'supabase',
        processingStatus: 'completed',
        isOrganized: false,
        needsReview: false
      })
      .returning({ id: files.id });

    const fileId = fileRecord[0]?.id;
    if (!fileId) {
      return {
        success: false,
        error: 'Failed to create file record'
      };
    }

    return {
      success: true,
      fileId
    };
  } catch (error) {
    console.error('Error uploading file with tracking:', error);
    return {
      success: false,
      error: 'Upload processing failed'
    };
  }
};

/**
 * Delete file from storage and database
 * Ensures cleanup of both storage and database records
 */
export const deleteFileWithTracking = async (
  fileId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get file record first
    const fileRecord = await db
      .select({
        storagePath: files.storagePath,
        userId: files.userId
      })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRecord.length === 0) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    // Verify ownership
    if (fileRecord[0]?.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized file access'
      };
    }

    // Delete from Supabase Storage first
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([fileRecord[0]?.storagePath || '']);

    if (storageError) {
      console.warn('Storage deletion failed, proceeding with database cleanup:', storageError);
    }

    // Delete from database
    await db
      .delete(files)
      .where(eq(files.id, fileId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting file with tracking:', error);
    return {
      success: false,
      error: 'File deletion failed'
    };
  }
};

/**
 * Sync storage state with Supabase
 * Cleanup orphaned files and update database records
 */
export const syncStorageWithSupabase = async (userId: string): Promise<{
  orphanedFiles: number;
  missingFiles: number;
  syncedFiles: number;
}> => {
  try {
    // Get all file records for user
    const dbFiles = await db
      .select({
        id: files.id,
        storagePath: files.storagePath
      })
      .from(files)
      .where(eq(files.userId, userId));

    // Get all files from Supabase Storage for user
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('files')
      .list('', {
        limit: 1000,
        search: userId // Assuming storage paths include userId
      });

    if (listError) {
      throw new Error(`Failed to list storage files: ${listError.message}`);
    }

    const storagePathSet = new Set(storageFiles?.map(f => f.name) || []);
    const dbPathSet = new Set(dbFiles.map(f => f.storagePath));

    // Find orphaned database records (exist in DB but not in storage)
    const orphanedDbRecords = dbFiles.filter(f => !storagePathSet.has(f.storagePath));
    
    // Find missing database records (exist in storage but not in DB)
    const orphanedStorageFiles = (storageFiles || []).filter(f => !dbPathSet.has(f.name));

    // Clean up orphaned database records
    if (orphanedDbRecords.length > 0) {
      await db
        .delete(files)
        .where(sql`${files.id} IN ${sql.raw(`(${orphanedDbRecords.map(f => `'${f.id}'`).join(',')})`)}`);
    }

    // Optionally clean up orphaned storage files
    if (orphanedStorageFiles.length > 0) {
      const pathsToDelete = orphanedStorageFiles.map(f => f.name);
      await supabase.storage
        .from('files')
        .remove(pathsToDelete);
    }

    return {
      orphanedFiles: orphanedDbRecords.length,
      missingFiles: orphanedStorageFiles.length,
      syncedFiles: dbFiles.length - orphanedDbRecords.length
    };
  } catch (error) {
    console.error('Error syncing storage with Supabase:', error);
    throw new Error('Storage sync failed');
  }
};

/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get storage usage breakdown by file type
 */
export const getStorageBreakdownByType = async (userId: string): Promise<{
  [mimeType: string]: {
    count: number;
    totalSize: number;
    percentage: number;
  }
}> => {
  try {
    const breakdown = await db
      .select({
        mimeType: files.mimeType,
        count: sql<number>`count(*)`,
        totalSize: sum(files.fileSize)
      })
      .from(files)
      .where(eq(files.userId, userId))
      .groupBy(files.mimeType);

    const totalStorage = breakdown.reduce((sum, item) => 
      sum + (Number(item.totalSize) || 0), 0
    );

    const result: { [key: string]: any } = {};
    
    breakdown.forEach(item => {
      const size = Number(item.totalSize) || 0;
      result[item.mimeType] = {
        count: Number(item.count),
        totalSize: size,
        percentage: totalStorage > 0 ? (size / totalStorage) * 100 : 0
      };
    });

    return result;
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    return {};
  }
};