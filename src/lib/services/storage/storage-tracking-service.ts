// =============================================================================
// STORAGE TRACKING SERVICE - Real-time Storage Calculation and Management
// =============================================================================
// 🎯 Provides real-time storage tracking without storing redundant data
// 📚 Uses files table as source of truth for storage calculations

import { db } from '@/lib/database/connection';
import { files, subscriptionPlans, workspaces, links } from '@/lib/database/schemas';
import { eq, sum, sql, and, or } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { formatBytes } from './utils';

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
 * Real-time calculation from files table through workspace and link relationships
 */
export const calculateUserStorageUsage = async (
  userId: string
): Promise<number> => {
  try {
    // Calculate storage from workspace files
    const workspaceResult = await db
      .select({
        totalSize: sum(files.fileSize),
      })
      .from(files)
      .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
      .where(eq(workspaces.userId, userId));

    // Calculate storage from link files
    const linkResult = await db
      .select({
        totalSize: sum(files.fileSize),
      })
      .from(files)
      .innerJoin(links, eq(files.linkId, links.id))
      .where(eq(links.userId, userId));

    const workspaceTotal = workspaceResult?.[0]?.totalSize ? Number(workspaceResult[0].totalSize) : 0;
    const linkTotal = linkResult?.[0]?.totalSize ? Number(linkResult[0].totalSize) : 0;

    return workspaceTotal + linkTotal;
  } catch (error) {
    console.error('Error calculating user storage usage:', error);
    throw new Error('Failed to calculate storage usage');
  }
};

/**
 * Get user storage limits based on their plan
 * Defaults to Free plan limits if no plan found
 */
