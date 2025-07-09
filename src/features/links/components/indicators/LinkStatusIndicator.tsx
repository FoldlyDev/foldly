'use client';

import { memo } from 'react';
import {
  LINK_STATUS_CONFIGS,
  COMPONENT_SIZES,
  STATUS_MESSAGES,
  COMPONENT_DEFAULTS,
} from '../../lib/constants';

interface LinkStatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md';
}

export const LinkStatusIndicator = memo(
  ({
    status,
    size = COMPONENT_DEFAULTS.statusIndicator.size,
  }: LinkStatusIndicatorProps) => {
    // Get status config from constants, with fallback to active
    const statusKey =
      status && status in LINK_STATUS_CONFIGS
        ? (status as keyof typeof LINK_STATUS_CONFIGS)
        : 'active';

    const statusConfig = LINK_STATUS_CONFIGS[statusKey];
    const sizeConfig = COMPONENT_SIZES.statusIndicator[size];

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${statusConfig.color} ${sizeConfig.classes}`}
      >
        <div
          className={`rounded-full ${statusConfig.dotColor} ${sizeConfig.dot}`}
        />
        {STATUS_MESSAGES[statusKey]}
      </div>
    );
  }
);

LinkStatusIndicator.displayName = 'LinkStatusIndicator';
