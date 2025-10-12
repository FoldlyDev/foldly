// =============================================================================
// RATE LIMITING UTILITY
// =============================================================================
// In-memory rate limiting for API endpoints and server actions
// Uses sliding window algorithm for accurate rate limiting

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
 * In-memory rate limit store
 * Note: This is reset on server restart. For production with multiple instances,
 * consider using Redis or Upstash for distributed rate limiting.
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Only run in server environment
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000); // Every 60 seconds
    }
  }

  /**
   * Clean up expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Remove if no recent attempts and not blocked
      const hasRecentAttempts = entry.attempts.some(timestamp => now - timestamp < 3600000); // Keep for 1 hour
      const isBlocked = entry.blockedUntil && entry.blockedUntil > now;

      if (!hasRecentAttempts && !isBlocked) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      logSecurityEvent('Rate limit store cleanup', {
        action: 'cleanup',
        entriesRemoved: keysToDelete.length,
        remainingEntries: this.store.size
      });
    }
  }

  /**
   * Get entry for a key
   */
  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Set entry for a key
   */
  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  /**
   * Delete entry for a key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get store size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Stop cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore();

/**
 * Check if a request is within rate limits using sliding window algorithm
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

  // Get or initialize entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { attempts: [] };
  }

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
    rateLimitStore.set(key, entry);

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
  rateLimitStore.set(key, entry);

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
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
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
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = config;
  const entry = rateLimitStore.get(key);

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
  }
} as const;

/**
 * Helper to generate rate limit keys
 */
export const RateLimitKeys = {
  usernameCheck: (userId: string) => `username-check:${userId}`,
  userAction: (userId: string, action: string) => `user:${userId}:${action}`,
  ipAction: (ip: string, action: string) => `ip:${ip}:${action}`,
  fileUpload: (userId: string) => `upload:${userId}`,
  linkCreation: (userId: string) => `link-create:${userId}`
} as const;

// Export store for testing purposes
export const __getRateLimitStore = () => rateLimitStore;
