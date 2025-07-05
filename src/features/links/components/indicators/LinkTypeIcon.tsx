'use client';

import { memo } from 'react';
import { FolderOpen, Link2 } from 'lucide-react';
import {
  COMPONENT_SIZES,
  LINK_TYPE_STYLING,
  COMPONENT_DEFAULTS,
} from '../../constants';

interface LinkTypeIconProps {
  isBaseLink: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LinkTypeIcon = memo(
  ({
    isBaseLink,
    size = COMPONENT_DEFAULTS.linkTypeIcon.size,
  }: LinkTypeIconProps) => {
    const sizeConfig = COMPONENT_SIZES.linkTypeIcon[size];
    const linkTypeKey = isBaseLink ? 'base' : 'topic';
    const styling = LINK_TYPE_STYLING[linkTypeKey];

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
