'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/shadcn/progress';
import { HardDrive, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useStorageTracking, useStorageWarnings, formatBytes, useLiveStorage } from '../../hooks';
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
  const { data: storageInfo, isLoading } = useStorageTracking();
  const quotaStatus = useStorageWarnings();
  const liveStorage = useLiveStorage();

  // Use live data if available and uploads are in progress
  const displayUsage =
    showLiveUpdates && liveStorage.isUploading
      ? liveStorage.realtimeUsage
      : storageInfo?.storageUsed || 0;

  const projectedUsage =
    showLiveUpdates && liveStorage.isUploading
      ? liveStorage.projectedUsage
      : storageInfo?.storageUsed || 0;

  const storageLimit = storageInfo?.storageLimit || 1; // Avoid division by zero
  const usagePercentage = storageInfo?.usagePercentage || 0;
  const projectedPercentage = (projectedUsage / storageLimit) * 100;

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-muted rounded-xl'></div>
            <div className='flex-1 space-y-2'>
              <div className='h-4 bg-muted rounded w-3/4'></div>
              <div className='h-3 bg-muted rounded w-1/2'></div>
            </div>
          </div>
          <div className='h-2 bg-muted rounded-full w-full'></div>
        </div>
      </div>
    );
  }

  // Determine status colors and icons
  const getStatusColor = () => {
    switch (quotaStatus.warningLevel) {
      case 'critical': // Full storage
        return 'text-destructive';
      case 'critical':
        return 'text-destructive/90';
      case 'warning':
        return 'text-warning dark:text-warning';
      default:
        return 'text-success dark:text-success';
    }
  };

  const getProgressGradient = () => {
    switch (quotaStatus.warningLevel) {
      case 'critical': // Full storage
        return 'from-destructive to-destructive/80';
      case 'critical':
        return 'from-destructive/90 to-destructive/70';
      case 'warning':
        return 'from-warning to-warning/80';
      default:
        return 'from-success to-success/80';
    }
  };

  const getStatusIcon = () => {
    switch (quotaStatus.warningLevel) {
      case 'critical': // Full storage
      case 'critical':
      case 'warning':
        return <AlertTriangle className='w-4 h-4' />;
      default:
        return <CheckCircle className='w-4 h-4' />;
    }
  };

  const getIconBackground = () => {
    switch (quotaStatus.warningLevel) {
      case 'critical': // Full storage
        return 'bg-destructive/10';
      case 'critical':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-warning/10 dark:bg-warning/10';
      default:
        return 'bg-success/10 dark:bg-success/10';
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
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'p-2.5 rounded-xl transition-colors',
                getIconBackground()
              )}
            >
              <HardDrive className={cn('w-5 h-5', getStatusColor())} />
            </div>
            <div>
              <span className='text-sm font-semibold text-foreground'>
                Storage Usage
              </span>
              {liveStorage.isUploading && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='flex items-center gap-1.5 mt-0.5'
                >
                  <Upload className='w-3 h-3 text-primary dark:text-primary animate-pulse' />
                  <span className='text-xs text-primary dark:text-primary font-medium'>
                    Live tracking
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className='space-y-3'>
        {/* Premium Progress Bar */}
        <div className='relative'>
          <div className='relative h-3 bg-muted rounded-full overflow-hidden shadow-inner'>
            {/* Animated background pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent animate-shimmer' />
            </div>

            {/* Projected usage (if uploading) */}
            <AnimatePresence>
              {liveStorage.isUploading && (
                <motion.div
                  initial={{ width: `${progressValue}%` }}
                  animate={{ width: `${projectedValue}%` }}
                  exit={{ opacity: 0 }}
                  className='absolute inset-y-0 left-0 bg-muted-foreground/30 rounded-full'
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
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-shimmer' />
            </motion.div>
          </div>
        </div>

        {/* Usage details - Premium card style */}
        {!compact && (
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50',
              'text-sm'
            )}
          >
            <div className='flex items-center gap-3'>
              <div className={cn('p-1.5 rounded-lg', getIconBackground())}>
                <span className={getStatusColor()}>{getStatusIcon()}</span>
              </div>
              <div>
                <p className='font-medium text-foreground'>
                  {formatBytes(displayUsage)} /{' '}
                  {formatBytes(storageLimit)}
                  {liveStorage.isUploading && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='text-primary dark:text-primary ml-1 font-semibold'
                    >
                      +{formatBytes(liveStorage.uploadingBytes)}
                    </motion.span>
                  )}
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  {formatBytes(storageInfo?.availableSpace || 0)} remaining
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className='font-medium text-foreground/80'>
                {storageInfo?.plan ? storageInfo.plan.charAt(0).toUpperCase() + storageInfo.plan.slice(1) : 'Free'}
              </p>
              <p className='text-xs text-muted-foreground'>plan</p>
            </div>
          </div>
        )}

        {/* Status message - Premium alert style */}
        <AnimatePresence>
          {quotaStatus.warningLevel !== 'normal' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'overflow-hidden rounded-xl border',
                quotaStatus.isFull
                  ? 'bg-red-50/80 border-red-200/50'
                  : quotaStatus.isAtLimit
                    ? 'bg-red-50/60 border-red-200/40'
                    : 'bg-yellow-50/80 border-yellow-200/50'
              )}
            >
              <div className='flex items-start gap-3 p-3'>
                <div
                  className={cn(
                    'p-1.5 rounded-lg flex-shrink-0',
                    quotaStatus.isFull ||
                      quotaStatus.isAtLimit
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'w-4 h-4',
                      quotaStatus.isFull ||
                        quotaStatus.isAtLimit
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    )}
                  />
                </div>
                <div className='flex-1'>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      quotaStatus.isFull ||
                        quotaStatus.isAtLimit
                        ? 'text-destructive'
                        : 'text-warning'
                    )}
                  >
                    {quotaStatus.message}
                  </p>
                  {liveStorage.isUploading && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      {formatBytes(
                        Math.max(
                          0,
                          storageLimit - projectedUsage
                        )
                      )}{' '}
                      will remain after uploads
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
  const quotaStatus = useStorageWarnings();
  const { storageInfo, formatBytes } = useStorageTracking();

  if (quotaStatus.warningLevel === 'normal') {
    return null;
  }

  const getBannerStyles = () => {
    switch (quotaStatus.warningLevel) {
      case 'critical': // Full storage
        return {
          container:
            'from-destructive/10 to-destructive/5 border-destructive/30',
          icon: 'bg-destructive/10 text-destructive',
          text: 'text-destructive',
          subtext: 'text-destructive/90',
        };
      case 'critical':
        return {
          container:
            'from-destructive/10 to-destructive/5 border-destructive/20',
          icon: 'bg-destructive/10 text-destructive/90',
          text: 'text-destructive/90',
          subtext: 'text-destructive/80',
        };
      case 'warning':
        return {
          container: 'from-warning/10 to-warning/5 border-warning/30',
          icon: 'bg-warning/10 text-warning',
          text: 'text-warning',
          subtext: 'text-warning/90',
        };
      default:
        return {
          container: 'from-primary/10 to-primary/5 border-primary/30',
          icon: 'bg-primary/10 text-primary',
          text: 'text-primary',
          subtext: 'text-primary/90',
        };
    }
  };

  const styles = getBannerStyles();
  const usagePercentage = Math.round(
    storageInfo?.usagePercentage || 0
  );

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
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-current rounded-full blur-2xl' />
        <div className='absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-current rounded-full blur-3xl' />
      </div>

      <div className='relative flex items-start gap-3'>
        <motion.div
          className={cn('p-2 rounded-xl flex-shrink-0', styles.icon)}
          animate={{
            scale: quotaStatus.isFull ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: quotaStatus.isFull ? Infinity : 0,
            ease: 'easeInOut',
          }}
        >
          <AlertTriangle className='w-5 h-5' />
        </motion.div>

        <div className='flex-1 space-y-2'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <p className={cn('text-sm font-semibold', styles.text)}>
                {quotaStatus.message}
              </p>
              <p className={cn('text-xs', styles.subtext)}>
                Using {formatBytes(displayUsage)} of{' '}
                {formatBytes(storageLimit)}
                {(storageInfo?.availableSpace || 0) > 0 && (
                  <> • {formatBytes(storageInfo?.availableSpace || 0)} remaining</>
                )}
              </p>
            </div>
            <div className='text-right'>
              <p className={cn('text-2xl font-bold', styles.text)}>
                {usagePercentage}%
              </p>
              <p className={cn('text-xs', styles.subtext)}>used</p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className='relative h-1.5 bg-muted/50 rounded-full overflow-hidden'>
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                quotaStatus.isFull
                  ? 'bg-destructive'
                  : quotaStatus.isAtLimit
                    ? 'bg-destructive/80'
                    : quotaStatus.isNearLimit
                      ? 'bg-yellow-500'
                      : 'bg-primary'
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
