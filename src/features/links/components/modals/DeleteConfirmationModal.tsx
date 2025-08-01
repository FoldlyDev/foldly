'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/marketing/animate-ui/radix/dialog';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import { useDeleteLinkMutation } from '../../hooks/react-query/use-delete-link-mutation';
import { useLinkUrl } from '../../hooks/use-link-url';

export function DeleteConfirmationModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal, setLoading } = useModalStore();

  // React Query mutation hook
  const deleteLink = useDeleteLinkMutation();

  const isOpen = currentModal === 'delete-confirmation';
  const isDeleting = deleteLink.isPending;

  if (!isOpen || !link) return null;

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteLink.mutateAsync(link.id);
      // Success handling and UI updates are handled by the mutation hook
      closeModal();
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return; // Prevent closing while deleting
    closeModal();
  };

  const { displayUrl } = useLinkUrl(link.slug, link.topic);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-md h-auto max-h-[calc(100vh-2rem)] p-0 overflow-hidden'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Delete{' '}
          {link.linkType === 'base'
            ? 'Personal Collection Link'
            : 'Custom Topic Link'}
          : {link.title}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Permanently delete your link and all associated files and data
        </DialogDescription>

        {/* Header - Consistent with other modals */}
        <div className='relative bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'>
          <div className='px-6 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg'>
                <AlertTriangle className='w-6 h-6 text-white' />
              </div>
            </div>
            <h1 className='text-xl font-bold text-gray-900 leading-tight mb-2'>
              Delete{' '}
              {link.linkType === 'base'
                ? 'Personal Collection'
                : 'Custom Topic'}
            </h1>
            <div className='flex justify-center'>
              <p className='text-sm text-gray-600 text-center max-w-sm'>
                "{link.title}" will be permanently removed
              </p>
            </div>
          </div>
        </div>

        <div className='p-6 space-y-4'>
          {/* Compact Link Info */}
          <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
                <Trash2 className='w-4 h-4 text-red-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-gray-900 truncate'>
                  {link.title}
                </p>
                <div className='flex items-center gap-3 mt-1 text-xs text-gray-500'>
                  <code className='truncate'>{displayUrl}</code>
                  <span>•</span>
                  <span>{link.totalFiles} files</span>
                  <span>•</span>
                  <span>{(link.totalSize / (1024 * 1024)).toFixed(1)}MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Warning */}
          <div className='bg-amber-50 border border-amber-200 rounded-xl p-3'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-amber-900'>
                  All files, settings, and statistics will be permanently
                  deleted. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className='flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors'
            >
              {isDeleting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4' />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
