import { userWorkspaceService } from '@/lib/services/workspace';
import type { DatabaseResult } from '@/lib/supabase/types';
import type { WebhookUserData } from '@/lib/webhooks';

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `⏳ RETRY_ATTEMPT: ${attempt}/${maxRetries} | Waiting ${delay}ms`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Graceful workspace creation with fallback strategies
 */
export async function createUserWithWorkspaceGraceful(
  userData: WebhookUserData
): Promise<DatabaseResult<any>> {
  try {
    // Primary path: Transactional creation
    console.log(
      `🎯 PRIMARY_PATH: Attempting transactional creation for ${userData.id}`
    );
    return await userWorkspaceService.createUserWithWorkspace(userData);
  } catch (error) {
    console.warn(
      `⚠️ FALLBACK_TRIGGERED: Transactional creation failed for ${userData.id}`,
      error
    );

    try {
      // Fallback path: Check if user already exists with workspace
      const existingUserWorkspace =
        await userWorkspaceService.getUserWithWorkspace(userData.id);
      if (existingUserWorkspace.success) {
        console.log(
          `✅ FALLBACK_SUCCESS: Found existing user+workspace for ${userData.id}`
        );
        return existingUserWorkspace;
      }

      // If no existing data, this is a genuine failure
      throw new Error('No existing user+workspace found and creation failed');
    } catch (fallbackError) {
      console.error(`❌ ALL_RECOVERY_FAILED: ${userData.id}`, fallbackError);
      return { success: false, error: (fallbackError as Error).message };
    }
  }
}

/**
 * Validate webhook processing prerequisites
 */
export function validateWebhookPrerequisites(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.CLERK_WEBHOOK_SECRET) {
    errors.push('CLERK_WEBHOOK_SECRET environment variable not set');
  }

  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    errors.push(
      'Database URL environment variable not set (need either POSTGRES_URL or DATABASE_URL)'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Enhanced webhook processing with retry and recovery
 */
export async function processWebhookWithRecovery(
  userData: WebhookUserData,
  maxRetries: number = 3
): Promise<DatabaseResult<any>> {
  // Validate prerequisites first
  const validation = validateWebhookPrerequisites();
  if (!validation.valid) {
    return {
      success: false,
      error: `Configuration errors: ${validation.errors.join(', ')}`,
    };
  }

  // Attempt with retry logic
  try {
    return await retryOperation(
      () => createUserWithWorkspaceGraceful(userData),
      maxRetries,
      1000
    );
  } catch (error) {
    console.error(
      `❌ WEBHOOK_PROCESSING_FAILED: All retries exhausted for ${userData.id}`,
      error
    );
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${(error as Error).message}`,
    };
  }
}
