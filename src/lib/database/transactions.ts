// =============================================================================
// DATABASE TRANSACTIONS
// =============================================================================
// Transaction wrapper utilities for atomic multi-step database operations

import { db } from './connection';
import { logger, logSecurityEvent, logSecurityIncident } from '@/lib/utils/logger';

/**
 * Transaction callback type
 * Receives a transaction instance that can be used for database operations
 */
type TransactionCallback<T> = (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
) => Promise<T>;

/**
 * Transaction options
 */
interface TransactionOptions {
  /**
   * Transaction name for logging purposes
   */
  name?: string;

  /**
   * Maximum retry attempts on transaction failure
   */
  maxRetries?: number;

  /**
   * Context for logging (userId, action, etc.)
   */
  context?: Record<string, unknown>;
}

/**
 * Transaction result
 */
interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retries?: number;
}

/**
 * Execute a database transaction with automatic rollback on error
 *
 * @param callback - Function to execute within transaction
 * @param options - Transaction options
 * @returns Transaction result with success status
 *
 * @example
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.insert(users).values(userData).returning();
 *   const workspace = await tx.insert(workspaces).values(workspaceData).returning();
 *   return { user, workspace };
 * }, { name: 'create-user-workspace' });
 *
 * if (result.success) {
 *   console.log('Transaction completed:', result.data);
 * }
 * ```
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  const { name = 'unnamed', maxRetries = 0, context = {} } = options;
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Log transaction start
      logSecurityEvent('Transaction started', {
        action: 'transaction_start',
        transaction: name,
        attempt: retries + 1,
        ...context
      });

      const startTime = Date.now();

      // Execute transaction
      const result = await db.transaction(async (tx) => {
        return await callback(tx);
      });

      const duration = Date.now() - startTime;

      // Log transaction success
      logSecurityEvent('Transaction completed', {
        action: 'transaction_complete',
        transaction: name,
        duration,
        attempt: retries + 1,
        ...context
      });

      return {
        success: true,
        data: result,
        retries
      };

    } catch (error) {
      retries++;
      const isLastAttempt = retries > maxRetries;

      // Log transaction error
      if (isLastAttempt) {
        logSecurityIncident('Transaction failed permanently', {
          action: 'transaction_failed',
          transaction: name,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempts: retries,
          ...context
        });
      } else {
        logger.warn('Transaction failed, retrying...', {
          transaction: name,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: retries,
          maxRetries,
          ...context
        });
      }

      // If last attempt, return error
      if (isLastAttempt) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Transaction failed',
          retries: retries - 1
        };
      }

      // Wait before retry (exponential backoff: 100ms, 200ms, 400ms...)
      await new Promise(resolve => setTimeout(resolve, Math.min(100 * Math.pow(2, retries - 1), 1000)));
    }
  }

  // Fallback (should never reach here)
  return {
    success: false,
    error: 'Transaction failed after maximum retries',
    retries: maxRetries
  };
}

/**
 * Execute multiple operations in a single transaction
 * Helper for common pattern of multiple sequential operations
 *
 * @param operations - Array of operations to execute
 * @param options - Transaction options
 * @returns Transaction result
 *
 * @example
 * ```typescript
 * const result = await executeInTransaction([
 *   (tx) => tx.insert(users).values(userData).returning(),
 *   (tx) => tx.insert(workspaces).values(workspaceData).returning(),
 * ], { name: 'bulk-insert' });
 * ```
 */
export async function executeInTransaction<T = any>(
  operations: TransactionCallback<any>[],
  options: TransactionOptions = {}
): Promise<TransactionResult<T[]>> {
  return withTransaction(
    async (tx) => {
      const results: any[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    },
    {
      ...options,
      name: options.name || `bulk-operations-${operations.length}`
    }
  );
}

/**
 * Check if an error is a serialization error (can be retried)
 * @param error - Error to check
 * @returns True if serialization error
 */
export function isSerializationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('serialization') ||
    message.includes('deadlock') ||
    message.includes('could not serialize')
  );
}

/**
 * Check if an error is a constraint violation (should not be retried)
 * @param error - Error to check
 * @returns True if constraint violation
 */
export function isConstraintViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('unique constraint') ||
    message.includes('foreign key constraint') ||
    message.includes('check constraint') ||
    message.includes('not null violation')
  );
}

/**
 * Transaction helper for onboarding flow
 * Creates user, workspace, and first link atomically
 */
export async function onboardingTransaction(params: {
  userId: string;
  userData: any;
  workspaceData: any;
  linkData: any;
  permissionData: any;
}): Promise<TransactionResult<{ user: any; workspace: any; link: any; permission: any }>> {
  const { users, workspaces, links, permissions } = await import('./schemas');

  return withTransaction(
    async (tx) => {
      // Step 1: Create user
      const [user] = await tx.insert(users).values(params.userData).returning();

      // Step 2: Create workspace
      const [workspace] = await tx.insert(workspaces).values(params.workspaceData).returning();

      // Step 3: Create first link
      const [link] = await tx.insert(links).values(params.linkData).returning();

      // Step 4: Create owner permission
      const [permission] = await tx.insert(permissions).values(params.permissionData).returning();

      return { user, workspace, link, permission };
    },
    {
      name: 'onboarding',
      maxRetries: 2,
      context: { userId: params.userId }
    }
  );
}
