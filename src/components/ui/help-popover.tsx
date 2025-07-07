'use client';

import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';

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
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center text-[var(--neutral-400)] hover:text-[var(--neutral-600)] transition-colors ${className}`}
          type='button'
        >
          <HelpCircle className='w-4 h-4' />
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
  );
}
