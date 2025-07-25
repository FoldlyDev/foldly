'use client';

import { memo } from 'react';
import { Globe, EyeOff } from 'lucide-react';
import {
  COMPONENT_SIZES,
  VISIBILITY_STYLING,
  STATUS_MESSAGES,
  HELP_TEXT,
  COMPONENT_DEFAULTS,
} from '../../lib/constants';

interface LinkVisibilityIndicatorProps {
  isPublic: boolean;
  size?: 'sm' | 'md';
}

export const LinkVisibilityIndicator = memo(
  ({
    isPublic,
    size = COMPONENT_DEFAULTS.visibilityIndicator.size,
  }: LinkVisibilityIndicatorProps) => {
    const sizeConfig = COMPONENT_SIZES.visibilityIndicator[size];
    const visibilityKey = isPublic ? 'public' : 'private';
    const styling = VISIBILITY_STYLING[visibilityKey];

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeConfig.classes} ${styling.badge}`}
        title={isPublic ? HELP_TEXT.publicAccess : HELP_TEXT.privateAccess}
      >
        {isPublic ? (
          <Globe className={sizeConfig.icon} />
        ) : (
          <EyeOff className={sizeConfig.icon} />
        )}
        <span className='font-medium'>{STATUS_MESSAGES[visibilityKey]}</span>
      </div>
    );
  }
);

LinkVisibilityIndicator.displayName = 'LinkVisibilityIndicator';
