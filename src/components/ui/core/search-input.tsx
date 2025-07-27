'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/core/shadcn/input';
import { Button } from '@/components/ui/core/shadcn/button';
import { cn } from '@/lib/utils/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  showClearButton = true,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);

  // Debounce the search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  // Sync with external value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative flex-1', className)}>
      <div className='absolute left-3 top-1/2 transform -translate-y-1/2 z-10'>
        <Search className='w-4 h-4 text-[var(--neutral-400)]' />
      </div>

      <Input
        type='text'
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className='pl-10 pr-10 border border-[var(--neutral-200)] rounded-lg 
                   focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
                   bg-white text-[var(--quaternary)]'
      />

      {showClearButton && localValue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className='absolute right-3 top-1/2 transform -translate-y-1/2'
        >
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='h-6 w-6 p-0 hover:bg-[var(--neutral-100)] rounded-full cursor-pointer'
          >
            <X className='w-3 h-3 text-[var(--neutral-500)]' />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
