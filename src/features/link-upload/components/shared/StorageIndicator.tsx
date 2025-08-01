'use client';

import { Progress } from '@/components/ui/core/shadcn/progress';
import { formatBytes } from '../../lib/utils/format';
import { cn } from '@/lib/utils';

interface StorageIndicatorProps {
  used: number;
  limit: number;
  compact?: boolean;
  className?: string;
}

export function StorageIndicator({ 
  used, 
  limit, 
  compact = false,
  className 
}: StorageIndicatorProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const available = Math.max(limit - used, 0);
  
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {compact ? 'Storage' : 'Storage Used'}
        </span>
        <span className={cn(
          'font-medium',
          isAtLimit && 'text-destructive',
          isNearLimit && !isAtLimit && 'text-warning'
        )}>
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          'h-2',
          isAtLimit && '[&>div]:bg-destructive',
          isNearLimit && !isAtLimit && '[&>div]:bg-warning'
        )}
      />
      
      {!compact && (
        <p className="text-xs text-muted-foreground">
          {formatBytes(available)} available
        </p>
      )}
    </div>
  );
}