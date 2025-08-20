'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  AlertTriangle,
  Folder,
  FileText,
  Trash2,
  Move,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/shadcn/progress';

export type BatchOperationType = 'delete' | 'move';

export interface BatchOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export interface BatchOperationProgress {
  completed: number;
  total: number;
  currentItem?: string;
  failed: string[];
}

interface BatchOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: BatchOperationType;
  items: BatchOperationItem[];
  targetFolder?: string; // For move operations
  onConfirm: () => Promise<void>;
  progress?: BatchOperationProgress | undefined;
  isProcessing: boolean;
}

export function BatchOperationModal({
  isOpen,
  onClose,
  operation,
  items,
  targetFolder,
  onConfirm,
  progress,
  isProcessing,
}: BatchOperationModalProps) {
  const [showProgress, setShowProgress] = useState(false);
  // Keep a local copy of items to prevent count from changing during operation
  const [localItems, setLocalItems] = useState<BatchOperationItem[]>(items);

  // Update local items only when modal opens with new items
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setLocalItems(items);
    }
  }, [isOpen, items]);

  useEffect(() => {
    if (isProcessing) {
      setShowProgress(true);
    }
  }, [isProcessing]);

  const handleClose = () => {
    if (isProcessing) return;
    setShowProgress(false);
    onClose();
  };

  const handleConfirm = async () => {
    setShowProgress(true);
    await onConfirm();
  };

  const isDelete = operation === 'delete';
  const progressPercentage = progress
    ? (progress.completed / progress.total) * 100
    : 0;
  const isComplete = progress && progress.completed === progress.total;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='sm:max-w-[500px]'
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isDelete ? (
              <>
                <AlertTriangle className='w-5 h-5 text-destructive' />
                Delete {localItems.length} Item{localItems.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Move className='w-5 h-5 text-primary' />
                Move {items.length} Item{items.length > 1 ? 's' : ''}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isDelete
              ? 'This action cannot be undone. This will permanently delete the selected items.'
              : `This will move the selected items to "${targetFolder || 'Workspace Root'}".`}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          {showProgress && progress ? (
            // Progress view
            <div className='space-y-4'>
              <div className='flex items-center justify-between text-sm'>
                <span>
                  {isComplete
                    ? 'Completed'
                    : isProcessing
                      ? 'Processing...'
                      : 'Ready'}
                </span>
                <span>
                  {progress.completed} / {progress.total}
                </span>
              </div>

              <Progress value={progressPercentage} className='w-full' />

              {progress.currentItem && !isComplete && (
                <div className='text-sm text-muted-foreground'>
                  Current: {progress.currentItem}
                </div>
              )}

              {progress.failed.length > 0 && (
                <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
                  <div className='flex items-center gap-2 text-destructive text-sm font-medium mb-2'>
                    <XCircle className='w-4 h-4' />
                    {progress.failed.length} item
                    {progress.failed.length > 1 ? 's' : ''} failed
                  </div>
                  <div className='text-xs text-destructive/90 space-y-1'>
                    {progress.failed.slice(0, 3).map((item, index) => (
                      <div key={index}>• {item}</div>
                    ))}
                    {progress.failed.length > 3 && (
                      <div>• And {progress.failed.length - 3} more...</div>
                    )}
                  </div>
                </div>
              )}

              {isComplete && progress.failed.length === 0 && (
                <div className='flex items-center gap-2 text-green-600 text-sm'>
                  <CheckCircle2 className='w-4 h-4' />
                  All items {isDelete ? 'deleted' : 'moved'} successfully
                </div>
              )}
            </div>
          ) : (
            // Confirmation view
            <div
              className={`p-4 border rounded-lg ${
                isDelete
                  ? 'bg-destructive/10 border-destructive/20'
                  : 'bg-primary/10 border-primary/20'
              }`}
            >
              <div className='space-y-3'>
                <div className='text-sm font-medium text-foreground'>
                  {isDelete ? 'Items to delete:' : 'Items to move:'}
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
          )}
        </div>

        <DialogFooter>
          {isComplete ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {!showProgress && (
                <Button
                  type='button'
                  variant={isDelete ? 'destructive' : 'default'}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className='gap-2'
                >
                  {isDelete ? (
                    <>
                      <Trash2 className='w-4 h-4' />
                      Delete {items.length} Item{items.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <Move className='w-4 h-4' />
                      Move {items.length} Item{items.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
