// =============================================================================
// RATE LIMITER UTILITY
// =============================================================================
// Simple in-memory rate limiter for server actions
// For production, consider using Redis or a dedicated rate limiting service

import { createErrorResponse, ERROR_CODES } from '@/lib/types/error-response';
import { logger } from '@/lib/services/logging/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limiting
// In production, this should be Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  // Maximum number of requests allowed
  maxRequests: number;
  // Time window in milliseconds
  windowMs: number;
  // Key prefix for namespacing
  keyPrefix?: string;
  // Whether to skip successful requests
  skipSuccessfulRequests?: boolean;
  // Whether to skip failed requests
  skipFailedRequests?: boolean;
}

/**
 * Rate limiter for server actions
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const {
    maxRequests,
    windowMs,
    keyPrefix = 'rate_limit',
  } = config;

  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    const resetTime = now + windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    logger.warn('Rate limit exceeded', {
      identifier,
      keyPrefix,
      count: entry.count,
      maxRequests,
      retryAfter,
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create a rate limited server action wrapper
 * @param action - The server action to wrap
 * @param config - Rate limit configuration
 * @returns Rate limited version of the action
 */
export function withRateLimit<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  config: RateLimitConfig & {
    getIdentifier: (...args: TArgs) => string | null;
  }
) {
  return async (...args: TArgs): Promise<TResult> => {
    const identifier = config.getIdentifier(...args);
    
    if (!identifier) {
      // If no identifier, skip rate limiting
      return action(...args);
    }
    
    const rateLimitResult = checkRateLimit(identifier, config);
    
    if (!rateLimitResult.allowed) {
      throw new Error(
        `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`
      );
    }
    
    try {
      const result = await action(...args);
      
      // Optionally don't count successful requests
      if (config.skipSuccessfulRequests) {
        const key = `${config.keyPrefix}:${identifier}`;
        const entry = rateLimitStore.get(key);
        if (entry && entry.count > 0) {
          entry.count--;
          rateLimitStore.set(key, entry);
        }
      }
      
      return result;
    } catch (error) {
      // Optionally don't count failed requests
      if (config.skipFailedRequests) {
        const key = `${config.keyPrefix}:${identifier}`;
        const entry = rateLimitStore.get(key);
        if (entry && entry.count > 0) {
          entry.count--;
          rateLimitStore.set(key, entry);
        }
      }
      
      throw error;
    }
  };
}

/**
 * Rate limiting configuration for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  // Strict rate limiting for authentication actions
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth',
  },
  
  // Moderate rate limiting for API calls
  API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'api',
  },
  
  // Lenient rate limiting for search/validation
  VALIDATION: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'validation',
  },
  
  // Very strict rate limiting for sensitive operations
  SENSITIVE: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'sensitive',
  },
} as const;