'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { AlertTriangle, Folder, FileText, Trash2 } from 'lucide-react';
import { deleteFileAction, deleteFolderAction } from '../../lib/actions';
import type { DatabaseId } from '@/lib/database/types';
import { useInvalidateStorage } from '../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { useEventBus, NotificationEventType } from '@/features/notifications/hooks/use-event-bus';

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
  const { emit } = useEventBus();

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
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.data(),
          }),
        ]);

        onClose();
        
        // Emit appropriate success event based on item type
        if (item.type === 'folder') {
          emit(NotificationEventType.WORKSPACE_FOLDER_DELETE_SUCCESS, {
            folderId: item.id as string,
            folderName: item.name,
          });
        } else {
          emit(NotificationEventType.WORKSPACE_FILE_DELETE_SUCCESS, {
            fileId: item.id as string,
            fileName: item.name,
          });
        }
      } else {
        // Emit appropriate error event based on item type
        if (item.type === 'folder') {
          emit(NotificationEventType.WORKSPACE_FOLDER_DELETE_ERROR, {
            folderId: item.id as string,
            folderName: item.name,
            error: result.error || `Failed to delete ${item.type}`,
          });
        } else {
          emit(NotificationEventType.WORKSPACE_FILE_DELETE_ERROR, {
            fileId: item.id as string,
            fileName: item.name,
            error: result.error || `Failed to delete ${item.type}`,
          });
        }
      }
    } catch (error) {
      // Emit appropriate error event for exceptions
      if (item.type === 'folder') {
        emit(NotificationEventType.WORKSPACE_FOLDER_DELETE_ERROR, {
          folderId: item.id as string,
          folderName: item.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        emit(NotificationEventType.WORKSPACE_FILE_DELETE_ERROR, {
          fileId: item.id as string,
          fileName: item.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
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
              <p className='font-medium text-foreground truncate'>
                {item.name}
              </p>
              <p className='text-sm text-muted-foreground capitalize'>
                {item.type}
              </p>
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
