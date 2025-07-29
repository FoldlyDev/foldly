'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStorageTracking, useStorageQuotaStatus } from '../../hooks';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface StorageInfoDisplayProps {
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Storage information display component
 * Shows current storage usage, quota, and status with visual indicators
 */
export function StorageInfoDisplay({
  showHeader = true,
  compact = false,
  className,
}: StorageInfoDisplayProps) {
  const { storageInfo, isLoading, formatSize } = useStorageTracking();
  const quotaStatus = useStorageQuotaStatus();

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Determine status colors and icons
  const getStatusColor = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
        return 'text-red-600';
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getProgressColor = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
        return 'bg-red-500';
      case 'critical':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusIcon = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
      case 'critical':
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const progressValue = Math.min(quotaStatus.percentage, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-3', className)}
    >
      {showHeader && (
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[var(--neutral-600)]" />
          <span className="text-sm font-medium text-[var(--neutral-700)]">
            Storage Usage
          </span>
        </div>
      )}

      <div className="space-y-2">
        {/* Progress bar */}
        <div className="relative">
          <Progress 
            value={progressValue} 
            className="h-2"
          />
          <div
            className={cn(
              'absolute inset-0 h-2 rounded-full transition-colors',
              getProgressColor()
            )}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        {/* Usage details */}
        <div className={cn(
          'flex items-center justify-between',
          compact ? 'text-xs' : 'text-sm'
        )}>
          <div className="flex items-center gap-2">
            <span className={getStatusColor()}>
              {getStatusIcon()}
            </span>
            <span className="text-[var(--neutral-600)]">
              {formatSize(storageInfo.storageUsedBytes)} used
            </span>
          </div>
          <span className="text-[var(--neutral-500)]">
            of {formatSize(storageInfo.storageLimitBytes)}
          </span>
        </div>

        {/* Status message */}
        {quotaStatus.status !== 'safe' && (
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-md',
            quotaStatus.status === 'exceeded' 
              ? 'bg-red-50 text-red-700'
              : quotaStatus.status === 'critical'
              ? 'bg-red-50 text-red-600'
              : 'bg-yellow-50 text-yellow-700'
          )}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">
              {quotaStatus.message}
            </span>
          </div>
        )}

        {/* Remaining space (only show if not compact and space is available) */}
        {!compact && storageInfo.remainingBytes > 0 && (
          <div className="text-xs text-[var(--neutral-500)]">
            {formatSize(storageInfo.remainingBytes)} remaining
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

/**
 * Compact storage info display for inline usage
 */
export function CompactStorageInfo({ className }: { className?: string }) {
  return (
    <StorageInfoDisplay 
      showHeader={false}
      compact={true}
      className={className}
    />
  );
}

// =============================================================================
// STORAGE WARNING BANNER
// =============================================================================

/**
 * Storage warning banner for critical storage situations
 */
export function StorageWarningBanner() {
  const quotaStatus = useStorageQuotaStatus();
  const { storageInfo, formatSize } = useStorageTracking();

  if (quotaStatus.status === 'safe') {
    return null;
  }

  const getBannerStyles = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'border rounded-lg p-3 mb-4',
        getBannerStyles()
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {quotaStatus.message}
          </p>
          <p className="text-xs mt-1">
            Using {formatSize(storageInfo.storageUsedBytes)} of {formatSize(storageInfo.storageLimitBytes)}
            {storageInfo.remainingBytes > 0 && (
              <> • {formatSize(storageInfo.remainingBytes)} remaining</>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}