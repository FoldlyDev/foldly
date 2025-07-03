'use client';

import { memo } from 'react';
import { Globe, EyeOff } from 'lucide-react';

interface LinkVisibilityIndicatorProps {
  isPublic: boolean;
  size?: 'sm' | 'md';
}

export const LinkVisibilityIndicator = memo(
  ({ isPublic, size = 'sm' }: LinkVisibilityIndicatorProps) => {
    const sizeClasses =
      size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
    const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClasses} ${
          isPublic
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-orange-100 text-orange-800 border-orange-200'
        }`}
        title={
          isPublic
            ? 'Public - Anyone can access'
            : 'Private - Restricted access'
        }
      >
        {isPublic ? (
          <Globe className={iconSize} />
        ) : (
          <EyeOff className={iconSize} />
        )}
        <span className='font-medium'>{isPublic ? 'Public' : 'Private'}</span>
      </div>
    );
  }
);

LinkVisibilityIndicator.displayName = 'LinkVisibilityIndicator';
