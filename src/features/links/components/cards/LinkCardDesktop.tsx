'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import {
  LinkStatusIndicator,
  LinkVisibilityIndicator,
  LinkTypeIcon,
} from '../indicators';
import {
  SearchHighlight,
  ActionButton,
  AnimatedCopyButton,
  CardActionsMenu,
} from '@/components/ui';
import type { LinkData } from '../../types';
import type { ActionItem } from '@/components/ui/types';

interface LinkCardDesktopProps {
  link: LinkData;
  index: number;
  isBaseLink: boolean;
  formattedDate: string;
  isMultiSelectMode?: boolean | undefined;
  isMultiSelected?: boolean | undefined;
  onOpenDetails: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onSelectionChange?: ((linkId: string, checked: boolean) => void) | undefined;
  actions: ActionItem[];
  quickActions: ActionItem[];
  searchQuery?: string;
}

export const LinkCardDesktop = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelectMode,
    isMultiSelected,
    onOpenDetails,
    onCopyLink,
    onShare,
    onSelectionChange,
    actions,
    quickActions,
    searchQuery,
  }: LinkCardDesktopProps) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={onOpenDetails}
        className={`
        relative bg-white rounded-lg hover:bg-gray-50 
        transition-all duration-200 group cursor-pointer
        ${
          isBaseLink
            ? 'border-l-4 border-l-purple-400 shadow-sm' // Special base link styling
            : 'border border-gray-200 hover:border-gray-300' // Regular topic link styling
        }
        ${
          isMultiSelected && !isBaseLink
            ? 'ring-2 ring-blue-400 ring-opacity-50' // Selection ring only for topic links
            : ''
        }
      `}
      >
        <div className='flex items-center gap-4 px-4 py-3 min-h-[72px]'>
          {/* Selection checkbox (desktop only) */}
          {isMultiSelectMode && !isBaseLink && (
            <div className='flex-shrink-0'>
              <Checkbox
                checked={isMultiSelected || false}
                onCheckedChange={checked =>
                  onSelectionChange?.(link.id, checked as boolean)
                }
                className='w-4 h-4'
              />
            </div>
          )}

          {/* Icon + Title */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <LinkTypeIcon isBaseLink={isBaseLink} size='sm' />

            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                {/* Show logo if available */}
                {link.logoUrl && (
                  <img
                    src={link.logoUrl}
                    alt={`${link.name} logo`}
                    className='w-4 h-4 rounded object-cover flex-shrink-0'
                    onError={e => {
                      // Hide logo if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <h3 className='font-medium text-gray-900 text-sm truncate'>
                  <SearchHighlight
                    text={link.name}
                    searchQuery={searchQuery || ''}
                  />
                </h3>
              </div>
              <p className='text-xs text-gray-500 truncate'>{link.url}</p>
            </div>
          </div>

          {/* Status & Visibility */}
          <div className='flex items-center gap-3 flex-shrink-0'>
            <LinkStatusIndicator status={link.status} />
            <LinkVisibilityIndicator isPublic={link.isPublic} />
          </div>

          {/* Metrics */}
          <div className='flex items-center gap-4 text-sm text-gray-500 flex-shrink-0'>
            <span className='flex items-center gap-1'>
              <FileText className='w-3.5 h-3.5' />
              {link.uploads}
            </span>
            <span className='flex items-center gap-1'>
              <Eye className='w-3.5 h-3.5' />
              {link.views}
            </span>
          </div>

          {/* Date */}
          <div className='flex flex-col items-end gap-1 text-sm text-gray-500 flex-shrink-0 min-w-[120px]'>
            <div className='flex items-center gap-1'>
              <Clock className='w-3.5 h-3.5' />
              <span>{formattedDate}</span>
            </div>

            {/* Expiry Date */}
            {link.expiresAt && (
              <div className='flex items-center gap-1 text-xs text-amber-600'>
                <AlertTriangle className='w-3 h-3' />
                <span className='font-medium'>Expires {link.expiresAt}</span>
              </div>
            )}
          </div>

          {/* Quick Actions (Copy & Share) */}
          <div
            className='flex items-center gap-2 flex-shrink-0'
            onClick={e => e.stopPropagation()}
          >
            {quickActions.map(action => {
              const IconComponent = action.icon;

              // Use AnimatedCopyButton for copy action
              if (action.id === 'copy') {
                return (
                  <AnimatedCopyButton
                    key={action.id}
                    onCopy={async () => {
                      action.onClick();
                    }}
                    variant='ghost'
                    size='sm'
                    title={action.label}
                    className='text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    iconSize='w-4 h-4'
                  />
                );
              }

              // Regular action button for other actions (like share)
              return (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <ActionButton
                    onClick={e => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    variant='ghost'
                    size='sm'
                    title={action.label}
                    className='text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  >
                    <motion.div
                      whileHover={{
                        scale: action.id === 'share' ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: 'easeInOut',
                      }}
                    >
                      <IconComponent className='w-4 h-4' />
                    </motion.div>
                  </ActionButton>
                </motion.div>
              );
            })}
          </div>

          {/* Dropdown Menu */}
          <div className='flex-shrink-0' onClick={e => e.stopPropagation()}>
            <CardActionsMenu actions={actions} />
          </div>
        </div>

        {/* Hover overlay for visual feedback */}
        <div
          className='absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 
                      transition-opacity duration-200 rounded-lg pointer-events-none'
        />
      </motion.div>
    );
  }
);

LinkCardDesktop.displayName = 'LinkCardDesktop';
