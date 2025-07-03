'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock } from 'lucide-react';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import {
  LinkStatusIndicator,
  LinkVisibilityIndicator,
  LinkTypeIcon,
} from '../indicators';
import { LinkCardActions } from './link-card-actions';
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
              <h3 className='font-medium text-gray-900 text-sm truncate'>
                {link.name}
              </h3>
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
          <div className='flex items-center gap-1 text-sm text-gray-500 flex-shrink-0 min-w-[100px]'>
            <Clock className='w-3.5 h-3.5' />
            <span>{formattedDate}</span>
          </div>

          {/* Quick Actions */}
          <LinkCardActions
            onCopyLink={onCopyLink}
            onShare={onShare}
            actions={actions}
          />
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
