// =============================================================================
// RATE LIMITING UTILITY
// =============================================================================
// Distributed rate limiting using Upstash Redis
// Uses sliding window algorithm for accurate rate limiting
// Serverless-safe: Works across multiple Vercel instances

import { redis } from '@/lib/redis/client';
import { logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';

interface RateLimitEntry {
  attempts: number[];  // Array of timestamps (milliseconds)
  blockedUntil?: number;  // Timestamp when block expires
}

interface RateLimitConfig {
  limit: number;  // Maximum requests allowed
  windowMs: number;  // Time window in milliseconds
  blockDurationMs?: number;  // How long to block after exceeding limit
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Timestamp when limit resets
  blocked: boolean;  // Whether currently blocked
}

/**
 * Redis key prefix for rate limiting
 * Keeps rate limit data organized in Redis
 */
const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Check if a request is within rate limits using sliding window algorithm
 * Uses Redis for distributed rate limiting across serverless instances
 *
 * @param key - Unique identifier for rate limiting (e.g., 'username-check:user_123' or 'ip:192.168.1.1')
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining attempts
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const { limit, windowMs, blockDurationMs = 60000 } = config;
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;

  // Get entry from Redis
  const entryData = await redis.get<RateLimitEntry>(redisKey);
  let entry: RateLimitEntry = entryData || { attempts: [] };

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    logRateLimitViolation('Rate limit blocked request', {
      action: 'rate_limit_block',
      key,
      limit,
      window: windowMs,
      attempts: entry.attempts.length,
      blockedUntil: entry.blockedUntil
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      blocked: true
    };
  }

  // Remove expired attempts (outside the time window)
  const windowStart = now - windowMs;
  entry.attempts = entry.attempts.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (entry.attempts.length >= limit) {
    // Block for the specified duration
    entry.blockedUntil = now + blockDurationMs;

    // Store in Redis with TTL (auto-cleanup after window + block duration)
    const ttlSeconds = Math.ceil((blockDurationMs + windowMs) / 1000);
    await redis.setex(redisKey, ttlSeconds, entry);

    logRateLimitViolation('Rate limit exceeded', {
      action: 'rate_limit_exceeded',
      key,
      limit,
      window: windowMs,
      attempts: entry.attempts.length
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      blocked: true
    };
  }

  // Add current attempt
  entry.attempts.push(now);

  // Store in Redis with TTL (auto-expires after window + block duration)
  const ttlSeconds = Math.ceil((windowMs + blockDurationMs) / 1000);
  await redis.setex(redisKey, ttlSeconds, entry);

  const remaining = limit - entry.attempts.length;
  const oldestAttempt = entry.attempts[0] || now;
  const resetAt = oldestAttempt + windowMs;

  return {
    allowed: true,
    remaining,
    resetAt,
    blocked: false
  };
}

/**
 * Reset rate limit for a specific key
 * @param key - Unique identifier to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  await redis.del(redisKey);
  logSecurityEvent('Rate limit reset', {
    action: 'rate_limit_reset',
    key
  });
}

/**
 * Get current rate limit status without incrementing
 * @param key - Unique identifier to check
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const { limit, windowMs } = config;
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  const entry = await redis.get<RateLimitEntry>(redisKey);

  if (!entry) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
      blocked: false
    };
  }

  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      blocked: true
    };
  }

  // Remove expired attempts
  const windowStart = now - windowMs;
  const validAttempts = entry.attempts.filter(timestamp => timestamp > windowStart);

  const remaining = Math.max(0, limit - validAttempts.length);
  const oldestAttempt = validAttempts[0] || now;
  const resetAt = oldestAttempt + windowMs;

  return {
    allowed: validAttempts.length < limit,
    remaining,
    resetAt,
    blocked: false
  };
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  // Strict: 5 requests per minute (username checks, sensitive operations)
  STRICT: {
    limit: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // Block for 5 minutes
  },

  // Moderate: 20 requests per minute (form submissions)
  MODERATE: {
    limit: 20,
    windowMs: 60000, // 1 minute
    blockDurationMs: 60000 // Block for 1 minute
  },

  // Generous: 100 requests per minute (general API calls)
  GENEROUS: {
    limit: 100,
    windowMs: 60000, // 1 minute
    blockDurationMs: 30000 // Block for 30 seconds
  },

  // File uploads: 10 uploads per 5 minutes
  FILE_UPLOAD: {
    limit: 10,
    windowMs: 300000, // 5 minutes
    blockDurationMs: 600000 // Block for 10 minutes
  },

  // Permission management: 10 requests per minute (add/remove/update permissions)
  PERMISSION_MANAGEMENT: {
    limit: 10,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // Block for 5 minutes
  },

  // Slug validation: 30 requests per minute (real-time slug availability checks)
  SLUG_VALIDATION: {
    limit: 30,
    windowMs: 60000, // 1 minute
    blockDurationMs: 60000 // Block for 1 minute
  }
} as const;

/**
 * Helper to generate rate limit keys
 */
export const RateLimitKeys = {
  // User actions
  usernameCheck: (userId: string) => `username-check:${userId}`,
  userAction: (userId: string, action: string) => `user:${userId}:${action}`,
  ipAction: (ip: string, action: string) => `ip:${ip}:${action}`,

  // File operations
  fileUpload: (userId: string) => `upload:${userId}`,
  linkCreation: (userId: string) => `link-create:${userId}`,

  // Email operations
  otpEmail: (email: string) => `otp-email:${email}`,
  emailNotification: (userId: string) => `email-notify:${userId}`,
  invitation: (userId: string) => `invitation:${userId}`,
  bulkInvitation: (userId: string) => `bulk-invite:${userId}`
} as const;

/**
 * Test Redis connection (for health checks)
 * @returns Promise resolving to true if Redis is accessible
 */
export async function testRateLimitConnection(): Promise<boolean> {
  try {
    const testKey = `${RATE_LIMIT_PREFIX}health-check`;
    await redis.setex(testKey, 10, { attempts: [] });
    const result = await redis.get(testKey);
    await redis.del(testKey);
    return result !== null;
  } catch (error) {
    logSecurityEvent('Rate limit Redis connection test failed', {
      action: 'health_check_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}
