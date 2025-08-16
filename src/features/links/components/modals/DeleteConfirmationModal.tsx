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
import { Button } from '@/components/ui/core/shadcn/button';
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
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
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

        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg'>
                <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                  Delete{' '}
                  {link.linkType === 'base'
                    ? 'Personal Collection'
                    : 'Custom Topic'}
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                  "{link.title}" will be permanently removed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
          {/* Compact Link Info */}
          <div className='overview-card'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-red-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center'>
                <Trash2 className='w-4 h-4 text-red-600 dark:text-red-400' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-foreground truncate'>
                  {link.title}
                </p>
                <div className='flex items-center gap-3 mt-1 text-xs text-muted-foreground'>
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
          <div className='overview-card border-amber-500 dark:border-amber-500'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-foreground'>
                  All files, settings, and statistics will be permanently
                  deleted. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className='modal-footer mt-auto p-4 sm:p-6 lg:p-8 shrink-0'>
          <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3'>
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={isDeleting}
              className='w-full sm:w-auto min-w-0 sm:min-w-[100px] transition-all duration-200'
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant='destructive'
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px] bg-gradient-to-r from-red-600 to-red-600/80 hover:from-red-700 hover:to-red-700/80 text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed'
            >
              {isDeleting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4' />
                  <span>Delete Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
