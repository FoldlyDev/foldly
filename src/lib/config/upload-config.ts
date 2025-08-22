/**
 * Centralized Upload Configuration
 * Single source of truth for all upload-related settings
 * Handles both development (Supabase free tier) and production configurations
 */

import { PLAN_CONFIGURATION, type PlanKey } from './plan-configuration';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Determine if we're in production environment
 */
const isProduction = process.env.NODE_ENV === 'production' && 
                     process.env.NEXT_PUBLIC_SUPABASE_TIER !== 'free';

/**
 * Get environment-specific file size limits
 * Development: 5MB (Supabase free tier limit)
 * Production: Plan-specific limits (up to 5GB for business)
 */
function getEnvironmentFileSize(planKey: PlanKey): number {
  // In development or Supabase free tier, all plans limited to 5MB
  if (!isProduction) {
    return 5 * 1024 * 1024; // 5MB
  }
  
  // Production limits based on plan
  const productionLimits: Record<PlanKey, number> = {
    free: 100 * 1024 * 1024,     // 100MB
    pro: 1024 * 1024 * 1024,      // 1GB
    business: 5 * 1024 * 1024 * 1024, // 5GB
  };
  
  return productionLimits[planKey];
}

// =============================================================================
// UPLOAD CONFIGURATION
// =============================================================================