export const getUserStorageLimit = async (
  userPlanKey: string = 'free'
): Promise<number> => {
  try {
    const planResult = await db
      .select({
        storageLimitGb: subscriptionPlans.storageLimitGb,
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
    const [storageUsed, storageLimit, workspaceFilesCount, linkFilesCount] = await Promise.all([
      calculateUserStorageUsage(userId),
      getUserStorageLimit(userPlanKey),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(files)
        .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
        .where(eq(workspaces.userId, userId)),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(files)
        .innerJoin(links, eq(files.linkId, links.id))
        .where(eq(links.userId, userId)),
    ]);

    const filesCount = Number(workspaceFilesCount[0]?.count || 0) + Number(linkFilesCount[0]?.count || 0);

    const remainingBytes = Math.max(0, storageLimit - storageUsed);
    const usagePercentage =
      storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

    return {
      userId,
      storageUsedBytes: storageUsed,
      storageLimitBytes: storageLimit,
      filesCount,
      remainingBytes,
      usagePercentage: Math.min(100, usagePercentage), // Cap at 100%
      planKey: userPlanKey,
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
      getUserStorageLimit(userPlanKey),
    ]);

    const newTotal = currentUsage + fileSizeBytes;
    const wouldExceedLimit = newTotal > storageLimit;

    return {
      canUpload: !wouldExceedLimit,
      reason: wouldExceedLimit ? 'Storage limit would be exceeded' : undefined,
      wouldExceedLimit,
      currentUsage,
      newTotal,
      limit: storageLimit,
    } as StorageValidationResult;
  } catch (error) {
    console.error('Error checking upload permissions:', error);
    return {
      canUpload: false,
      reason: 'Error validating storage limits',
      wouldExceedLimit: true,
      currentUsage: 0,
      newTotal: fileSizeBytes,
      limit: 0,
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
        error: validation.reason || 'Upload not allowed',
      };
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, file, {
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`,
      };
    }

    // Record in database
    const fileRecord = await db
      .insert(files)
      .values({
        linkId: metadata.linkId,
        batchId: metadata.batchId,
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
        needsReview: false,
      })
      .returning({ id: files.id });

    const fileId = fileRecord[0]?.id;
    if (!fileId) {
      return {
        success: false,
        error: 'Failed to create file record',
      };
    }

    return {
      success: true,
      fileId,
    };
  } catch (error) {
    console.error('Error uploading file with tracking:', error);
    return {
      success: false,
      error: 'Upload processing failed',
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
    // Get file record and verify ownership through relationships
    const fileRecord = await db
      .select({
        id: files.id,
        storagePath: files.storagePath,
        workspaceId: files.workspaceId,
        linkId: files.linkId,
      })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRecord.length === 0) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    // Verify ownership through workspace or link
    let isOwner = false;
    
    if (fileRecord[0]?.workspaceId) {
      const workspace = await db
        .select({ userId: workspaces.userId })
        .from(workspaces)
        .where(eq(workspaces.id, fileRecord[0].workspaceId))
        .limit(1);
      isOwner = workspace[0]?.userId === userId;
    } else if (fileRecord[0]?.linkId) {
      const link = await db
        .select({ userId: links.userId })
        .from(links)
        .where(eq(links.id, fileRecord[0].linkId))
        .limit(1);
      isOwner = link[0]?.userId === userId;
    }

    if (!isOwner) {
      return {
        success: false,
        error: 'Unauthorized file access',
      };
    }

    // Delete from Supabase Storage first
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([fileRecord[0]?.storagePath || '']);

    if (storageError) {
      console.warn(
        'Storage deletion failed, proceeding with database cleanup:',
        storageError
      );
    }

    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting file with tracking:', error);
    return {
      success: false,
      error: 'File deletion failed',
    };
  }
};

/**
 * Sync storage state with Supabase
 * Cleanup orphaned files and update database records
 */
export const syncStorageWithSupabase = async (
  userId: string
): Promise<{
  orphanedFiles: number;
  missingFiles: number;
  syncedFiles: number;
}> => {
  try {
    // Get all file records for user through workspace and link relationships
    const workspaceFiles = await db
      .select({
        id: files.id,
        storagePath: files.storagePath,
      })
      .from(files)
      .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
      .where(eq(workspaces.userId, userId));

    const linkFiles = await db
      .select({
        id: files.id,
        storagePath: files.storagePath,
      })
      .from(files)
      .innerJoin(links, eq(files.linkId, links.id))
      .where(eq(links.userId, userId));

    const dbFiles = [...workspaceFiles, ...linkFiles];

    // Get all files from Supabase Storage for user
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('files')
      .list('', {
        limit: 1000,
        search: userId, // Assuming storage paths include userId
      });

    if (listError) {
      throw new Error(`Failed to list storage files: ${listError.message}`);
    }

    const storagePathSet = new Set(storageFiles?.map(f => f.name) || []);
    const dbPathSet = new Set(dbFiles.map(f => f.storagePath));

    // Find orphaned database records (exist in DB but not in storage)
    const orphanedDbRecords = dbFiles.filter(
      f => !storagePathSet.has(f.storagePath)
    );

    // Find missing database records (exist in storage but not in DB)
    const orphanedStorageFiles = (storageFiles || []).filter(
      f => !dbPathSet.has(f.name)
    );

    // Clean up orphaned database records
    if (orphanedDbRecords.length > 0) {
      await db
        .delete(files)
        .where(
          sql`${files.id} IN ${sql.raw(`(${orphanedDbRecords.map(f => `'${f.id}'`).join(',')})`)}`
        );
    }

    // Optionally clean up orphaned storage files
    if (orphanedStorageFiles.length > 0) {
      const pathsToDelete = orphanedStorageFiles.map(f => f.name);
      await supabase.storage.from('files').remove(pathsToDelete);
    }

    return {
      orphanedFiles: orphanedDbRecords.length,
      missingFiles: orphanedStorageFiles.length,
      syncedFiles: dbFiles.length - orphanedDbRecords.length,
    };
  } catch (error) {
    console.error('Error syncing storage with Supabase:', error);
    throw new Error('Storage sync failed');
  }
};

// Re-export formatBytes from utils for backward compatibility
export { formatBytes } from './utils';

/**
 * Get storage usage breakdown by file type
 */
export const getStorageBreakdownByType = async (
  userId: string
): Promise<{
  [mimeType: string]: {
    count: number;
    totalSize: number;
    percentage: number;
  };
}> => {
  try {
    // Get breakdown from workspace files
    const workspaceBreakdown = await db
      .select({
        mimeType: files.mimeType,
        count: sql<number>`count(*)`,
        totalSize: sum(files.fileSize),
      })
      .from(files)
      .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
      .where(eq(workspaces.userId, userId))
      .groupBy(files.mimeType);

    // Get breakdown from link files
    const linkBreakdown = await db
      .select({
        mimeType: files.mimeType,
        count: sql<number>`count(*)`,
        totalSize: sum(files.fileSize),
      })
      .from(files)
      .innerJoin(links, eq(files.linkId, links.id))
      .where(eq(links.userId, userId))
      .groupBy(files.mimeType);

    // Merge breakdowns
    const mergedBreakdown: { [key: string]: { count: number; totalSize: number } } = {};
    
    [...workspaceBreakdown, ...linkBreakdown].forEach(item => {
      const mimeType = item.mimeType;
      if (!mergedBreakdown[mimeType]) {
        mergedBreakdown[mimeType] = { count: 0, totalSize: 0 };
      }
      mergedBreakdown[mimeType].count += Number(item.count);
      mergedBreakdown[mimeType].totalSize += Number(item.totalSize) || 0;
    });

    const totalStorage = Object.values(mergedBreakdown).reduce(
      (sum, item) => sum + item.totalSize,
      0
    );

    const result: { [key: string]: any } = {};

    Object.entries(mergedBreakdown).forEach(([mimeType, data]) => {
      result[mimeType] = {
        count: data.count,
        totalSize: data.totalSize,
        percentage: totalStorage > 0 ? (data.totalSize / totalStorage) * 100 : 0,
      };
    });


    return result;
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    return {};
  }
};
