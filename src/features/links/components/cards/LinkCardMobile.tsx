'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/animate-ui/radix/checkbox';
import { LinkStatusIndicator, LinkTypeIcon } from '../indicators';
import { SearchHighlight, CardActionsMenu } from '@/components/core';
import type { ActionItem } from '@/components/core/types';
import type { LinkWithStats } from '@/lib/database/types';
import { useLinkUrl } from '../../hooks/use-link-url';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';

interface LinkCardMobileProps {
  link: LinkWithStats;
  index: number;
  isBaseLink: boolean;
  formattedDate: string;
  isMultiSelected?: boolean | undefined;
  onOpenDetails: () => void;
  onMultiSelect?: ((linkId: string) => void) | undefined;
  actions: ActionItem[];
  quickActions?: ActionItem[];
  searchQuery?: string;
  unreadCount?: number;
  onClearNotifications?: () => void;
}

export const LinkCardMobile = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelected,
    onOpenDetails,
    onMultiSelect,
    actions,
    quickActions: _quickActions,
    searchQuery,
    unreadCount = 0,
    onClearNotifications,
  }: LinkCardMobileProps) => {
    const { displayUrl } = useLinkUrl(link.slug, link.topic);
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
              ? 'border-l-4 shadow-sm' // Special base link styling
              : 'border border-gray-200 hover:border-gray-300' // Regular topic link styling
          }
          ${
            isMultiSelected && !isBaseLink
              ? 'ring-2 ring-blue-400 ring-opacity-50' // Selection ring only for topic links
              : ''
          }
        `}
        style={{
          borderLeftColor:
            link.branding?.enabled && link.branding?.color
              ? link.branding.color
              : isBaseLink
                ? '#c084fc'
                : undefined, // purple-400 as fallback for base links
        }}
      >
        <div className='p-4 space-y-3'>
          {/* Header Row: Title + Status */}
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-3 min-w-0 flex-1'>
              {/* Selection checkbox - Only show for custom links */}
              {onMultiSelect && !isBaseLink && (
                <div onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={isMultiSelected || false}
                    onCheckedChange={() => onMultiSelect(link.id)}
                    className='w-4 h-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                  />
                </div>
              )}

              {/* Icon */}
              <LinkTypeIcon
                isBaseLink={isBaseLink}
                size='md'
                brandingEnabled={link.branding?.enabled}
                {...(link.branding?.imageUrl && {
                  brandingImageUrl: link.branding.imageUrl,
                })}
              />

              {/* Title & URL */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold text-gray-900 text-base truncate'>
                    <SearchHighlight
                      text={link.title}
                      searchQuery={searchQuery || ''}
                    />
                  </h3>
                </div>
                <p className='text-sm text-gray-500 truncate'>{displayUrl}</p>
              </div>
            </div>

            {/* Status Badge and Notification Badge */}
            <div className='flex items-center gap-2'>
              {unreadCount > 0 && (
                <div onClick={e => e.stopPropagation()}>
                  <NotificationBadge
                    count={unreadCount}
                    {...(onClearNotifications && {
                      onClick: onClearNotifications,
                    })}
                  />
                </div>
              )}
              <LinkStatusIndicator
                status={link.isActive ? 'active' : 'paused'}
              />
            </div>
          </div>

          {/* Expiry Date Row */}
          {link.expiresAt && (
            <div className='flex items-center justify-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full'>
              <AlertTriangle className='w-3 h-3' />
              <span className='font-medium'>
                Expires {new Date(link.expiresAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Bottom Row: Quick Actions + Visibility + Dropdown */}
          <div className='flex items-center justify-between'>
            {/* Left: Date */}
            <div className='flex items-center gap-1 text-sm text-gray-500'>
              <Clock className='w-4 h-4' />
              <span>{formattedDate}</span>
            </div>

            {/* Right: Dropdown Menu */}
            <div className='flex items-center gap-3'>
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
