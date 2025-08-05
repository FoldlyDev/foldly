'use client';

import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/shadcn/popover';

interface HelpPopoverProps {
  title: string;
  description: string;
  className?: string;
}

export function HelpPopover({
  title,
  description,
  className = '',
}: HelpPopoverProps) {
  return (
    <span style={{ marginLeft: '8px', display: 'inline-block' }}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`text-[var(--neutral-400)] hover:text-[var(--neutral-600)] transition-colors ${className}`}
            style={{
              verticalAlign: 'middle',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              lineHeight: '1',
            }}
            type='button'
          >
            <HelpCircle className='w-3.5 h-3.5' />
          </button>
        </PopoverTrigger>
      <PopoverContent
        className='w-80 bg-white border border-[var(--neutral-200)] shadow-lg'
        side='top'
      >
        <div className='space-y-2'>
          <h4 className='font-semibold text-sm text-[var(--quaternary)]'>
            {title}
          </h4>
          <div className='text-sm text-[var(--neutral-600)] leading-relaxed whitespace-pre-line'>
            {description}
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </span>
  );
}
