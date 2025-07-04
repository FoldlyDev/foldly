'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  className?: string;
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

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
