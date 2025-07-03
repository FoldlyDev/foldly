'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock, Share2 } from 'lucide-react';
import {
  LinkStatusIndicator,
  LinkVisibilityIndicator,
  LinkTypeIcon,
} from '../indicators';
import { LinkMobileMenu } from './link-mobile-menu';
import type { LinkData } from '../../types';

interface LinkCardMobileProps {
  link: LinkData;
  index: number;
  isBaseLink: boolean;
  formattedDate: string;
  isMultiSelected?: boolean | undefined;
  onOpenDetails: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
  isMobileActionMenuOpen: boolean;
  setIsMobileActionMenuOpen: (open: boolean) => void;
}

export const LinkCardMobile = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelected,
    onOpenDetails,
    onCopyLink,
    onShare,
    onViewDetails,
    onDelete,
    isMobileActionMenuOpen,
    setIsMobileActionMenuOpen,
  }: LinkCardMobileProps) => {
    return (
      <>
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
                    {link.name}
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

            {/* Bottom Row: Visibility + Actions */}
            <div className='flex items-center justify-between'>
              <LinkVisibilityIndicator isPublic={link.isPublic} />

              {/* Touch-friendly action button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsMobileActionMenuOpen(true);
                }}
                className='flex items-center gap-2 px-3 py-2 text-sm text-gray-600 
                       hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors
                       min-h-[44px] min-w-[44px] justify-center' // Touch target size
              >
                <Share2 className='w-4 h-4' />
                <span className='sr-only'>Actions</span>
              </button>
            </div>
          </div>

          {/* Hover overlay for visual feedback */}
          <div
            className='absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 
                        transition-opacity duration-200 rounded-lg pointer-events-none'
          />
        </motion.div>

        {/* Mobile Action Menu */}
        <LinkMobileMenu
          isOpen={isMobileActionMenuOpen}
          onClose={() => setIsMobileActionMenuOpen(false)}
          link={link}
          onCopyLink={onCopyLink}
          onShare={onShare}
          onViewDetails={onViewDetails}
          onDelete={onDelete}
          isBaseLink={isBaseLink}
        />
      </>
    );
  }
);

LinkCardMobile.displayName = 'LinkCardMobile';
