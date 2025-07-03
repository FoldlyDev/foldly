'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/radix/dialog';
import { useLinksListStore } from '../../hooks/use-links-composite';
import type { LinkData } from '../../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  link,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { removeLink } = useLinksListStore();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Remove link from store
      removeLink(link.id);

      // Show success message
      toast.success(`${link.name} has been deleted successfully`);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to delete link:', error);
      toast.error('Failed to delete link. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return; // Prevent closing while deleting
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className='max-w-md bg-white'>
        <DialogHeader className='text-center'>
          <div className='mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
            <AlertTriangle className='w-6 h-6 text-red-600' />
          </div>

          <DialogTitle className='text-xl font-semibold text-gray-900'>
            Delete Link
          </DialogTitle>

          <DialogDescription className='text-gray-600 mt-2'>
            Are you sure you want to delete "{link.name}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6'>
          {/* Link preview */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
                <Trash2 className='w-4 h-4 text-red-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-gray-900 truncate'>
                  {link.name}
                </p>
                <p className='text-sm text-gray-500 truncate'>{link.url}</p>
              </div>
            </div>

            {/* Stats that will be lost */}
            <div className='mt-3 flex items-center gap-4 text-sm text-gray-600'>
              <span>{link.uploads} uploads</span>
              <span>{link.views} views</span>
            </div>
          </div>

          {/* Warning message */}
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-amber-800'>
                <p className='font-medium'>This will permanently delete:</p>
                <ul className='mt-1 list-disc list-inside space-y-1'>
                  <li>The upload link and its settings</li>
                  <li>All upload statistics and analytics</li>
                  <li>Any shared link URLs will stop working</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex flex-col-reverse sm:flex-row gap-3'>
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              Cancel
            </button>

            <motion.button
              onClick={handleDelete}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.02 }}
              whileTap={{ scale: isDeleting ? 1 : 0.98 }}
              className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isDeleting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4' />
                  Delete Link
                </>
              )}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
