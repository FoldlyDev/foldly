'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { HardDrive, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useStorageTracking, useStorageQuotaStatus } from '../../hooks';
import { useLiveStorage } from '../../hooks/use-live-storage';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface StorageInfoDisplayProps {
  showHeader?: boolean;
  compact?: boolean;
  className?: string | undefined;
  showLiveUpdates?: boolean;
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
  showLiveUpdates = true,
}: StorageInfoDisplayProps) {
  const { storageInfo, isLoading, formatSize } = useStorageTracking();
  const quotaStatus = useStorageQuotaStatus();
  const liveStorage = useLiveStorage();
  
  // Use live data if available and uploads are in progress
  const displayUsage = showLiveUpdates && liveStorage.isUploading 
    ? liveStorage.realtimeUsage 
    : storageInfo.storageUsedBytes;
  
  const projectedUsage = showLiveUpdates && liveStorage.isUploading
    ? liveStorage.projectedUsage
    : storageInfo.storageUsedBytes;
  
  const usagePercentage = (displayUsage / storageInfo.storageLimitBytes) * 100;
  const projectedPercentage = (projectedUsage / storageInfo.storageLimitBytes) * 100;

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
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

  const getProgressGradient = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
        return 'from-red-500 to-red-600';
      case 'critical':
        return 'from-red-400 to-red-500';
      case 'warning':
        return 'from-yellow-400 to-yellow-500';
      default:
        return 'from-blue-500 to-indigo-500';
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

  const getIconBackground = () => {
    switch (quotaStatus.status) {
      case 'exceeded':
        return 'bg-red-100';
      case 'critical':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      default:
        return 'bg-blue-100';
    }
  };

  const progressValue = Math.min(usagePercentage, 100);
  const projectedValue = Math.min(projectedPercentage, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl transition-colors', getIconBackground())}>
              <HardDrive className={cn('w-5 h-5', getStatusColor())} />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">
                Storage Usage
              </span>
              {liveStorage.isUploading && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 mt-0.5"
                >
                  <Upload className="w-3 h-3 text-blue-500 animate-pulse" />
                  <span className="text-xs text-blue-600 font-medium">Live tracking</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Premium Progress Bar */}
        <div className="relative">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-shimmer" />
            </div>
            
            {/* Projected usage (if uploading) */}
            <AnimatePresence>
              {liveStorage.isUploading && (
                <motion.div
                  initial={{ width: `${progressValue}%` }}
                  animate={{ width: `${projectedValue}%` }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-y-0 left-0 bg-gray-300/50 rounded-full"
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
            
            {/* Current/Real-time usage with gradient */}
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-sm',
                getProgressGradient()
              )}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          
        </div>

        {/* Usage details - Premium card style */}
        {!compact && (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-200/50',
            'text-sm'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', getIconBackground())}>
                <span className={getStatusColor()}>
                  {getStatusIcon()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatSize(displayUsage)} / {formatSize(storageInfo.storageLimitBytes)}
                  {liveStorage.isUploading && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-blue-600 ml-1 font-semibold"
                    >
                      +{formatSize(liveStorage.uploadingBytes)}
                    </motion.span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {storageInfo.filesCount} files • {formatSize(storageInfo.remainingBytes)} remaining
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-700">
                {storageInfo.planKey.charAt(0).toUpperCase() + storageInfo.planKey.slice(1)}
              </p>
              <p className="text-xs text-gray-500">
                plan
              </p>
            </div>
          </div>
        )}

        {/* Status message - Premium alert style */}
        <AnimatePresence>
          {quotaStatus.status !== 'safe' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'overflow-hidden rounded-xl border',
                quotaStatus.status === 'exceeded' 
                  ? 'bg-red-50/80 border-red-200/50'
                  : quotaStatus.status === 'critical'
                  ? 'bg-red-50/60 border-red-200/40'
                  : 'bg-yellow-50/80 border-yellow-200/50'
              )}
            >
              <div className="flex items-start gap-3 p-3">
                <div className={cn(
                  'p-1.5 rounded-lg flex-shrink-0',
                  quotaStatus.status === 'exceeded' || quotaStatus.status === 'critical'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                )}>
                  <AlertTriangle className={cn(
                    "w-4 h-4",
                    quotaStatus.status === 'exceeded' || quotaStatus.status === 'critical'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  )} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    quotaStatus.status === 'exceeded' || quotaStatus.status === 'critical'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  )}>
                    {quotaStatus.message}
                  </p>
                  {liveStorage.isUploading && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatSize(Math.max(0, storageInfo.storageLimitBytes - projectedUsage))} will remain after uploads
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        return {
          container: 'from-red-50 to-red-100/50 border-red-200/50',
          icon: 'bg-red-100 text-red-600',
          text: 'text-red-800',
          subtext: 'text-red-700'
        };
      case 'critical':
        return {
          container: 'from-red-50/80 to-orange-50/50 border-red-200/40',
          icon: 'bg-red-100 text-red-500',
          text: 'text-red-700',
          subtext: 'text-red-600'
        };
      case 'warning':
        return {
          container: 'from-yellow-50 to-amber-50/50 border-yellow-200/50',
          icon: 'bg-yellow-100 text-yellow-600',
          text: 'text-yellow-800',
          subtext: 'text-yellow-700'
        };
      default:
        return {
          container: 'from-blue-50 to-indigo-50/50 border-blue-200/50',
          icon: 'bg-blue-100 text-blue-600',
          text: 'text-blue-800',
          subtext: 'text-blue-700'
        };
    }
  };

  const styles = getBannerStyles();
  const usagePercentage = Math.round((storageInfo.storageUsedBytes / storageInfo.storageLimitBytes) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-r p-4',
        styles.container
      )}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-current rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-current rounded-full blur-3xl" />
      </div>

      <div className="relative flex items-start gap-3">
        <motion.div 
          className={cn('p-2 rounded-xl flex-shrink-0', styles.icon)}
          animate={{ 
            scale: quotaStatus.status === 'exceeded' ? [1, 1.1, 1] : 1,
          }}
          transition={{ 
            duration: 1.5,
            repeat: quotaStatus.status === 'exceeded' ? Infinity : 0,
            ease: 'easeInOut'
          }}
        >
          <AlertTriangle className="w-5 h-5" />
        </motion.div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className={cn("text-sm font-semibold", styles.text)}>
                {quotaStatus.message}
              </p>
              <p className={cn("text-xs", styles.subtext)}>
                Using {formatSize(storageInfo.storageUsedBytes)} of {formatSize(storageInfo.storageLimitBytes)}
                {storageInfo.remainingBytes > 0 && (
                  <> • {formatSize(storageInfo.remainingBytes)} remaining</>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className={cn("text-2xl font-bold", styles.text)}>
                {usagePercentage}%
              </p>
              <p className={cn("text-xs", styles.subtext)}>used</p>
            </div>
          </div>
          
          {/* Mini progress bar */}
          <div className="relative h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                quotaStatus.status === 'exceeded' ? 'bg-red-500' :
                quotaStatus.status === 'critical' ? 'bg-red-400' :
                quotaStatus.status === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}