'use client';

import { memo } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { ActionButton, CardActionsMenu } from '@/components/ui';
import type { ActionItem } from '@/components/ui/types';

interface LinkCardActionsProps {
  onCopyLink: (e?: React.MouseEvent) => void;
  onShare: (e?: React.MouseEvent) => void;
  actions: ActionItem[];
  size?: 'sm' | 'md';
}

export const LinkCardActions = memo(
  ({ onCopyLink, onShare, actions, size = 'sm' }: LinkCardActionsProps) => {
    return (
      <div className='flex items-center gap-2 flex-shrink-0'>
        <ActionButton
          onClick={e => {
            e.stopPropagation();
            onCopyLink();
          }}
          variant='ghost'
          size={size}
          title='Copy Link'
        >
          <Copy className='w-4 h-4' />
        </ActionButton>

        <ActionButton
          onClick={e => {
            e.stopPropagation();
            onShare();
          }}
          variant='ghost'
          size={size}
          title='Share'
        >
          <Share2 className='w-4 h-4' />
        </ActionButton>

        <CardActionsMenu actions={actions} />
      </div>
    );
  }
);

LinkCardActions.displayName = 'LinkCardActions';
