'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPLOAD_CONFIG } from '../../lib/config/upload-config';

interface UploadValidationProps {
  validation: {
    valid: boolean;
    reason?: string;
    totalSize: number;
    exceedsLimit: boolean;
    invalidFiles?: Array<{
      file: File;
      reason: string;
    }>;
    maxFileSize?: number;
  } | null;
  formatSize: (bytes: number) => string;
  planKey?: string;
}

export function UploadValidation({ validation, formatSize, planKey = 'free' }: UploadValidationProps) {
  if (!validation) return null;

  const { valid, reason, totalSize, exceedsLimit, invalidFiles, maxFileSize } = validation;

  // Don't show if valid and no size
  if (valid && totalSize === 0) return null;

  return (
    <AnimatePresence mode="wait">
      {!valid ? (
        // Error State
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className={cn(
            'relative rounded-xl border p-4',
            'bg-gradient-to-br from-destructive/10 to-destructive/5',
            'border-destructive/20',
            'backdrop-blur-sm shadow-lg shadow-destructive/10'
          )}>
            {/* Subtle decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-destructive rounded-full blur-2xl" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-destructive rounded-full blur-2xl" />
            </div>

            <div className="relative flex items-start gap-3">
              <div className="p-2 rounded-lg bg-destructive/20 shrink-0 border border-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive-foreground">
                  {exceedsLimit ? 'Storage Full' : invalidFiles?.length ? 'File Size Limit Exceeded' : 'Cannot Upload'}
                </p>
                <p className="text-xs text-destructive-foreground/90 mt-1">
                  {reason || (exceedsLimit ? UPLOAD_CONFIG.messages.errors.storageFull : 'Upload validation failed')}
                </p>
                
                {/* Show invalid files if any */}
                {invalidFiles && invalidFiles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-destructive-foreground">
                      Files exceeding {planKey} plan limit ({maxFileSize ? formatSize(maxFileSize) : 'N/A'}):
                    </p>
                    <ul className="space-y-1 bg-destructive/10 rounded-lg p-2 border border-destructive/20">
                      {invalidFiles.slice(0, 3).map((invalid, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
                          <span className="text-destructive-foreground/90 truncate flex-1">
                            {invalid.file.name}
                          </span>
                          <span className="text-destructive-foreground/75 font-medium">
                            ({formatSize(invalid.file.size)})
                          </span>
                        </li>
                      ))}
                      {invalidFiles.length > 3 && (
                        <li className="text-xs text-destructive-foreground/75 italic pl-3.5">
                          ...and {invalidFiles.length - 3} more file{invalidFiles.length - 3 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {totalSize > 0 && !invalidFiles?.length && (
                  <p className="text-xs text-destructive-foreground/75 mt-2">
                    Total size: {formatSize(totalSize)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : totalSize > 0 ? (
        // Success State
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className={cn(
            'relative rounded-xl border p-4',
            'bg-gradient-to-br from-primary/10 to-primary/5',
            'border-primary/20'
          )}>
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-primary rounded-full blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    Ready to upload
                  </p>
                  <p className="text-xs text-primary/80 mt-0.5">
                    {formatSize(totalSize)} will be uploaded
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1.5 rounded-lg bg-primary/20">
                  <p className="text-xs font-medium text-primary">
                    {formatSize(totalSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Storage Warning Component
export function StorageWarning({ 
  status, 
  remainingSpace,
  formatSize 
}: { 
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
  remainingSpace: number;
  formatSize: (bytes: number) => string;
}) {
  if (status === 'safe') return null;

  const configs = {
    warning: {
      icon: Info,
      title: 'Storage getting full',
      subtitle: `${formatSize(remainingSpace)} remaining`,
      gradient: 'from-warning to-warning',
      bgGradient: 'from-warning/10 via-warning/5 to-warning/5',
      border: 'border-warning/50',
      iconBg: 'bg-gradient-to-br from-warning to-warning',
      shadowColor: 'shadow-warning/20',
      pulseColor: 'bg-warning'
    },
    critical: {
      icon: AlertTriangle,
      title: 'Storage almost full',
      subtitle: `Only ${formatSize(remainingSpace)} remaining`,
      gradient: 'from-warning to-destructive',
      bgGradient: 'from-warning/10 via-destructive/10 to-destructive/5',
      border: 'border-warning/50',
      iconBg: 'bg-gradient-to-br from-warning to-destructive',
      shadowColor: 'shadow-warning/20',
      pulseColor: 'bg-warning'
    },
    exceeded: {
      icon: AlertTriangle,
      title: 'Storage limit exceeded',
      subtitle: 'Please free up space or upgrade your plan',
      gradient: 'from-destructive to-destructive',
      bgGradient: 'from-destructive/10 via-destructive/5 to-destructive/5',
      border: 'border-destructive/50',
      iconBg: 'bg-gradient-to-br from-destructive to-destructive',
      shadowColor: 'shadow-destructive/20',
      pulseColor: 'bg-destructive'
    }
  };

  const config = configs[status] || configs.warning;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm',
        'display-card shadow-lg hover:shadow-xl transition-all duration-300',
        `bg-gradient-to-br ${config.bgGradient}`,
        config.border,
        config.shadowColor
      )}
    >
      {/* Premium animated background */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{ 
            x: [-100, 100],
            opacity: [0, 0.5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn('absolute inset-0 bg-gradient-to-r from-transparent via-background to-transparent')}
        />
      </div>

      {/* Alert pulse animation */}
      {(status === 'critical' || status === 'exceeded') && (
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn('absolute top-4 right-4 w-3 h-3 rounded-full', config.pulseColor)}
        />
      )}

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Premium animated icon */}
          <motion.div
            animate={{ 
              rotate: status === 'exceeded' ? [0, -10, 10, -10, 0] : 0,
              scale: status === 'exceeded' ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: 0.5,
              repeat: status === 'exceeded' ? Infinity : 0,
              repeatDelay: 2
            }}
            className={cn(
              'p-3 rounded-2xl shadow-lg',
              config.iconBg,
              config.shadowColor
            )}
          >
            <Icon className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          
          <div className="flex-1">
            <h4 className={cn(
              'text-base font-semibold bg-gradient-to-r bg-clip-text text-transparent',
              config.gradient
            )}>
              {config.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {config.subtitle}
            </p>
            
            {/* Progress indicator for warning/critical */}
            {status !== 'exceeded' && (
              <div className="mt-3 relative">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: status === 'warning' ? '75%' : '90%'
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full bg-gradient-to-r rounded-full', config.gradient)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}