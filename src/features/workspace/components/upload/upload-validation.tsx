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
  } | null;
  formatSize: (bytes: number) => string;
}

export function UploadValidation({ validation, formatSize }: UploadValidationProps) {
  if (!validation) return null;

  const { valid, reason, totalSize, exceedsLimit } = validation;

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
            'bg-gradient-to-br from-red-50 to-red-50/50',
            'dark:from-red-950/20 dark:to-red-900/10',
            'border-red-200 dark:border-red-800'
          )}>
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-red-600 rounded-full blur-3xl" />
            </div>

            <div className="relative flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {exceedsLimit ? 'Storage Full' : 'Cannot Upload'}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {reason || (exceedsLimit ? UPLOAD_CONFIG.messages.errors.storageFull : 'Upload validation failed')}
                </p>
                {totalSize > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Selected: {formatSize(totalSize)}
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
            'bg-gradient-to-br from-blue-50 to-blue-50/50',
            'dark:from-blue-950/20 dark:to-blue-900/10',
            'border-blue-200 dark:border-blue-800'
          )}>
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-600 rounded-full blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Ready to upload
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    {formatSize(totalSize)} will be uploaded
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
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
      gradient: 'from-yellow-400 to-amber-500',
      bgGradient: 'from-yellow-50/90 via-amber-50/80 to-orange-50/70',
      border: 'border-yellow-300/50',
      iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      shadowColor: 'shadow-yellow-500/20',
      pulseColor: 'bg-yellow-400'
    },
    critical: {
      icon: AlertTriangle,
      title: 'Storage almost full',
      subtitle: `Only ${formatSize(remainingSpace)} remaining`,
      gradient: 'from-orange-400 to-red-500',
      bgGradient: 'from-orange-50/90 via-red-50/80 to-rose-50/70',
      border: 'border-orange-300/50',
      iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
      shadowColor: 'shadow-orange-500/20',
      pulseColor: 'bg-orange-400'
    },
    exceeded: {
      icon: AlertTriangle,
      title: 'Storage limit exceeded',
      subtitle: 'Please free up space or upgrade your plan',
      gradient: 'from-red-400 to-rose-500',
      bgGradient: 'from-red-50/90 via-rose-50/80 to-pink-50/70',
      border: 'border-red-300/50',
      iconBg: 'bg-gradient-to-br from-red-400 to-rose-500',
      shadowColor: 'shadow-red-500/20',
      pulseColor: 'bg-red-400'
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
          className={cn('absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent')}
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
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
          
          <div className="flex-1">
            <h4 className={cn(
              'text-base font-semibold bg-gradient-to-r bg-clip-text text-transparent',
              config.gradient
            )}>
              {config.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {config.subtitle}
            </p>
            
            {/* Progress indicator for warning/critical */}
            {status !== 'exceeded' && (
              <div className="mt-3 relative">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: status === 'warning' ? '75%' : '90%'
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full bg-gradient-to-r rounded-full', config.gradient)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
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