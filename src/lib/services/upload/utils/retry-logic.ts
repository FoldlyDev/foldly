/**
 * Upload Retry Logic
 * Handles retry strategies and error recovery
 */

import type { UploadHandle } from '../types';
import { logger } from '@/lib/services/logging/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelays: number[]; // milliseconds between retries
  retryableErrors: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelays: [1000, 2000, 5000], // Exponential backoff
  retryableErrors: [
    'Network error',
    'Upload timeout',
    'status 502',
    'status 503',
    'status 504',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
};

/**
 * Retry Manager Class
 * Manages retry logic for failed uploads
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Check if upload should be retried
   */
  shouldRetry(handle: UploadHandle, error: any): boolean {
    // Check retry count
    if (handle.retryCount >= this.config.maxRetries) {
      logger.info('Max retries reached', {
        uploadId: handle.id,
        retryCount: handle.retryCount,
        maxRetries: this.config.maxRetries,
      });
      return false;
    }

    // Check if error is retryable
    const errorMessage = this.getErrorMessage(error);
    const isRetryable = this.isRetryableError(errorMessage);
    
    if (!isRetryable) {
      logger.info('Non-retryable error', {
        uploadId: handle.id,
        error: errorMessage,
      });
    }

    return isRetryable;
  }

  /**
   * Get delay before next retry
   */
  getRetryDelay(retryCount: number): number {
    const delayIndex = Math.min(retryCount - 1, this.config.retryDelays.length - 1);
    return this.config.retryDelays[delayIndex] || 5000;
  }

  /**
   * Execute retry with delay
   */
  async executeRetry<T>(
    handle: UploadHandle,
    operation: () => Promise<T>
  ): Promise<T> {
    handle.retryCount++;
    
    const delay = this.getRetryDelay(handle.retryCount);
    
    logger.info('Retrying upload', {
      uploadId: handle.id,
      fileName: handle.file.name,
      retryCount: handle.retryCount,
      delay,
    });

    // Wait before retry
    await this.delay(delay);
    
    // Reset upload state for retry
    handle.progress = 0;
    handle.controller = new AbortController();
    delete handle.error;
    
    // Execute operation
    return operation();
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();
    return this.config.retryableErrors.some(pattern => 
      lowerMessage.includes(pattern.toLowerCase())
    );
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.error) {
      return this.getErrorMessage(error.error);
    }
    
    return JSON.stringify(error);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Error classification utilities
 */
export const ErrorClassifier = {
  /**
   * Check if error is network-related
   */
  isNetworkError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    const networkPatterns = [
      'network',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'fetch failed',
      'Failed to fetch',
    ];
    
    return networkPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  /**
   * Check if error is timeout-related
   */
  isTimeoutError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    const timeoutPatterns = ['timeout', 'ETIMEDOUT', 'timed out'];
    
    return timeoutPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  /**
   * Check if error is server-related
   */
  isServerError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    const serverPatterns = ['500', '502', '503', '504', 'server error', 'internal server'];
    
    return serverPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  /**
   * Check if error is quota-related
   */
  isQuotaError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    const quotaPatterns = ['quota', 'storage limit', 'exceeded', 'insufficient storage'];
    
    return quotaPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  /**
   * Get error category
   */
  categorizeError(error: any): 'network' | 'timeout' | 'server' | 'quota' | 'client' | 'unknown' {
    if (this.isNetworkError(error)) return 'network';
    if (this.isTimeoutError(error)) return 'timeout';
    if (this.isServerError(error)) return 'server';
    if (this.isQuotaError(error)) return 'quota';
    
    const message = error?.message || error?.toString() || '';
    if (message.includes('400') || message.includes('401') || message.includes('403')) {
      return 'client';
    }
    
    return 'unknown';
  },
};