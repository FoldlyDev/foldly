/**
 * Optimistic Update Utilities for Workspace Operations
 * Provides rollback capabilities for failed operations
 */

import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';

interface OptimisticUpdate<T> {
  previousState: T;
  newState: T;
  operation: string;
  timestamp: number;
}

class OptimisticUpdateManager {
  private updates = new Map<string, OptimisticUpdate<any>>();
  private rollbackTimeout = 30000; // 30 seconds before auto-cleanup

  /**
   * Record an optimistic update for potential rollback
   */
  record<T>(
    key: string,
    previousState: T,
    newState: T,
    operation: string
  ): string {
    const updateId = `${key}-${Date.now()}`;
    
    this.updates.set(updateId, {
      previousState,
      newState,
      operation,
      timestamp: Date.now(),
    });

    // Auto-cleanup after timeout
    setTimeout(() => {
      this.updates.delete(updateId);
    }, this.rollbackTimeout);

    return updateId;
  }

  /**
   * Get the previous state for rollback
   */
  getRollbackState<T>(updateId: string): T | null {
    const update = this.updates.get(updateId);
    return update ? update.previousState : null;
  }

  /**
   * Complete an update (remove from tracking)
   */
  complete(updateId: string): void {
    this.updates.delete(updateId);
  }

  /**
   * Rollback an update and notify user
   */
  rollback<T>(
    updateId: string,
    applyRollback: (state: T) => void,
    errorMessage?: string
  ): boolean {
    const update = this.updates.get(updateId);
    
    if (!update) {
      console.warn(`[OptimisticUpdateManager] No update found for rollback: ${updateId}`);
      return false;
    }

    // Apply the rollback
    applyRollback(update.previousState);

    // Notify user of rollback
    eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
      fileId: '',
      fileName: update.operation,
      error: errorMessage || `Failed to ${update.operation}. Changes have been reverted.`,
    }, {
      priority: NotificationPriority.HIGH,
      uiType: NotificationUIType.TOAST_SIMPLE,
      duration: 5000,
    });

    // Clean up
    this.updates.delete(updateId);
    
    return true;
  }

  /**
   * Clear all tracked updates
   */
  clear(): void {
    this.updates.clear();
  }
}

// Export singleton instance
export const optimisticUpdateManager = new OptimisticUpdateManager();

/**
 * Higher-order function to wrap async operations with optimistic updates and rollback
 */
export async function withOptimisticUpdate<T, R>(
  options: {
    key: string;
    operation: string;
    getCurrentState: () => T;
    applyOptimisticState: (state: T) => T;
    applyState: (state: T) => void;
    performOperation: () => Promise<R>;
    validateResult?: (result: R) => boolean;
    onError?: (error: any) => void;
  }
): Promise<R | null> {
  const {
    key,
    operation,
    getCurrentState,
    applyOptimisticState,
    applyState,
    performOperation,
    validateResult,
    onError,
  } = options;

  // Get current state
  const previousState = getCurrentState();
  
  // Apply optimistic update
  const optimisticState = applyOptimisticState(previousState);
  applyState(optimisticState);
  
  // Record for potential rollback
  const updateId = optimisticUpdateManager.record(
    key,
    previousState,
    optimisticState,
    operation
  );

  try {
    // Perform the actual operation
    const result = await performOperation();
    
    // Validate result if validator provided
    if (validateResult && !validateResult(result)) {
      throw new Error(`${operation} validation failed`);
    }

    // Success - complete the update
    optimisticUpdateManager.complete(updateId);
    return result;
  } catch (error) {
    // Rollback on error
    optimisticUpdateManager.rollback(
      updateId,
      applyState,
      error instanceof Error ? error.message : `${operation} failed`
    );
    
    // Call error handler if provided
    onError?.(error);
    
    return null;
  }
}

/**
 * Batch optimistic updates for multiple operations
 */
export async function withBatchOptimisticUpdate<T, R>(
  operations: Array<{
    key: string;
    operation: string;
    getCurrentState: () => T;
    applyOptimisticState: (state: T) => T;
    applyState: (state: T) => void;
    performOperation: () => Promise<R>;
  }>
): Promise<Array<{ success: boolean; result?: R; error?: any }>> {
  const updateIds: Array<{ updateId: string; applyState: (state: T) => void }> = [];
  
  // Apply all optimistic updates
  operations.forEach(op => {
    const previousState = op.getCurrentState();
    const optimisticState = op.applyOptimisticState(previousState);
    op.applyState(optimisticState);
    
    const updateId = optimisticUpdateManager.record(
      op.key,
      previousState,
      optimisticState,
      op.operation
    );
    
    updateIds.push({ updateId, applyState: op.applyState });
  });

  // Perform all operations
  const results = await Promise.allSettled(
    operations.map(op => op.performOperation())
  );

  // Process results and rollback failures
  const processedResults = results.map((result, index) => {
    const updateInfo = updateIds[index];
    if (!updateInfo) return { success: false, error: 'Update info not found' };
    
    const { updateId, applyState } = updateInfo;
    
    if (result.status === 'fulfilled') {
      optimisticUpdateManager.complete(updateId);
      return { success: true, result: result.value };
    } else {
      optimisticUpdateManager.rollback(
        updateId,
        applyState,
        operations[index] ? `${operations[index].operation} failed` : 'Operation failed'
      );
      return { success: false, error: result.reason };
    }
  });

  return processedResults;
}