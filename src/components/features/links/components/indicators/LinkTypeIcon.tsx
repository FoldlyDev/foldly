'use client';

import { memo } from 'react';
import { FolderOpen, Link2 } from 'lucide-react';

interface LinkTypeIconProps {
  isBaseLink: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LinkTypeIcon = memo(
  ({ isBaseLink, size = 'md' }: LinkTypeIconProps) => {
    const getSizeClasses = (size: string) => {
      switch (size) {
        case 'sm':
          return { container: 'w-8 h-8', icon: 'w-4 h-4' };
        case 'lg':
          return { container: 'w-12 h-12', icon: 'w-6 h-6' };
        default:
          return { container: 'w-10 h-10', icon: 'w-5 h-5' };
      }
    };

    const { container, icon } = getSizeClasses(size);

    if (isBaseLink) {
      // Special icon for base links - user's personal collection
      return (
        <div
          className={`${container} bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center border-2 border-purple-200`}
        >
          <FolderOpen className={`${icon} text-purple-600`} />
        </div>
      );
    } else {
      // Regular icon for topic links
      return (
        <div
          className={`${container} bg-blue-100 rounded-lg flex items-center justify-center`}
        >
          <Link2 className={`${icon} text-blue-600`} />
        </div>
      );
    }
  }
);

LinkTypeIcon.displayName = 'LinkTypeIcon';
