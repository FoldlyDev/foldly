'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

interface AnimatedSelectProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  multiple = false,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (multiple) {
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedOptions = options.filter(option =>
      selectedValues.includes(option.value)
    );

    const handleOptionToggle = (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    };

    const displayText =
      selectedOptions.length > 0
        ? `${selectedOptions.length} selected`
        : placeholder;

    return (
      <div className={`relative ${className}`}>
        <motion.button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white text-left cursor-pointer flex items-center justify-between'
          whileTap={{ scale: 0.98 }}
          whileHover={{ borderColor: 'var(--primary)' }}
        >
          <span
            className={
              selectedOptions.length > 0
                ? 'text-[var(--quaternary)]'
                : 'text-[var(--neutral-500)]'
            }
          >
            {displayText}
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
              {options.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    type='button'
                    onClick={() => handleOptionToggle(option.value)}
                    className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--neutral-50)] focus:bg-[var(--neutral-50)] focus:outline-none border-none bg-transparent cursor-pointer flex items-center gap-2'
                    whileHover={{ backgroundColor: 'var(--neutral-50)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className='flex items-center justify-center w-4 h-4 border border-[var(--neutral-300)] rounded bg-white'>
                      {isSelected && (
                        <Check className='w-3 h-3 text-[var(--primary)]' />
                      )}
                    </div>
                    <div className='flex flex-col flex-1'>
                      <span className='font-medium text-[var(--quaternary)]'>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className='text-xs text-[var(--neutral-500)]'>
                          {option.description}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop to close dropdown when clicking outside */}
        {isOpen && (
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Single-select mode (existing behavior)
  const selectedOption = options.find(
    option => option.value === (typeof value === 'string' ? value : '')
  );

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white text-left cursor-pointer flex items-center justify-between'
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
                <div className='flex flex-col'>
                  <span className='font-medium text-[var(--quaternary)]'>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className='text-xs text-[var(--neutral-500)]'>
                      {option.description}
                    </span>
                  )}
                </div>
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
