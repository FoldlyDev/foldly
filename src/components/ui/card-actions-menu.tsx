'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/radix/dropdown-menu';
import { ActionButton } from '@/components/ui/action-button';
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

interface ActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

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
    action.onClick();
    setOpen(false);
  };

  const defaultTrigger = (
    <ActionButton
      variant='ghost'
      size='icon'
      motionType='subtle'
      className={`${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer`}
      aria-label='More actions'
    >
      <MoreHorizontal className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
    </ActionButton>
  );

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <DropdownMenuTrigger
        asChild
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className={`min-w-[180px] bg-white border border-slate-200 shadow-lg rounded-lg p-1 z-50 ${className}`}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          const isDestructive = action.variant === 'destructive';
          const isLastBeforeDestructive =
            !isDestructive &&
            index < actions.length - 1 &&
            actions[index + 1]?.variant === 'destructive';

          return (
            <React.Fragment key={action.id}>
              <DropdownMenuItem
                onClick={e => handleItemClick(action, e)}
                disabled={action.disabled || false}
                variant={isDestructive ? 'destructive' : 'default'}
                className={`
                  flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-md
                  transition-colors duration-150 outline-none
                  ${
                    action.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isDestructive
                        ? 'hover:bg-red-50 hover:text-red-700 text-red-600 focus:bg-red-50 focus:text-red-700'
                        : 'hover:bg-slate-50 text-slate-900 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900'
                  }
                `}
              >
                <IconComponent
                  className={`w-4 h-4 flex-shrink-0 ${
                    isDestructive ? 'text-red-500' : 'text-slate-600'
                  }`}
                />
                <span className='font-medium'>{action.label}</span>
              </DropdownMenuItem>
              {isLastBeforeDestructive && (
                <DropdownMenuSeparator className='my-1 bg-slate-200' />
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { defaultActions };
export type { ActionItem, CardActionsMenuProps };
