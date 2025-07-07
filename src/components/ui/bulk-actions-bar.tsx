'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Archive, Copy, Trash2, X } from 'lucide-react';
import { ActionButton } from './action-button';
import { cn } from '@/lib/utils/utils';

interface BulkAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'success'
    | 'warning';
  onClick: (selectedItems: string[]) => void;
}

interface BulkActionsBarProps {
  selectedItems: string[];
  onClearSelection: () => void;
  actions?: BulkAction[];
  className?: string;
  itemLabel?: string; // e.g., "link", "file", "item"
}

const defaultActions: BulkAction[] = [
  {
    key: 'edit',
    label: 'Bulk Edit',
    icon: Settings,
    variant: 'outline',
    onClick: () => {},
  },
  {
    key: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'outline',
    onClick: () => {},
  },
  {
    key: 'duplicate',
    label: 'Duplicate',
    icon: Copy,
    variant: 'outline',
    onClick: () => {},
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    onClick: () => {},
  },
];

export function BulkActionsBar({
  selectedItems,
  onClearSelection,
  actions = defaultActions,
  className,
  itemLabel = 'item',
}: BulkActionsBarProps) {
  const isVisible = selectedItems.length > 0;

  if (!isVisible) return null;

  const selectionText =
    selectedItems.length === 1
      ? `${selectedItems.length} ${itemLabel} selected`
      : `${selectedItems.length} ${itemLabel}s selected`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-xl border border-[var(--primary)] shadow-lg',
          className
        )}
      >
        {/* Selection Count */}
        <div className='flex items-center gap-2'>
          <motion.div
            className='w-5 h-5 bg-[var(--primary)] rounded text-white flex items-center justify-center text-xs font-bold'
            key={selectedItems.length}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          >
            {selectedItems.length}
          </motion.div>
          <span className='text-sm font-medium'>{selectionText}</span>
        </div>

        {/* Separator */}
        <div className='w-px h-5 bg-[var(--primary)]/30' />

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          {actions.map(action => {
            const IconComponent = action.icon;
            return (
              <ActionButton
                key={action.key}
                variant={action.variant || 'outline'}
                size='sm'
                onClick={() => action.onClick(selectedItems)}
                className={cn(
                  'bg-white/50 hover:bg-white/80 transition-colors',
                  action.variant === 'destructive' &&
                    'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                )}
                motionType='scale'
              >
                <IconComponent className='w-3 h-3' />
                {action.label}
              </ActionButton>
            );
          })}
        </div>

        {/* Separator */}
        <div className='w-px h-5 bg-[var(--primary)]/30' />

        {/* Clear Selection */}
        <ActionButton
          variant='ghost'
          size='sm'
          onClick={onClearSelection}
          className='p-1.5 hover:bg-white/50 rounded-lg transition-colors'
          motionType='scale'
          title='Clear selection'
        >
          <X className='w-4 h-4' />
        </ActionButton>
      </motion.div>
    </AnimatePresence>
  );
}

export type { BulkAction, BulkActionsBarProps };
