'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock, Share2, AlertTriangle } from 'lucide-react';
import {
  LinkStatusIndicator,
  LinkVisibilityIndicator,
  LinkTypeIcon,
} from '../indicators';
import {
  SearchHighlight,
  CardActionsMenu,
  ActionButton,
  AnimatedCopyButton,
} from '@/components/ui';
import type { ActionItem } from '@/components/ui/types';
import type { LinkData } from '../../types';

interface LinkCardMobileProps {
  link: LinkData;
  index: number;
  isBaseLink: boolean;
  formattedDate: string;
  isMultiSelected?: boolean | undefined;
  onOpenDetails: () => void;
  actions: ActionItem[];
  quickActions: ActionItem[];
  searchQuery?: string;
}

export const LinkCardMobile = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelected,
    onOpenDetails,
    actions,
    quickActions,
    searchQuery,
  }: LinkCardMobileProps) => {
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
        <div className='p-4 space-y-3'>
          {/* Header Row: Title + Status */}
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-3 min-w-0 flex-1'>
              {/* Icon */}
              <LinkTypeIcon isBaseLink={isBaseLink} size='md' />

              {/* Title & URL */}
              <div className='min-w-0 flex-1'>
                <h3 className='font-semibold text-gray-900 text-base truncate'>
                  <SearchHighlight
                    text={link.name}
                    searchQuery={searchQuery || ''}
                  />
                </h3>
                <p className='text-sm text-gray-500 truncate'>{link.url}</p>
              </div>
            </div>

            {/* Status Badge */}
            <LinkStatusIndicator status={link.status} />
          </div>

          {/* Info Row: Metrics + Date */}
          <div className='flex items-center justify-between text-sm text-gray-500'>
            <div className='flex items-center gap-4'>
              <span className='flex items-center gap-1'>
                <FileText className='w-4 h-4' />
                {link.uploads}
              </span>
              <span className='flex items-center gap-1'>
                <Eye className='w-4 h-4' />
                {link.views}
              </span>
            </div>

            <div className='flex items-center gap-1'>
              <Clock className='w-4 h-4' />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Expiry Date Row */}
          {link.expiresAt && (
            <div className='flex items-center justify-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full'>
              <AlertTriangle className='w-3 h-3' />
              <span className='font-medium'>Expires {link.expiresAt}</span>
            </div>
          )}

          {/* Bottom Row: Quick Actions + Visibility + Dropdown */}
          <div className='flex items-center justify-between'>
            {/* Left: Quick Actions (Copy & Share) */}
            <div
              className='flex items-center gap-2'
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

            {/* Right: Visibility + Dropdown Menu */}
            <div className='flex items-center gap-3'>
              <LinkVisibilityIndicator isPublic={link.isPublic} />

              <div onClick={e => e.stopPropagation()}>
                <CardActionsMenu
                  actions={actions}
                  size='md'
                  align='end'
                  side='bottom'
                />
              </div>
            </div>
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

LinkCardMobile.displayName = 'LinkCardMobile';
