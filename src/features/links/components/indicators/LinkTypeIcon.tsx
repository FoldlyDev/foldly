'use client';

import { memo } from 'react';
import { FolderOpen, Link2 } from 'lucide-react';
import {
  COMPONENT_SIZES,
  LINK_TYPE_STYLING,
  COMPONENT_DEFAULTS,
} from '../../lib/constants';

interface LinkTypeIconProps {
  isBaseLink: boolean;
  size?: 'sm' | 'md' | 'lg';
  brandingImageUrl?: string;
  brandingEnabled?: boolean;
}

export const LinkTypeIcon = memo(
  ({
    isBaseLink,
    size = COMPONENT_DEFAULTS.linkTypeIcon.size,
    brandingImageUrl,
    brandingEnabled = false,
  }: LinkTypeIconProps) => {
    const sizeConfig = COMPONENT_SIZES.linkTypeIcon[size];
    const linkTypeKey = isBaseLink ? 'base' : 'topic';
    const styling = LINK_TYPE_STYLING[linkTypeKey];

    // If branding is enabled and there's a custom image URL, use it
    if (brandingEnabled && brandingImageUrl) {
      return (
        <div
          className={`${sizeConfig.container} rounded-lg flex items-center justify-center overflow-hidden bg-gray-100`}
        >
          <img 
            src={brandingImageUrl} 
            alt="Brand logo" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // Otherwise, use the default icons
    if (isBaseLink) {
      // Special icon for base links - user's personal collection
      return (
        <div
          className={`${sizeConfig.container} ${styling.container} rounded-lg flex items-center justify-center`}
        >
          <FolderOpen className={`${sizeConfig.icon} ${styling.icon}`} />
        </div>
      );
    } else {
      // Regular icon for topic links
      return (
        <div
          className={`${sizeConfig.container} ${styling.container} rounded-lg flex items-center justify-center`}
        >
          <Link2 className={`${sizeConfig.icon} ${styling.icon}`} />
        </div>
      );
    }
  }
);

LinkTypeIcon.displayName = 'LinkTypeIcon';