'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/animate-ui/radix/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { useBulkDeleteLinksMutation } from '../../hooks/react-query/use-bulk-delete-mutation';
import type { LinkWithStats } from '@/lib/database/types';

interface BulkDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLinks: LinkWithStats[];
  onSuccess?: () => void;
}

export function BulkDeleteConfirmationModal({
  isOpen,
  onClose,
  selectedLinks,
  onSuccess,
}: BulkDeleteConfirmationModalProps) {
  const deleteLinks = useBulkDeleteLinksMutation();
  const isDeleting = deleteLinks.isPending;

  const handleDelete = async () => {
    try {
      const linkIds = selectedLinks.map(link => link.id);
      await deleteLinks.mutateAsync(linkIds);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Bulk delete failed:', error);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return; // Prevent closing while deleting
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-xl h-auto max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Delete {selectedLinks.length} Links
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Permanently delete selected links and all associated files and data
        </DialogDescription>

        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg'>
                <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground'>
                  Delete {selectedLinks.length} Link{selectedLinks.length > 1 ? 's' : ''}
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4'>
          {/* Warning Message */}
          <div className='overview-card bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'>
            <div className='flex gap-3'>
              <Trash2 className='w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' />
              <div className='space-y-2'>
                <p className='text-sm font-medium text-red-900 dark:text-red-200'>
                  You are about to permanently delete {selectedLinks.length} link{selectedLinks.length > 1 ? 's' : ''}:
                </p>
                <ul className='space-y-1 max-h-40 overflow-y-auto'>
                  {selectedLinks.map(link => (
                    <li key={link.id} className='text-sm text-red-800 dark:text-red-300'>
                      • {link.title} ({link.linkType})
                    </li>
                  ))}
                </ul>
                <p className='text-xs text-red-700 dark:text-red-400 font-medium'>
                  All associated files, folders, and data will be permanently removed.
                </p>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className='overview-card'>
            <h3 className='text-sm font-semibold mb-2'>Impact Summary</h3>
            <div className='space-y-1 text-sm text-muted-foreground'>
              <div className='flex justify-between'>
                <span>Total Files:</span>
                <span className='font-medium text-foreground'>
                  {selectedLinks.reduce((sum, link) => sum + link.totalFiles, 0)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Total Uploads:</span>
                <span className='font-medium text-foreground'>
                  {selectedLinks.reduce((sum, link) => sum + link.totalUploads, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='modal-footer shrink-0'>
          <div className='flex gap-3 p-4 sm:p-6 lg:p-8'>
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={isDeleting}
              className='flex-1 sm:flex-none'
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
              className='flex-1 sm:flex-none'
            >
              {isDeleting ? (
                <>
                  <span className='animate-spin mr-2'>⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete {selectedLinks.length} Link{selectedLinks.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}