'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/shadcn/dialog';
import { AlertTriangle, Folder, FileText, Trash2 } from 'lucide-react';
import { deleteFileAction, deleteFolderAction } from '../../lib/actions';
import { toast } from 'sonner';
import type { DatabaseId } from '@/lib/database/types';
import { useInvalidateStorage } from '../../hooks/use-storage-tracking';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: DatabaseId;
    name: string;
    type: 'file' | 'folder';
  } | null;
}

export function DeleteModal({ isOpen, onClose, item }: DeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invalidateStorage = useInvalidateStorage();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!item) return;

    setIsSubmitting(true);

    try {
      const result =
        item.type === 'folder'
          ? await deleteFolderAction(item.id)
          : await deleteFileAction(item.id);

      if (result.success) {
        // Invalidate both storage and workspace tree queries for real-time updates
        await Promise.all([
          invalidateStorage(),
          queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() })
        ]);
        
        onClose();
        toast.success(
          `${item.type === 'folder' ? 'Folder' : 'File'} deleted successfully`
        );
      } else {
        toast.error(result.error || `Failed to delete ${item.type}`);
      }
    } catch (error) {
      toast.error(
        `Failed to delete ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-destructive' />
            Delete {item.type === 'folder' ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            {item.type}.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
            {item.type === 'folder' ? (
              <Folder className='w-8 h-8 text-primary flex-shrink-0' />
            ) : (
              <FileText className='w-8 h-8 text-muted-foreground flex-shrink-0' />
            )}
            <div className='min-w-0 flex-1'>
              <p className='font-medium text-foreground truncate'>{item.name}</p>
              <p className='text-sm text-muted-foreground capitalize'>{item.type}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isSubmitting}
            className='gap-2'
          >
            {isSubmitting ? (
              <>
                <div className='w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin' />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className='w-4 h-4' />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
