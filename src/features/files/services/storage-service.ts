import { getSupabaseClient } from '@/lib/config/supabase-client';
import type { DatabaseResult } from '@/lib/database/types/common';

// =============================================================================
// STORAGE SERVICE - Supabase Storage Integration with Dual Buckets & Quota Management
// =============================================================================

export interface UploadResult {
  path: string;
  fullPath: string;
  publicUrl?: string;
}

export interface DownloadResult {
  url: string;
  expiresIn: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  error?: string;
  message?: string;
  storageUsed?: number;
  storageLimit?: number;
  availableSpace?: number;
  usagePercentage?: number;
  subscriptionTier?: string; // Deprecated - subscription tiers now handled by Clerk
  maxFileSize?: number;
  currentFileSize?: number;
}

export interface QuotaInfo {
  storageUsed: number;
  storageLimit: number;
  newUsage: number;
  usagePercentage: number;
  subscriptionTier: string; // Deprecated - subscription tiers now handled by Clerk
}

export type StorageContext = 'workspace' | 'shared';

export class StorageService {
  private supabase = getSupabaseClient();
  private readonly buckets = {
    workspace: 'workspace-files',
    shared: 'shared-files',
  } as const;
  // Max file size is now plan-based, not hardcoded
  // Free: 2GB, Pro: 10GB, Business: 25GB
  // This property is deprecated and should not be used
  private readonly maxFileSize = 25 * 1024 * 1024 * 1024; // 25GB system max (Business plan)

  /**
   * Get bucket name for context
   */
  private getBucketName(context: StorageContext): string {
    return this.buckets[context];
  }

