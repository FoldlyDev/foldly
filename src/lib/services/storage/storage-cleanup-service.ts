import { db } from '@/lib/database/connection';
import { files, workspaces, links } from '@/lib/database/schemas';
import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { StorageService } from './storage-operations-service';
import { createClient } from '@supabase/supabase-js';
import type { DatabaseResult } from '@/lib/database/types/common';
import { UPLOAD_CONFIG } from '@/features/workspace/lib/config/upload-config';

/**
 * Storage Cleanup Service
 * Handles cleanup of partial uploads and orphaned files
 */
export class StorageCleanupService {
  private readonly PARTIAL_UPLOAD_TIMEOUT = UPLOAD_CONFIG.cleanup.partialUploadTimeout;
  private storageService: StorageService;

  constructor() {
    // Initialize storage service with service role for admin operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    this.storageService = new StorageService(supabaseClient);
  }

  /**
   * Clean up partial uploads that are older than the timeout
   */
  async cleanupPartialUploads(): Promise<DatabaseResult<{ cleaned: number }>> {
    try {
      const cutoffTime = new Date(Date.now() - this.PARTIAL_UPLOAD_TIMEOUT);
      
      // Find partial uploads (files with no checksum and old upload date)
      const partialFiles = await db
        .select()
        .from(files)
        .where(
          and(
            isNull(files.checksum),
            lt(files.uploadedAt, cutoffTime),
            eq(files.processingStatus, 'pending')
          )
        );

      let cleanedCount = 0;

      for (const file of partialFiles) {
        try {
          // Delete from storage if path exists
          if (file.storagePath) {
            const context = file.linkId ? 'shared' : 'workspace';
            await this.storageService.deleteFile(file.storagePath, context);
          }

          // Delete from database
          await db.delete(files).where(eq(files.id, file.id));
          cleanedCount++;
          
          console.log(`🧹 CLEANED_PARTIAL_UPLOAD: ${file.fileName} (${file.id})`);
        } catch (error) {
          console.error(`Failed to clean partial upload ${file.id}:`, error);
        }
      }

      return {
        success: true,
        data: { cleaned: cleanedCount },
      };
    } catch (error) {
      console.error('Failed to cleanup partial uploads:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  }

  /**
   * Clean up orphaned storage files (files in storage but not in database)
   */
  async cleanupOrphanedFiles(
    userId: string,
    context: 'workspace' | 'shared' = 'workspace'
  ): Promise<DatabaseResult<{ cleaned: number }>> {
    try {
      // List all files in user's storage
      const storageFiles = await this.storageService.listFiles(
        userId,
        context
      );

      if (!storageFiles.success) {
        return {
          success: false,
          error: storageFiles.error,
        };
      }

      // Get all database records for this user through workspace and link relationships
      const workspaceFiles = await db
        .select({ storagePath: files.storagePath })
        .from(files)
        .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
        .where(eq(workspaces.userId, userId));

      const linkFiles = await db
        .select({ storagePath: files.storagePath })
        .from(files)
        .innerJoin(links, eq(files.linkId, links.id))
        .where(eq(links.userId, userId));

      const dbFiles = [...workspaceFiles, ...linkFiles];
      const dbPaths = new Set(dbFiles.map(f => f.storagePath).filter(Boolean));
      let cleanedCount = 0;

      // Find orphaned files (in storage but not in database)
      for (const storageFile of storageFiles.data || []) {
        const fullPath = `${userId}/${storageFile.name}`;
        
        if (!dbPaths.has(fullPath) && !storageFile.name.includes('.emptyFolderPlaceholder')) {
          try {
            await this.storageService.deleteFile(fullPath, context);
            cleanedCount++;
            console.log(`🧹 CLEANED_ORPHANED_FILE: ${fullPath}`);
          } catch (error) {
            console.error(`Failed to clean orphaned file ${fullPath}:`, error);
          }
        }
      }

      return {
        success: true,
        data: { cleaned: cleanedCount },
      };
    } catch (error) {
      console.error('Failed to cleanup orphaned files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  }

  /**
   * Clean up files by workspace ID
   */
  async cleanupWorkspaceFiles(
    workspaceId: string
  ): Promise<DatabaseResult<{ cleaned: number }>> {
    try {
      const cutoffTime = new Date(Date.now() - this.PARTIAL_UPLOAD_TIMEOUT);
      
      // Find partial uploads for this workspace
      const partialFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.workspaceId, workspaceId),
            isNull(files.checksum),
            lt(files.uploadedAt, cutoffTime),
            eq(files.processingStatus, 'pending')
          )
        );

      let cleanedCount = 0;

      for (const file of partialFiles) {
        try {
          // Delete from storage if path exists
          if (file.storagePath) {
            await this.storageService.deleteFile(file.storagePath, 'workspace');
          }

          // Delete from database
          await db.delete(files).where(eq(files.id, file.id));
          cleanedCount++;
          
          console.log(`🧹 CLEANED_WORKSPACE_FILE: ${file.fileName} (${file.id})`);
        } catch (error) {
          console.error(`Failed to clean workspace file ${file.id}:`, error);
        }
      }

      return {
        success: true,
        data: { cleaned: cleanedCount },
      };
    } catch (error) {
      console.error('Failed to cleanup workspace files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  }

  /**
   * Run a full cleanup for a user
   */
  async runFullCleanup(userId: string): Promise<DatabaseResult<{
    partialCleaned: number;
    orphanedCleaned: number;
  }>> {
    try {
      // Clean partial uploads
      const partialResult = await this.cleanupPartialUploads();
      
      // Clean orphaned files
      const workspaceOrphans = await this.cleanupOrphanedFiles(userId, 'workspace');
      const sharedOrphans = await this.cleanupOrphanedFiles(userId, 'shared');

      const totalOrphaned = 
        (workspaceOrphans.success ? workspaceOrphans.data!.cleaned : 0) +
        (sharedOrphans.success ? sharedOrphans.data!.cleaned : 0);

      return {
        success: true,
        data: {
          partialCleaned: partialResult.success ? partialResult.data!.cleaned : 0,
          orphanedCleaned: totalOrphaned,
        },
      };
    } catch (error) {
      console.error('Failed to run full cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Full cleanup failed',
      };
    }
  }

  /**
   * Schedule periodic cleanup (to be called by a cron job or background worker)
   */
  async schedulePeriodicCleanup(): Promise<void> {
    console.log('🧹 Starting periodic storage cleanup...');
    
    try {
      const result = await this.cleanupPartialUploads();
      
      if (result.success) {
        console.log(`✅ Periodic cleanup completed: ${result.data!.cleaned} partial uploads removed`);
      } else {
        console.error('❌ Periodic cleanup failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Periodic cleanup error:', error);
    }
  }
}

export const storageCleanupService = new StorageCleanupService();