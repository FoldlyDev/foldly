'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MenuAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'ghost' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectionMenuProps {
  isVisible: boolean;
  selectedCount: number;
  actions: MenuAction[];
  message?: string;
  className?: string;
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right';
}

// ============================================================================
// Selection Bar Content Component
// ============================================================================

interface SelectionBarContentProps {
  selectedCount: number;
  actions: MenuAction[];
  message?: string | undefined;
  className?: string | undefined;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

function SelectionBarContent({
  selectedCount,
  actions,
  message,
  className,
  isCollapsed,
  onToggleCollapse,
  onClose,
}: SelectionBarContentProps) {
  // Default message if none provided
  const displayMessage =
    message || `${selectedCount} link${selectedCount > 1 ? 's' : ''} selected`;

  // Collapsed state - show indicator badge
  if (isCollapsed) {
    return (
      <motion.button
        onClick={onToggleCollapse}
        className={cn(
          'relative',
          'bg-[#0A0A0B] dark:bg-[#0A0A0B]',
          'rounded-full',
          'border border-[#27272A]',
          'shadow-2xl shadow-black/20',
          'px-3 py-2',
          'flex items-center gap-2',
          'hover:bg-[#18181B]',
          'transition-colors duration-200',
          'group',
          'cursor-pointer'
        )}
        aria-label='Expand selection menu'
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <ChevronLeft className='w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors' />
        <span className='text-sm font-medium text-white/90 pr-1'>
          {selectedCount}
        </span>
      </motion.button>
    );
  }

  // Expanded state - full menu
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        'bg-[#0A0A0B] dark:bg-[#0A0A0B]',
        'rounded-xl',
        'border border-[#27272A]',
        'shadow-2xl shadow-black/20',
        'px-5 py-3.5',
        'w-full max-w-md',
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className='flex items-center gap-4'>
        {/* Left section: Count message */}
        <div className='flex-1'>
          <span className='text-sm font-medium text-white/90'>
            {displayMessage}
          </span>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-2'>
          {actions.map(action => {
            // Clear button (outline style)
            if (action.key === 'clear') {
              return (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'h-8 px-3.5',
                    'text-sm font-medium',
                    'rounded-lg',
                    'bg-transparent',
                    'border border-[#27272A]',
                    'text-white/90',
                    'hover:bg-white/5 hover:border-[#3F3F46]',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    'cursor-pointer',
                    action.disabled &&
                      'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  {action.icon && (
                    <span className='mr-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5'>
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              );
            }

            // Delete button (white background)
            if (action.variant === 'destructive' || action.key === 'delete') {
              return (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'h-8 px-3.5',
                    'text-sm font-medium',
                    'rounded-lg',
                    'bg-white',
                    'text-black',
                    'hover:bg-white/90',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    'cursor-pointer',
                    action.disabled &&
                      'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  {action.icon && (
                    <span className='mr-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5'>
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              );
            }

            // Other action buttons (secondary style)
            return (
              <button
                key={action.key}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  'inline-flex items-center justify-center',
                  'h-8 px-3.5',
                  'text-sm font-medium',
                  'rounded-lg',
                  'bg-white/10',
                  'text-white/90',
                  'hover:bg-white/15',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/20',
                  'cursor-pointer',
                  action.disabled &&
                    'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                {action.icon && (
                  <span className='mr-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5'>
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Close button - also clears selection */}
        <button
          onClick={() => {
            // Find and execute the clear action if it exists
            const clearAction = actions.find(action => action.key === 'clear');
            if (clearAction && !clearAction.disabled) {
              clearAction.onClick();
            }
            onClose();
          }}
          className={cn(
            'group',
            '-mr-1.5',
            'inline-flex items-center justify-center',
            'w-7 h-7',
            'rounded-lg',
            'hover:bg-white/5',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/20',
            'cursor-pointer'
          )}
          aria-label='Close and clear selection'
        >
          <X className='w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors' />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Selection Menu Component
// ============================================================================

export function SelectionMenu({
  isVisible,
  selectedCount,
  actions,
  message,
  className,
  position = 'bottom-center',
}: SelectionMenuProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInternalVisible, setIsInternalVisible] = useState(false);

  // Toggle collapse state
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setIsInternalVisible(false);
  }, []);

  // Sync internal visibility with prop
  useEffect(() => {
    setIsInternalVisible(isVisible);
    if (!isVisible) {
      setIsCollapsed(false); // Reset collapse state when hidden
    }
  }, [isVisible]);

  // Handle outside click and scroll
  useEffect(() => {
    if (!isInternalVisible) return;

    const isMobile = window.innerWidth < 768;

    const handleInteraction = (e: MouseEvent) => {
      // Check if click is on the menu content
      const target = e.target as HTMLElement;
      const menuElement = target.closest('.selection-menu-content');
      const isInsideMenu = menuElement !== null;

      // If clicked outside the menu, collapse it (mobile only)
      if (!isInsideMenu && isMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    const handleScroll = () => {
      // Collapse immediately on scroll (mobile only)
      if (isMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    // Add event listeners
    const timer = setTimeout(() => {
      document.addEventListener('click', handleInteraction);
      if (isMobile) {
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('touchmove', handleScroll, { passive: true });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [isInternalVisible, isCollapsed]);

  // Determine position classes
  const getPositionClasses = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      if (isCollapsed) {
        return 'fixed bottom-20 right-4 z-30';
      }
      // For expanded mobile, center horizontally with proper margins
      return 'fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-30';
    }
    
    switch (position) {
      case 'bottom-left':
        return 'fixed bottom-8 left-4 z-30';
      case 'bottom-right':
        return 'fixed bottom-8 right-4 z-30';
      case 'bottom-center':
      default:
        // Center horizontally at the bottom of the screen
        return 'fixed bottom-8 left-1/2 -translate-x-1/2 z-30';
    }
  };

  // Use a portal to render outside the component tree
  if (typeof window === 'undefined') return null;

  return (
    <AnimatePresence mode='wait'>
      {isInternalVisible && (
        <div className={cn(getPositionClasses(), 'selection-menu-content')}>
          <SelectionBarContent
            selectedCount={selectedCount}
            actions={actions}
            message={message}
            className={className}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onClose={handleClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default SelectionMenu;