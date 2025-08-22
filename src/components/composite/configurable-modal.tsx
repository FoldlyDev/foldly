'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';

export interface ConfigurableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  preventCloseOnOutsideClick?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export function ConfigurableModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  className = '',
  preventCloseOnOutsideClick = false,
}: ConfigurableModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={preventCloseOnOutsideClick ? () => {} : onClose}
    >
      <DialogContent
        className={`
          ${maxWidthClasses[maxWidth]} 
          ${className}
          w-[95vw] 
          max-h-[90vh] 
          h-auto
          min-h-[400px]
          overflow-hidden
          flex 
          flex-col
          p-0
          gap-0
          sm:w-full
          md:w-[90vw]
          lg:w-[85vw]
          xl:w-[80vw]
        `}
        onPointerDownOutside={
          preventCloseOnOutsideClick ? e => e.preventDefault() : () => {}
        }
        onEscapeKeyDown={
          preventCloseOnOutsideClick ? e => e.preventDefault() : () => {}
        }
      >
        {/* Header - Fixed at top */}
        {(title || description) && (
          <DialogHeader className='px-6 pt-6 pb-4 shrink-0 border-b border-border'>
            {title && (
              <DialogTitle className='text-xl font-semibold text-foreground leading-tight'>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className='text-muted-foreground mt-2 leading-relaxed'>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {/* Content - Scrollable */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className='w-full h-full'
          >
            {children}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for convenience
export {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
