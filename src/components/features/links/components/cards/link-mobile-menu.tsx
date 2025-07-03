'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2, Eye, Settings } from 'lucide-react';
import type { LinkData } from '../../types';

interface LinkMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData;
  onCopyLink: () => void;
  onShare: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
  isBaseLink: boolean;
}

export const LinkMobileMenu = memo(
  ({
    isOpen,
    onClose,
    link,
    onCopyLink,
    onShare,
    onViewDetails,
    onDelete,
    isBaseLink,
  }: LinkMobileMenuProps) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/20 z-50'
              onClick={onClose}
            />

            {/* Action Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className='fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-200 z-50 p-4'
            >
              {/* Header */}
              <div className='flex items-center justify-between mb-4 pb-2 border-b border-gray-100'>
                <h3 className='font-semibold text-gray-900 truncate flex-1'>
                  {link.name}
                </h3>
                <button
                  onClick={onClose}
                  className='w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100'
                >
                  ×
                </button>
              </div>

              {/* Actions */}
              <div className='space-y-2'>
                <button
                  onClick={() => {
                    onCopyLink();
                    onClose();
                  }}
                  className='w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors'
                >
                  <Copy className='w-5 h-5 text-gray-600' />
                  <span className='font-medium text-gray-900'>Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    onShare();
                    onClose();
                  }}
                  className='w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors'
                >
                  <Share2 className='w-5 h-5 text-gray-600' />
                  <span className='font-medium text-gray-900'>Share</span>
                </button>

                <button
                  onClick={() => {
                    onViewDetails();
                    onClose();
                  }}
                  className='w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors'
                >
                  <Eye className='w-5 h-5 text-gray-600' />
                  <span className='font-medium text-gray-900'>
                    View Details
                  </span>
                </button>

                {!isBaseLink && onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className='w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Settings className='w-5 h-5 text-red-600' />
                    <span className='font-medium text-red-600'>
                      Delete Link
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

LinkMobileMenu.displayName = 'LinkMobileMenu';
