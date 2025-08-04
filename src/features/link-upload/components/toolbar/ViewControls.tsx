'use client';

import React from 'react';
import { Button } from '@/components/ui/core/shadcn/button';
import { Minimize2, Maximize2 } from 'lucide-react';

interface ViewControlsProps {
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  disabled?: boolean;
}

export function ViewControls({ 
  onExpandAll, 
  onCollapseAll,
  disabled = false 
}: ViewControlsProps) {
  return (
    <div className='flex items-center gap-2'>
      <Button
        onClick={onCollapseAll}
        variant='ghost'
        size='sm'
        className='gap-2'
        disabled={disabled || !onCollapseAll}
        title='Collapse All'
      >
        <Minimize2 className='h-4 w-4' />
      </Button>
      <Button
        onClick={onExpandAll}
        variant='ghost'
        size='sm'
        className='gap-2'
        disabled={disabled || !onExpandAll}
        title='Expand All'
      >
        <Maximize2 className='h-4 w-4' />
      </Button>
    </div>
  );
}