  /**
   * Initialize both storage buckets and policies
   */
  async initializeBuckets(): Promise<DatabaseResult<void>> {
    try {
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();

      if (listError) {
        console.error('Failed to list buckets:', listError);
        return { success: false, error: listError.message };
      }

      const bucketsToCreate = Object.values(this.buckets);

      for (const bucketName of bucketsToCreate) {
        const bucketExists = buckets?.some(
          bucket => bucket.name === bucketName
        );

        if (!bucketExists) {
          const { error: createError } =
            await this.supabase.storage.createBucket(bucketName, {
              public: false,
              allowedMimeTypes: [
                'image/*',
                'video/*',
                'audio/*',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/*',
                'application/json',
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
              ],
              fileSizeLimit: this.maxFileSize,
            });

          if (createError) {
            console.error('Failed to create bucket:', createError);
            return { success: false, error: createError.message };
          }

          console.log(`✅ BUCKET_CREATED: ${bucketName}`);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to initialize buckets:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: File,
    path: string,
    userId: string,
    context: StorageContext = 'workspace'
  ): Promise<DatabaseResult<UploadResult>> {
    try {
      // File size validation should be handled by plan-based quota checks
      // This is a legacy validation that should not be used
      // Commenting out to prevent hardcoded limits
      /*
      if (file.size > this.maxFileSize) {
        return {
          success: false,
          error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`,
        };
      }
      */

      const bucketName = this.getBucketName(context);

      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Different path structures based on context
      let uniquePath: string;
      if (context === 'workspace') {
        uniquePath = `${userId}/${path}/${timestamp}_${sanitizedFileName}`;
      } else {
        // For shared files, path should include linkId
        uniquePath = `${path}/${timestamp}_${sanitizedFileName}`;
      }

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Failed to upload file:', error);
        return { success: false, error: error.message };
      }

      if (!data?.path) {
        return {
          success: false,
          error: 'Upload succeeded but no path returned',
        };
      }

      console.log(`✅ FILE_UPLOADED: ${data.path} to ${bucketName}`);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
        },
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Generate a signed download URL for a file
   */
  async getDownloadUrl(
    path: string,
    context: StorageContext = 'workspace',
    expiresIn: number = 3600
  ): Promise<DatabaseResult<DownloadResult>> {
    try {
      const bucketName = this.getBucketName(context);

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Failed to create signed URL:', error);
        return { success: false, error: error.message };
      }

      if (!data?.signedUrl) {
        return { success: false, error: 'Failed to generate download URL' };
      }

      return {
        success: true,
        data: {
          url: data.signedUrl,
          expiresIn,
        },
      };
    } catch (error) {
      console.error('Failed to get download URL:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  async getPublicUrl(
    path: string,
    context: StorageContext = 'workspace'
  ): Promise<DatabaseResult<string>> {
    try {
      const bucketName = this.getBucketName(context);

      const { data } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        return { success: false, error: 'Failed to generate public URL' };
      }

      return {
        success: true,
        data: data.publicUrl,
      };
    } catch (error) {
      console.error('Failed to get public URL:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(
    path: string,
    context: StorageContext = 'workspace'
  ): Promise<DatabaseResult<void>> {
    try {
      const bucketName = this.getBucketName(context);

      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        console.error('Failed to delete file from storage:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ FILE_DELETED_FROM_STORAGE: ${path} from ${bucketName}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Copy a file within storage (can be across contexts)
   */
  async copyFile(
    fromPath: string,
    toPath: string,
    fromContext: StorageContext = 'workspace',
    toContext: StorageContext = 'workspace'
  ): Promise<DatabaseResult<string>> {
    try {
      const fromBucket = this.getBucketName(fromContext);
      const toBucket = this.getBucketName(toContext);

      if (fromBucket === toBucket) {
        // Same bucket copy
        const { data, error } = await this.supabase.storage
          .from(fromBucket)
          .copy(fromPath, toPath);

        if (error) {
          console.error('Failed to copy file:', error);
          return { success: false, error: error.message };
        }

        console.log(
          `✅ FILE_COPIED: ${fromPath} -> ${toPath} in ${fromBucket}`
        );
        return { success: true, data: data.path };
      } else {
        // Cross-bucket copy (download then upload)
        return {
          success: false,
          error: 'Cross-bucket copy not implemented yet',
        };
      }
    } catch (error) {
      console.error('Failed to copy file:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Move a file within storage (can be across contexts)
   */
  async moveFile(
    fromPath: string,
    toPath: string,
    fromContext: StorageContext = 'workspace',
    toContext: StorageContext = 'workspace'
  ): Promise<DatabaseResult<string>> {
    try {
      const fromBucket = this.getBucketName(fromContext);
      const toBucket = this.getBucketName(toContext);

      if (fromBucket === toBucket) {
        // Same bucket move
        const { data, error } = await this.supabase.storage
          .from(fromBucket)
          .move(fromPath, toPath);

        if (error) {
          console.error('Failed to move file:', error);
          return { success: false, error: error.message };
        }

        console.log(`✅ FILE_MOVED: ${fromPath} -> ${toPath} in ${fromBucket}`);
        return { success: true, data: toPath };
      } else {
        // Cross-bucket move (copy then delete)
        return {
          success: false,
          error: 'Cross-bucket move not implemented yet',
        };
      }
    } catch (error) {
      console.error('Failed to move file:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(
    path: string,
    context: StorageContext = 'workspace'
  ): Promise<DatabaseResult<any>> {
    try {
      const bucketName = this.getBucketName(context);
      const fileName = path.split('/').pop();
      if (!fileName) {
        return { success: false, error: 'Invalid file path' };
      }

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: fileName,
        });

      if (error) {
        console.error('Failed to get file info:', error);
        return { success: false, error: error.message };
      }

      const fileInfo = data?.find(item => item.name === fileName);

      if (!fileInfo) {
        return { success: false, error: 'File not found' };
      }

      return { success: true, data: fileInfo };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    path: string = '',
    context: StorageContext = 'workspace',
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<DatabaseResult<any[]>> {
    try {
      const bucketName = this.getBucketName(context);

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(path, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('Failed to list files:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to list files:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Calculate checksum for uploaded file
   */
  async calculateChecksum(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    } catch (error) {
      console.error('Failed to calculate checksum:', error);
      return '';
    }
  }

  /**
   * Determine storage context based on file metadata
   */
  determineStorageContext(isWorkspaceFile: boolean): StorageContext {
    return isWorkspaceFile ? 'workspace' : 'shared';
  }

  // =============================================================================
  // QUOTA MANAGEMENT METHODS
  // =============================================================================

  /**
   * Check user upload quota before upload
   */
  async checkUserQuota(
    userId: string,
    fileSize: number
  ): Promise<DatabaseResult<QuotaCheckResult>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'check_user_upload_quota',
        {
          p_user_id: userId,
          p_file_size: fileSize,
        }
      );

      if (error) {
        console.error('Failed to check user quota:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as QuotaCheckResult };
    } catch (error) {
      console.error('Failed to check user quota:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check link upload quota before upload
   */
  async checkLinkQuota(
    linkId: string,
    fileSize: number
  ): Promise<DatabaseResult<QuotaCheckResult>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'check_link_upload_quota',
        {
          p_link_id: linkId,
          p_file_size: fileSize,
        }
      );

      if (error) {
        console.error('Failed to check link quota:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as QuotaCheckResult };
    } catch (error) {
      console.error('Failed to check link quota:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update storage usage after successful upload
   */
  async updateStorageUsage(
    userId: string,
    linkId: string | undefined,
    fileSize: number
  ): Promise<DatabaseResult<void>> {
    try {
      // Note: Storage usage is automatically updated by database triggers
      // when files are inserted/updated/deleted. This method is for manual updates
      // or when additional tracking is needed.

      console.log(
        `✅ STORAGE_USAGE_UPDATED: User ${userId}, Size ${fileSize}, Link ${linkId || 'none'}`
      );
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to update storage usage:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Upload file with comprehensive quota validation
   */
  async uploadFileWithQuotaCheck(
    file: File,
    path: string,
    userId: string,
    linkId?: string,
    context: StorageContext = 'workspace'
  ): Promise<DatabaseResult<UploadResult & { quotaInfo: QuotaInfo }>> {
    try {
      // 1. Validate user quota
      const userQuotaCheck = await this.checkUserQuota(userId, file.size);
      if (!userQuotaCheck.success) {
        return {
          success: false,
          error: userQuotaCheck.error,
        };
      }

      if (!userQuotaCheck.data!.allowed) {
        return {
          success: false,
          error: this.formatQuotaError(userQuotaCheck.data!),
        };
      }

      // 2. Validate link quota if applicable
      if (linkId) {
        const linkQuotaCheck = await this.checkLinkQuota(linkId, file.size);
        if (!linkQuotaCheck.success) {
          return {
            success: false,
            error: linkQuotaCheck.error,
          };
        }

        if (!linkQuotaCheck.data!.allowed) {
          return {
            success: false,
            error: this.formatQuotaError(linkQuotaCheck.data!),
          };
        }
      }

      // 3. Proceed with upload
      const uploadResult = await this.uploadFile(file, path, userId, context);
      if (!uploadResult.success) {
        return uploadResult as any;
      }

      // 4. Update usage tracking (handled automatically by triggers)
      await this.updateStorageUsage(userId, linkId, file.size);

      // 5. Return success with quota info
      const quotaInfo: QuotaInfo = {
        storageUsed: userQuotaCheck.data!.storageUsed || 0,
        storageLimit: userQuotaCheck.data!.storageLimit || 0,
        newUsage: userQuotaCheck.data!.storageUsed! + file.size,
        usagePercentage: userQuotaCheck.data!.usagePercentage || 0,
        subscriptionTier: userQuotaCheck.data!.subscriptionTier || 'free',
      };

      return {
        success: true,
        data: {
          ...uploadResult.data!,
          quotaInfo,
        },
      };
    } catch (error) {
      console.error('Failed to upload with quota check:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Format quota error for user-friendly display
   */
  private formatQuotaError(quotaResult: QuotaCheckResult): string {
    const QUOTA_ERROR_MESSAGES = {
      quota_exceeded: `Storage limit reached. You've used ${this.formatBytes(quotaResult.storageUsed || 0)} of ${this.formatBytes(quotaResult.storageLimit || 0)}. Upgrade your plan to continue uploading files.`,
      file_too_large: `File too large. This file (${this.formatBytes(quotaResult.currentFileSize || 0)}) exceeds your plan's ${this.formatBytes(quotaResult.maxFileSize || 0)} limit. Try compressing the file or upgrading your plan.`,
      link_quota_exceeded:
        'Link storage full. This link has reached its storage limit. Create a new link or upgrade your plan.',
      file_count_exceeded: 'Maximum file count reached for this link.',
      user_not_found: 'User not found.',
      link_not_found: 'Link not found.',
    } as const;

    return (
      QUOTA_ERROR_MESSAGES[
        quotaResult.error as keyof typeof QUOTA_ERROR_MESSAGES
      ] ||
      quotaResult.message ||
      'Quota check failed'
    );
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get storage usage summary for a user
   */
  async getStorageUsage(userId: string): Promise<
    DatabaseResult<{
      used: number;
      limit: number;
      percentage: number;
      tier: string;
      filesCount: number;
    }>
  > {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(
          'storage_used, storage_limit, files_uploaded'
          // Removed subscription_tier - now handled by Clerk
        )
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to get storage usage:', error);
        return { success: false, error: error.message };
      }

      const percentage = (data.storage_used / data.storage_limit) * 100;

      return {
        success: true,
        data: {
          used: data.storage_used,
          limit: data.storage_limit,
          percentage: Math.round(percentage * 100) / 100,
          tier: data.subscription_tier,
          filesCount: data.files_uploaded,
        },
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get subscription tier limits
   * @deprecated Use getPlanLimits() from @/lib/services/billing/plan-limits-service
   * or import from @/lib/config/plan-configuration for centralized configuration
   */
  getSubscriptionTierLimits(tier: 'free' | 'pro' | 'business') {
    console.warn('[DEPRECATED] getSubscriptionTierLimits: Use centralized plan configuration');
    
    // Import centralized configuration to ensure consistency
    const { getPlanFileSizeLimit, getPlanStorageLimit } = require('@/lib/config/plan-configuration');
    
    const TIER_LIMITS = {
      free: {
        storage: getPlanStorageLimit('free'),
        fileSize: getPlanFileSizeLimit('free'),
        links: 1,
      },
      pro: {
        storage: getPlanStorageLimit('pro'),
        fileSize: getPlanFileSizeLimit('pro'),
        links: 5,
      },
      business: {
        storage: getPlanStorageLimit('business'),
        fileSize: getPlanFileSizeLimit('business'),
        links: 25,
      },
    } as const;

    return TIER_LIMITS[tier];
  }
}

// Export singleton instance
export const storageService = new StorageService();
