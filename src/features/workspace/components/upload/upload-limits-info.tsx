'use client';

import { Info, Zap, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { UPLOAD_CONFIG, formatFileSize } from '../../lib/config/upload-config';
import { cn } from '@/lib/utils';

interface UploadLimitsInfoProps {
  plan: 'free' | 'pro' | 'business';
  className?: string;
  compact?: boolean;
}

export function UploadLimitsInfo({ plan, className, compact = false }: UploadLimitsInfoProps) {
  const limits = UPLOAD_CONFIG.fileSizeLimits[plan];
  
  const features = [
    {
      icon: Zap,
      label: 'Smart Upload',
      value: `${UPLOAD_CONFIG.batch.size} files at once`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Shield,
      label: 'Max File Size',
      value: plan === 'pro' ? '10GB per file' : plan === 'business' ? '25GB per file' : '2GB per file',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Clock,
      label: 'Auto-Retry',
      value: `Up to ${UPLOAD_CONFIG.batch.maxRetries} retries`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600", className)}>
        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" />
        <span className="line-clamp-1">
          Up to {plan === 'pro' ? '10GB' : plan === 'business' ? '25GB' : '2GB'} per file • {UPLOAD_CONFIG.batch.size} files at once
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn("space-y-3", className)}
    >
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="relative group"
          >
            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className={cn(
                "p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors shrink-0",
                feature.bgColor,
                "group-hover:scale-110 transform transition-transform"
              )}>
                <feature.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", feature.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-700">
                  {feature.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                  {feature.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rate limit info - subtle but visible */}
      <div className="flex items-start gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-50/50">
        <Info className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
        <span className="text-[10px] sm:text-xs text-gray-600">
          Files are processed quickly with automatic error recovery. Large uploads may take a moment.
        </span>
      </div>
    </motion.div>
  );
}