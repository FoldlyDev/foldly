'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/marketing/animate-ui/radix/checkbox';
import { LinkStatusIndicator, LinkTypeIcon } from '../indicators';
import { SearchHighlight } from '@/components/ui/core/search-highlight';
import { ActionButton } from '@/components/ui/core/action-button';
import { AnimatedCopyButton } from '@/components/ui/core/animated-copy-button';
import { CardActionsMenu } from '@/components/ui/core/card-actions-menu';
import type { LinkWithStats } from '@/lib/database/types';
import type { ActionItem } from '@/components/ui/core/types';
import { useLinkUrl } from '../../hooks/use-link-url';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';

interface LinkCardDesktopProps {
  link: LinkWithStats;
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
  unreadCount?: number;
  onClearNotifications?: () => void;
}

export const LinkCardDesktop = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelectMode: _isMultiSelectMode,
    isMultiSelected,
    onOpenDetails,
    onCopyLink: _onCopyLink,
    onShare: _onShare,
    onSelectionChange,
    actions,
    quickActions,
    searchQuery,
    unreadCount = 0,
    onClearNotifications,
  }: LinkCardDesktopProps) => {
    const { displayUrl } = useLinkUrl(link.slug, link.topic);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={onOpenDetails}
        className={`
        link-card group
        ${isBaseLink ? 'link-card--base' : 'link-card--regular'}
        ${isMultiSelected && !isBaseLink ? 'link-card--selected' : ''}
      `}
        style={{
          borderLeftColor: link.branding?.enabled && link.branding?.color ? link.branding.color : undefined
        }}
      >
        <div className='link-card-content'>
          {/* Selection checkbox (desktop only) */}
          {!isBaseLink && onSelectionChange && (
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
                <h3 className='link-card-title'>
                  <SearchHighlight
                    text={link.title}
                    searchQuery={searchQuery || ''}
                  />
                </h3>
              </div>
              <p className='link-card-url'>{displayUrl}</p>
            </div>
          </div>

          {/* Status */}
          <div className='flex items-center gap-3 flex-shrink-0'>
            {unreadCount > 0 && (
              <div onClick={e => e.stopPropagation()}>
                <NotificationBadge
                  count={unreadCount}
                  {...(onClearNotifications && { onClick: onClearNotifications })}
                />
              </div>
            )}
            <LinkStatusIndicator status={link.isActive ? 'active' : 'paused'} />
          </div>

          {/* Metrics */}
          <div className='link-card-metadata flex-shrink-0'>
            <span className='link-card-metadata-item'>
              <FileText className='link-card-metadata-icon' />
              {link.stats?.fileCount ?? 0}
            </span>
            <span className='link-card-metadata-item'>
              <Eye className='link-card-metadata-icon' />
              {link.stats?.totalViewCount ?? 0}
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
                <span className='font-medium'>
                  Expires {new Date(link.expiresAt).toLocaleDateString()}
                </span>
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
