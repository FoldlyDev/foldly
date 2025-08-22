'use client';

import React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { X, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface SelectionActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
}

export function SelectionActions({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
}: SelectionActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className='flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-md'>
      <span className='text-sm font-medium'>{selectedCount} selected</span>

      <Button
        onClick={onDelete}
        variant='ghost'
        size='sm'
        className='gap-2 text-destructive hover:text-destructive hover:bg-destructive/10'
        disabled={isDeleting}
      >
        <Trash2 className='h-4 w-4' />
        Delete
      </Button>

      <Button
        onClick={onClearSelection}
        variant='ghost'
        size='sm'
        className='gap-1'
      >
        <X className='h-4 w-4' />
        Clear
      </Button>
    </div>
  );
}
