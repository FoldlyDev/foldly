'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { ActionButton } from './action-button';
import { motion, AnimatePresence } from 'motion/react';
import {
  MoreHorizontal,
  Share2,
  Settings,
  Info,
  Trash2,
  Edit,
  Copy,
  Download,
  Archive,
  Eye,
  FolderOpen,
} from 'lucide-react';
import type { ActionItem } from '@/components/ui/types';

interface CardActionsMenuProps {
  actions: ActionItem[];
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  size?: 'sm' | 'md';
}

const defaultActions = {
  viewFiles: (onClick: () => void): ActionItem => ({
    id: 'viewFiles',
    label: 'View Files',
    icon: FolderOpen,
    onClick,
    variant: 'default' as const,
  }),
  share: (onClick: () => void): ActionItem => ({
    id: 'share',
    label: 'Share Link',
    icon: Share2,
    onClick,
  }),
  settings: (onClick: () => void): ActionItem => ({
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    onClick,
  }),
  details: (onClick: () => void): ActionItem => ({
    id: 'details',
    label: 'View Details',
    icon: Info,
    onClick,
  }),
  edit: (onClick: () => void): ActionItem => ({
    id: 'edit',
    label: 'Edit Link',
    icon: Edit,
    onClick,
  }),
  copy: (onClick: () => void): ActionItem => ({
    id: 'copy',
    label: 'Copy URL',
    icon: Copy,
    onClick,
  }),
  download: (onClick: () => void): ActionItem => ({
    id: 'download',
    label: 'Download Files',
    icon: Download,
    onClick,
  }),
  archive: (onClick: () => void): ActionItem => ({
    id: 'archive',
    label: 'Archive Link',
    icon: Archive,
    onClick,
  }),
  delete: (onClick: () => void): ActionItem => ({
    id: 'delete',
    label: 'Delete Link',
    icon: Trash2,
    onClick,
    variant: 'destructive' as const,
  }),
};

export function CardActionsMenu({
  actions,
  trigger,
  align = 'end',
  side = 'bottom',
  className,
  size = 'md',
}: CardActionsMenuProps) {
  const [open, setOpen] = React.useState(false);

  const handleItemClick = (action: ActionItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      action.onClick();
    } catch (error) {
      console.error('Error calling action.onClick():', error);
    }

    // Close dropdown with small delay to ensure modal has time to open
    setTimeout(() => {
      setOpen(false);
    }, 50);
  };

  const defaultTrigger = (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 90 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      animate={open ? { rotate: 90 } : { rotate: 0 }}
    >
      <ActionButton
        variant='ghost'
        size='icon'
        motionType='subtle'
        className={`${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer`}
        aria-label='More actions'
      >
        <MoreHorizontal className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </ActionButton>
    </motion.div>
  );

  // Animation variants for dropdown content
  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 350,
        damping: 35,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.15 },
    },
  } as const;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <AnimatePresence>
        {open && (
          <DropdownMenuContent
            align={align}
            side={side}
            className={`min-w-[180px] ${className}`}
            asChild
          >
            <motion.div
              variants={dropdownVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              {actions.map((action, index) => {
                const IconComponent = action.icon;
                const isDestructive = action.variant === 'destructive';
                const isLastBeforeDestructive =
                  !isDestructive &&
                  index < actions.length - 1 &&
                  actions[index + 1]?.variant === 'destructive';

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.2,
                      ease: 'easeOut',
                    }}
                  >
                    <DropdownMenuItem
                      onClick={e => {
                        handleItemClick(action, e);
                      }}
                      disabled={action.disabled || false}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer ${
                        isDestructive
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900'
                      }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        <IconComponent className='w-4 h-4 flex-shrink-0' />
                      </motion.div>
                      <span className='font-medium'>{action.label}</span>
                    </DropdownMenuItem>
                    {isLastBeforeDestructive && (
                      <DropdownMenuSeparator className='my-1' />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}
export { defaultActions };
export type { ActionItem, CardActionsMenuProps };