export const UPLOAD_CONFIG = {
  /**
   * File size limits by plan and environment
   */
  limits: {
    /**
     * Get max file size for a plan (environment-aware)
     */
    getMaxFileSize: (planKey: PlanKey): number => {
      const envLimit = getEnvironmentFileSize(planKey);
      const configuredLimit = parseInt(
        process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '0',
        10
      );
      
      // Use configured limit if set and smaller than environment limit
      if (configuredLimit > 0 && configuredLimit < envLimit) {
        return configuredLimit;
      }
      
      return envLimit;
    },
    
    /**
     * System absolute maximum (regardless of plan)
     */
    systemMax: isProduction 
      ? 5 * 1024 * 1024 * 1024  // 5GB in production
      : 5 * 1024 * 1024,         // 5MB in development
    
    /**
     * Chunk size for large file uploads (production only)
     */
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    
    /**
     * Threshold for enabling chunked uploads
     */
    chunkThreshold: 50 * 1024 * 1024, // Files > 50MB use chunking
    
    /**
     * Storage limits by plan (unchanged)
     */
    storage: {
      free: PLAN_CONFIGURATION.plans.free.storage_limit_gb * 1024 * 1024 * 1024,
      pro: PLAN_CONFIGURATION.plans.pro.storage_limit_gb * 1024 * 1024 * 1024,
      business: PLAN_CONFIGURATION.plans.business.storage_limit_gb * 1024 * 1024 * 1024,
    },
  },
  
  /**
   * Concurrent upload settings
   */
  concurrency: {
    maxConcurrentUploads: parseInt(process.env.NEXT_PUBLIC_MAX_CONCURRENT_UPLOADS || '3', 10),
    maxUploadsPerBatch: 10, // Supabase rate limit
    parallelChunks: 3, // For chunked uploads
  },
  
  /**
   * Retry configuration
   */
  retry: {
    maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_RETRIES || '3', 10),
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
  },
  
  /**
   * Timeout settings
   */
  timeouts: {
    upload: parseInt(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT || '300000', 10), // 5 minutes default
    processing: 60000, // 1 minute for post-processing
    chunkTimeout: 30000, // 30 seconds per chunk
  },
  
  /**
   * Rate limiting
   */
  rateLimit: {
    maxUploadsPerMinute: 10,
    windowDuration: 60000, // 1 minute
    burstAllowance: 2, // Allow 2 extra uploads in burst
  },
  
  /**
   * Security settings
   */
  security: {
    blockedExtensions: [
      '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.dmg', '.pkg', '.run', '.sh', '.bash', '.pif'
    ],
    allowedMimeTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
      videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
      archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    },
    maxFileNameLength: 255,
    sanitizeFilenames: true,
    requireVirusScan: isProduction,
    virusScanSizeLimit: 100 * 1024 * 1024, // Skip virus scan for files > 100MB
  },
  
  /**
   * Progress tracking
   */
  progress: {
    updateInterval: 100, // Update progress every 100ms
    smoothing: true, // Smooth progress updates
    trackPeakSpeed: true, // Track peak upload speed
    speedSampleSize: 10, // Number of samples for speed calculation
  },
  
  /**
   * Resume capability
   */
  resume: {
    enabled: isProduction, // Only in production
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    chunkRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
    useLocalStorage: true,
  },
  
  /**
   * Storage quota behavior
   */
  quota: {
    enforceHardLimit: true, // Fail uploads when quota exceeded
    warningThreshold: 0.8, // Warn at 80% usage
    criticalThreshold: 0.95, // Critical warning at 95%
    checkInterval: 60000, // Check quota every minute
    cacheQuotaResults: true,
    quotaCacheDuration: 300000, // Cache for 5 minutes
  },
  
  /**
   * Development/Debug settings
   */
  debug: {
    enableLogging: process.env.NODE_ENV === 'development',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    simulateSlowUploads: process.env.NEXT_PUBLIC_SIMULATE_SLOW_UPLOADS === 'true',
    simulatedDelay: 2000, // 2 second delay per chunk in simulation
  },
  
  /**
   * Feature flags
   */
  features: {
    chunkedUploads: isProduction,
    resumableUploads: isProduction,
    virusScanning: isProduction && process.env.NEXT_PUBLIC_ENABLE_VIRUS_SCAN === 'true',
    compressionBeforeUpload: false, // Future feature
    clientSideEncryption: false, // Future feature
    cdnIntegration: false, // Future feature - will enable when CDN is added
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get formatted file size limit for display
 */
export function getFormattedFileLimit(planKey: PlanKey): string {
  const bytes = UPLOAD_CONFIG.limits.getMaxFileSize(planKey);
  return formatBytes(bytes);
}

/**
 * Check if a file exceeds plan limits
 */
export function exceedsPlanLimit(fileSize: number, planKey: PlanKey): boolean {
  return fileSize > UPLOAD_CONFIG.limits.getMaxFileSize(planKey);
}

/**
 * Check if chunked upload should be used
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  return UPLOAD_CONFIG.features.chunkedUploads && 
         fileSize > UPLOAD_CONFIG.limits.chunkThreshold;
}

/**
 * Get number of chunks for a file
 */
export function calculateChunks(fileSize: number): number {
  if (!shouldUseChunkedUpload(fileSize)) return 1;
  return Math.ceil(fileSize / UPLOAD_CONFIG.limits.chunkSize);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file extension is blocked
 */
export function isBlockedExtension(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return UPLOAD_CONFIG.security.blockedExtensions.includes(ext as any);
}

/**
 * Get retry delay for attempt number
 */
export function getRetryDelay(attemptNumber: number): number {
  const delays = UPLOAD_CONFIG.retry.retryDelays;
  const index = Math.min(attemptNumber - 1, delays.length - 1);
  return delays[index] ?? delays[delays.length - 1] ?? 5000;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return UPLOAD_CONFIG.retry.retryableErrors.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type UploadConfig = typeof UPLOAD_CONFIG;
export type UploadLimits = typeof UPLOAD_CONFIG.limits;
export type UploadSecurity = typeof UPLOAD_CONFIG.security;
export type UploadFeatures = typeof UPLOAD_CONFIG.features;

// =============================================================================
// ENVIRONMENT NOTICE
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  console.info(
    '[Upload Config] Running in development mode with Supabase free tier limits (5MB max file size). ' +
    'Production limits will be available when deployed with paid Supabase plan.'
  );
}