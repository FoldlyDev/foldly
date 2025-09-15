'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { AlertTriangle, Folder, FileText } from 'lucide-react';

export interface DeleteItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeleteItem[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  items,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='sm:max-w-[500px]'
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-destructive' />
            Delete {items.length} Item{items.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            This action will remove the selected items from your staging area.
            They will not be uploaded to the server.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='p-4 border rounded-lg bg-destructive/10 border-destructive/20'>
            <div className='space-y-3'>
              <div className='text-sm font-medium text-foreground'>
                Items to delete:
              </div>
              <div className='max-h-32 overflow-y-auto space-y-2'>
                {items.slice(0, 5).map(item => (
                  <div key={item.id} className='flex items-center gap-3'>
                    {item.type === 'folder' ? (
                      <Folder className='w-4 h-4 text-primary flex-shrink-0' />
                    ) : (
                      <FileText className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                    )}
                    <span className='text-sm text-foreground/90 truncate'>
                      {item.name}
                    </span>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className='text-xs text-muted-foreground italic'>
                    ... and {items.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleConfirm}
            disabled={isLoading}
            className='gap-2'
          >
            Delete {items.length} Item{items.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}