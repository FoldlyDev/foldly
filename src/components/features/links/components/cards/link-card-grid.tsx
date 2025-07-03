'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Clock, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/animate-ui/radix/checkbox';
import {
  LinkStatusIndicator,
  LinkVisibilityIndicator,
  LinkTypeIcon,
} from '../indicators';
import { CardActionsMenu } from '@/components/ui';
import type { LinkData } from '../../types';
import type { ActionItem } from '@/components/ui/types';

interface LinkCardGridProps {
  link: LinkData;
  index: number;
  isBaseLink: boolean;
  formattedDate: string;
  isMultiSelected?: boolean | undefined;
  onOpenDetails: () => void;
  onMultiSelect?: ((linkId: string) => void) | undefined;
  actions: ActionItem[];
}

export const LinkCardGrid = memo(
  ({
    link,
    index,
    isBaseLink,
    formattedDate,
    isMultiSelected,
    onOpenDetails,
    onMultiSelect,
    actions,
  }: LinkCardGridProps) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={onOpenDetails}
        className={`
        group relative bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer
        ${
          isBaseLink
            ? 'border-2 border-purple-200 shadow-sm hover:shadow-lg hover:border-purple-300' // Special base link styling
            : 'border border-gray-200 shadow-sm hover:shadow-lg' // Regular topic link styling
        }
        ${
          isMultiSelected && !isBaseLink
            ? 'ring-2 ring-blue-400 ring-opacity-50' // Selection ring only for topic links
            : ''
        }
      `}
      >
        {/* Background Gradient */}
        <div
          className='absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 
                      rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        />

        <div className='relative z-10'>
          {/* Header */}
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 mb-2'>
                <LinkTypeIcon isBaseLink={isBaseLink} size='lg' />
                <div className='flex items-center gap-2'>
                  <LinkStatusIndicator status={link.status} />
                  <LinkVisibilityIndicator isPublic={link.isPublic} />
                </div>
              </div>

              <div className='flex items-center gap-3 mb-1'>
                {/* Multi-select checkbox - Only show for custom links */}
                {onMultiSelect && !isBaseLink && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className='flex items-center'
                  >
                    <Checkbox
                      checked={isMultiSelected || false}
                      onCheckedChange={checked => onMultiSelect(link.id)}
                      className='data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                    />
                  </div>
                )}
                <h3 className='font-bold text-slate-900 text-lg truncate flex-1 min-w-0'>
                  {link.name}
                </h3>
              </div>

              <div className='flex items-center gap-1 text-slate-500 text-sm'>
                <span className='truncate'>{link.url}</span>
                <ExternalLink className='w-3 h-3 flex-shrink-0' />
              </div>
            </div>

            <CardActionsMenu actions={actions} />
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div className='text-center p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <FileText className='w-4 h-4 text-slate-500' />
                <span className='text-2xl font-bold text-slate-900'>
                  {link.uploads}
                </span>
              </div>
              <div className='text-xs text-slate-500'>Uploads</div>
            </div>

            <div className='text-center p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Eye className='w-4 h-4 text-slate-500' />
                <span className='text-2xl font-bold text-slate-900'>
                  {link.views}
                </span>
              </div>
              <div className='text-xs text-slate-500'>Views</div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
            <div className='flex items-center gap-1 text-xs text-slate-500'>
              <Clock className='w-3 h-3' />
              {formattedDate}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

LinkCardGrid.displayName = 'LinkCardGrid';
