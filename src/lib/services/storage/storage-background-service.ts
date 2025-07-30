import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';

/**
 * Storage Background Service
 * Handles asynchronous storage operations to improve upload performance
 */
export class StorageBackgroundService {
  private updateQueue: Map<string, number> = new Map();
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;

  /**
   * Queue a storage usage update
   */
  queueStorageUpdate(userId: string, bytesToAdd: number): void {
    const currentBytes = this.updateQueue.get(userId) || 0;
    this.updateQueue.set(userId, currentBytes + bytesToAdd);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Start processing the update queue
   */
  private startProcessing(): void {
    if (this.isProcessing || this.updateQueue.size === 0) return;

    this.isProcessing = true;

    // Process updates every 5 seconds
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 5000);

    // Process immediately
    this.processQueue();
  }

  /**
   * Process all queued updates
   */
  private async processQueue(): Promise<void> {
    if (this.updateQueue.size === 0) {
      this.stopProcessing();
      return;
    }

    // Take a snapshot of current queue
    const updates = new Map(this.updateQueue);
    this.updateQueue.clear();

    // Process each user's updates
    for (const [userId, bytesToAdd] of updates) {
      try {
        await this.updateUserStorage(userId, bytesToAdd);
        console.log(`📊 BACKGROUND_STORAGE_UPDATE: User ${userId}, +${this.formatBytes(bytesToAdd)}`);
      } catch (error) {
        console.error(`Failed to update storage for user ${userId}:`, error);
        
        // Re-queue failed updates with exponential backoff
        const retryBytes = Math.floor(bytesToAdd * 0.9); // Slight reduction to account for potential duplicates
        if (retryBytes > 0) {
          this.queueStorageUpdate(userId, retryBytes);
        }
      }
    }
  }

  /**
   * Stop processing the queue
   */
  private stopProcessing(): void {
    this.isProcessing = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Update user's storage usage
   */
  private async updateUserStorage(
    userId: string,
    bytesToAdd: number
  ): Promise<DatabaseResult<void>> {
    try {
      await db
        .update(users)
        .set({
          storageUsed: sql`GREATEST(0, COALESCE(storage_used, 0) + ${bytesToAdd})`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to update storage usage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update storage usage' 
      };
    }
  }

  /**
   * Batch update multiple users' storage
   */
  async batchUpdateStorage(
    updates: Array<{ userId: string; bytesToAdd: number }>
  ): Promise<DatabaseResult<void>> {
    try {
      // Use a transaction for atomic updates
      await db.transaction(async (tx) => {
        for (const update of updates) {
          await tx
            .update(users)
            .set({
              storageUsed: sql`GREATEST(0, COALESCE(storage_used, 0) + ${update.bytesToAdd})`,
              updatedAt: new Date()
            })
            .where(eq(users.id, update.userId));
        }
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to batch update storage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to batch update storage' 
      };
    }
  }

  /**
   * Get pending updates count
   */
  getPendingUpdatesCount(): number {
    return this.updateQueue.size;
  }

  /**
   * Force process all pending updates (useful for shutdown)
   */
  async forceProcessAll(): Promise<void> {
    if (this.updateQueue.size === 0) return;

    console.log(`⚡ Force processing ${this.updateQueue.size} pending storage updates...`);
    await this.processQueue();
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Singleton instance
export const storageBackgroundService = new StorageBackgroundService();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('💾 Flushing pending storage updates before shutdown...');
    await storageBackgroundService.forceProcessAll();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('💾 Flushing pending storage updates before shutdown...');
    await storageBackgroundService.forceProcessAll();
    process.exit(0);
  });
}