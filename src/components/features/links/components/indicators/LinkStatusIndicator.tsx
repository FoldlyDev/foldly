'use client';

import { memo } from 'react';

interface LinkStatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md';
}

export const LinkStatusIndicator = memo(
  ({ status, size = 'sm' }: LinkStatusIndicatorProps) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            dotColor: 'bg-green-600',
            text: 'Active',
          };
        case 'paused':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            dotColor: 'bg-yellow-600',
            text: 'Paused',
          };
        case 'expired':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            dotColor: 'bg-red-600',
            text: 'Expired',
          };
        default:
          // Default to active for any undefined/null/unknown status
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            dotColor: 'bg-green-600',
            text: 'Active',
          };
      }
    };

    const statusConfig = getStatusConfig(status);
    const sizeClasses =
      size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
    const dotSize = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${statusConfig.color} ${sizeClasses}`}
      >
        <div className={`rounded-full ${statusConfig.dotColor} ${dotSize}`} />
        {statusConfig.text}
      </div>
    );
  }
);

LinkStatusIndicator.displayName = 'LinkStatusIndicator';
