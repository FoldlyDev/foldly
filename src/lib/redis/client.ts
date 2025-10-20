// =============================================================================
// UPSTASH REDIS CLIENT
// =============================================================================
// Configuration for Upstash Redis (distributed rate limiting)
// Provides singleton client instance for serverless-safe Redis operations

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

/**
 * Validates required Upstash environment variables
 */
function validateRedisEnv(): void {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      'UPSTASH_REDIS_REST_TOKEN environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }
}

// Validate environment variables
validateRedisEnv();

/**
 * Upstash Redis client singleton instance
 * Uses REST API for serverless compatibility
 *
 * @example
 * ```typescript
 * import { redis } from '@/lib/redis/client';
 *
 * // Set with expiration (auto-cleanup)
 * await redis.setex('key', 3600, { data: 'value' });
 *
 * // Get value
 * const data = await redis.get('key');
 *
 * // Delete value
 * await redis.del('key');
 * ```
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Tests Redis connection
 * Useful for health checks and debugging
 *
 * @returns Promise resolving to true if connection works, false otherwise
 *
 * @example
 * ```typescript
 * const isConnected = await testRedisConnection();
 * if (!isConnected) {
 *   console.error('Redis connection failed');
 * }
 * ```
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const testKey = 'health-check';
    const testValue = 'ok';

    // Try to set and get a test value
    await redis.setex(testKey, 10, testValue); // Expires in 10 seconds
    const result = await redis.get(testKey);

    if (result === testValue) {
      logger.info('Redis connection successful');
      await redis.del(testKey); // Cleanup
      return true;
    }

    logger.error('Redis connection test failed: value mismatch');
    return false;
  } catch (error) {
    logger.error('Redis connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}
