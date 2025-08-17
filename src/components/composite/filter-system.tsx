'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X } from 'lucide-react';
import { ActionButton } from '../core/action-button';
import { Label } from '../ui/shadcn/label';
import { cn } from '@/lib/utils/utils';

// Animated Select Component for Filters
interface SelectOption {
  value: string;
  label: string;
}

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full border-[var(--neutral-200)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent px-3 py-2 text-sm border rounded-md bg-white text-left cursor-pointer flex items-center justify-between'
        whileTap={{ scale: 0.98 }}
        whileHover={{ borderColor: 'var(--primary)' }}
      >
        <span
          className={
            selectedOption
              ? 'text-[var(--quaternary)]'
              : 'text-[var(--neutral-500)]'
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.svg
          className='w-4 h-4 text-[var(--neutral-400)]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className='absolute z-50 w-full mt-1 bg-white border border-[var(--neutral-200)] rounded-md shadow-lg max-h-60 overflow-y-auto'
          >
            {options.map(option => (
              <motion.button
                key={option.value}
                type='button'
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--neutral-50)] focus:bg-[var(--neutral-50)] focus:outline-none border-none bg-transparent cursor-pointer'
                whileHover={{ backgroundColor: 'var(--neutral-50)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className='font-medium text-[var(--quaternary)]'>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterSystemProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
  showToggle?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function FilterSystem({
  filters,
  values,
  onChange,
  onClear,
  onApply,
  className,
  showToggle = true,
  isExpanded = false,
  onToggle,
}: FilterSystemProps) {
  const [localExpanded, setLocalExpanded] = React.useState(isExpanded);

  const expanded = onToggle ? isExpanded : localExpanded;
  const toggleExpanded = onToggle || setLocalExpanded;

  const hasActiveFilters = values
    ? Object.values(values).some(value => value && value !== 'all')
    : false;

  const handleClear = () => {
    filters.forEach(filter => {
      onChange(filter.key, 'all');
    });
    onClear?.();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Toggle Button */}
      {showToggle && (
        <ActionButton
          variant={expanded || hasActiveFilters ? 'default' : 'outline'}
          size='default'
          onClick={() => toggleExpanded(!expanded)}
          className={cn(
            'transition-colors',
            hasActiveFilters &&
              !expanded &&
              'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]'
          )}
          motionType='subtle'
        >
          <Settings className='w-4 h-4' />
          Filters
          {hasActiveFilters && (
            <div className='w-2 h-2 bg-[var(--primary)] rounded-full ml-1' />
          )}
        </ActionButton>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              marginTop: showToggle ? 16 : 0,
            }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='bg-white rounded-xl border border-[var(--neutral-200)] p-6 shadow-sm'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {filters.map(filter => (
                  <div key={filter.key} className='space-y-2'>
                    <Label className='text-sm font-medium text-[var(--quaternary)]'>
                      {filter.label}
                    </Label>
                    <AnimatedSelect
                      value={(values && values[filter.key]) || 'all'}
                      onChange={(value: string) => onChange(filter.key, value)}
                      options={filter.options}
                      placeholder={
                        filter.placeholder || `Select ${filter.label}`
                      }
                      className='w-full'
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className='mt-6 flex items-center justify-between'>
                <ActionButton
                  variant='ghost'
                  size='sm'
                  onClick={handleClear}
                  className='text-[var(--neutral-500)] hover:text-[var(--quaternary)] hover:bg-[var(--neutral-50)]'
                >
                  Clear Filters
                </ActionButton>

                <div className='flex items-center gap-2'>
                  <ActionButton
                    variant='outline'
                    size='sm'
                    className='border-[var(--neutral-200)] hover:bg-[var(--neutral-50)]'
                  >
                    Export Results
                  </ActionButton>
                  <ActionButton
                    variant='default'
                    size='sm'
                    onClick={onApply}
                    motionType='scale'
                  >
                    Apply Filters
                  </ActionButton>
                </div>
              </div>

              {/* Close Button (Mobile) */}
              {showToggle && (
                <ActionButton
                  variant='ghost'
                  size='icon'
                  onClick={() => toggleExpanded(false)}
                  className='absolute top-4 right-4 md:hidden'
                >
                  <X className='w-4 h-4' />
                </ActionButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
