'use client';

import { Info, Zap, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { UPLOAD_CONFIG, formatFileSize } from '../../lib/config/upload-config';
import { cn } from '@/lib/utils';
import { getPlanConfig, formatPlanFileSize } from '@/lib/config/plan-configuration';

interface UploadLimitsInfoProps {
  plan: 'free' | 'pro' | 'business';
  className?: string;
  compact?: boolean;
}

export function UploadLimitsInfo({ plan, className, compact = false }: UploadLimitsInfoProps) {
  const limits = UPLOAD_CONFIG.fileSizeLimits[plan];
  const planConfig = getPlanConfig(plan);
  const maxFileSize = formatPlanFileSize(plan);
  
  const features = [
    {
      icon: Zap,
      label: 'Batch Upload',
      value: `${UPLOAD_CONFIG.batch.size} files at once`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Shield,
      label: 'Max File Size',
      value: `${maxFileSize} per file`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Clock,
      label: 'Upload Rate',
      value: `${UPLOAD_CONFIG.rateLimit.maxUploadsPerMinute} uploads/minute`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground", className)}>
        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/60 shrink-0" />
        <span className="line-clamp-1">
          Up to {maxFileSize} per file • {UPLOAD_CONFIG.batch.size} files at once
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
            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className={cn(
                "p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors shrink-0",
                feature.bgColor,
                "group-hover:scale-110 transform transition-transform"
              )}>
                <feature.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", feature.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-foreground">
                  {feature.label}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {feature.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rate limit info - subtle but visible */}
      <div className="flex items-start gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-muted/30">
        <Info className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Upload rate limited to {UPLOAD_CONFIG.rateLimit.maxUploadsPerMinute} files per minute. Large batches will be queued automatically.
        </span>
      </div>
    </motion.div>
  );
}