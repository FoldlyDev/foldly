'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Progress } from '@/components/ui/shadcn/progress';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { CloudProvider } from '@/lib/services/cloud-storage';
import { useCloudViewStore } from '../../stores/cloud-view-store';
import { useCloudTransfer } from '../../hooks/useCloudTransfer';
import { ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface CloudTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudTransferModal({
  isOpen,
  onClose,
}: CloudTransferModalProps) {
  const { selectedFiles, leftProvider, rightProvider, centerProvider } =
    useCloudViewStore();
  const { startTransfer, isTransferring, progress } = useCloudTransfer();

  // Find source provider (the one with selected files)
  const sourceProvider = Object.entries(selectedFiles).find(
    ([, files]) => files.length > 0
  )?.[0] as CloudProvider['id'] | undefined;

  const selectedFileIds = sourceProvider ? selectedFiles[sourceProvider] : [];

  // Available target providers (exclude source)
  const availableTargets = [leftProvider, centerProvider, rightProvider].filter(
    (p): p is CloudProvider['id'] => p !== null && p !== sourceProvider
  );

  const [targetProvider, setTargetProvider] = useState<
    CloudProvider['id'] | null
  >(availableTargets[0] || null);

  const handleTransfer = () => {
    if (!sourceProvider || !targetProvider) return;

    startTransfer({
      sourceProvider,
      targetProvider,
      fileIds: selectedFileIds,
    });
  };

  const getProviderName = (provider: CloudProvider['id']) => {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive';
      case 'onedrive':
        return 'OneDrive';
      default:
        return provider;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Transfer Files</DialogTitle>
          <DialogDescription>
            Transfer {selectedFileIds.length} selected file
            {selectedFileIds.length !== 1 ? 's' : ''} between cloud providers
          </DialogDescription>
        </DialogHeader>

        {!isTransferring && !progress ? (
          <>
            <div className='space-y-4 py-4'>
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <Label className='text-sm text-muted-foreground'>From</Label>
                  <div className='mt-1 font-medium'>
                    {sourceProvider
                      ? getProviderName(sourceProvider)
                      : 'No source selected'}
                  </div>
                </div>

                <ArrowRight className='w-5 h-5 text-muted-foreground' />

                <div className='flex-1'>
                  <Label htmlFor='target-provider'>To</Label>
                  <Select
                    value={targetProvider || ''}
                    onValueChange={value =>
                      setTargetProvider(value as CloudProvider['id'])
                    }
                  >
                    <SelectTrigger id='target-provider' className='mt-1'>
                      <SelectValue placeholder='Select target' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map(provider => (
                        <SelectItem key={provider} value={provider}>
                          {getProviderName(provider)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!sourceProvider || !targetProvider}
              >
                Start Transfer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className='space-y-4 py-4'>
            {progress && (
              <>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>
                      {progress.status === 'completed'
                        ? 'Transfer Complete'
                        : progress.status === 'failed'
                          ? 'Transfer Failed'
                          : progress.currentFile || 'Preparing transfer...'}
                    </span>
                    <span className='text-muted-foreground'>
                      {progress.completedFiles} / {progress.totalFiles}
                    </span>
                  </div>
                  <Progress value={progress.progress} />
                </div>

                <div className='flex items-center justify-center py-4'>
                  {progress.status === 'completed' && (
                    <CheckCircle className='w-12 h-12 text-green-500' />
                  )}
                  {progress.status === 'failed' && (
                    <XCircle className='w-12 h-12 text-destructive' />
                  )}
                  {(progress.status === 'pending' ||
                    progress.status === 'downloading' ||
                    progress.status === 'uploading') && (
                    <Loader2 className='w-12 h-12 animate-spin text-primary' />
                  )}
                </div>

                {progress.error && (
                  <div className='text-sm text-destructive text-center'>
                    {progress.error}
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                variant={
                  progress?.status === 'completed' ? 'default' : 'outline'
                }
                onClick={onClose}
                disabled={isTransferring && progress?.status !== 'failed'}
              >
                {progress?.status === 'completed' ? 'Done' : 'Close'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
