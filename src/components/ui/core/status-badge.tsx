'use client';

import { Badge } from './shadcn/badge';
import { CheckCircle, Pause, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'expired' | 'pending';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dot' | 'icon';
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: 'Active',
    className:
      'bg-[var(--success-green-subtle)] text-[var(--success-green)] border-[var(--success-green-border)]',
    dotColor: 'bg-[var(--success-green)]',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    className:
      'bg-[var(--warning-amber-subtle)] text-[var(--warning-amber)] border-[var(--warning-amber-border)]',
    dotColor: 'bg-[var(--warning-amber)]',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    className: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className:
      'bg-[var(--neutral-100)] text-[var(--neutral-600)] border-[var(--neutral-200)]',
    dotColor: 'bg-[var(--neutral-500)]',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusBadge({
  status,
  className,
  size = 'md',
  variant = 'dot',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Badge
      variant='outline'
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {variant === 'icon' && <IconComponent className={iconSizes[size]} />}
      {variant === 'dot' && (
        <div className={cn('rounded-full', config.dotColor, dotSizes[size])} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

export { statusConfig };
