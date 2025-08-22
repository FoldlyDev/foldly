'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderTree, Upload, HardDrive, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
// TODO: Replace with new FileTree component from @/components/file-tree
// import WorkspaceTree from '@/features/workspace/components/tree/WorkspaceTree';
import { useFilesManagementStore } from '../../store/files-management-store';
import { cn } from '@/lib/utils';
import type { TreeNode } from '../../types';

interface WorkspacePanelProps {
  onDrop?: (e: React.DragEvent, targetFolderId: string | null) => void;
  className?: string;
  storageUsed?: number;
  storageLimit?: number;
}

export function WorkspacePanel({
  onDrop,
  className,
  storageUsed = 0,
  storageLimit = 5368709120, // 5GB default
}: WorkspacePanelProps) {
  const { isCopying } = useFilesManagementStore();
  const [dragOver, setDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (onDrop) {
        // Get the target folder from the drop event
        // For now, we'll use the root (null) as the target
        onDrop(e, dropTarget);
      }
    },
    [onDrop, dropTarget]
  );

  const formatStorageSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <Card
      className={cn(
        'flex flex-col transition-all duration-200',
        dragOver && 'ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.01]',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className='pb-3 shrink-0'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FolderTree className='h-5 w-5 text-green-600' />
            <CardTitle className='text-lg'>My Workspace</CardTitle>
          </div>
          <Badge variant='secondary' className='text-xs'>
            Personal Storage
          </Badge>
        </div>

        {/* Storage Info */}
        <div className='mt-3 space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Storage Used</span>
            <span className='font-medium'>
              {formatStorageSize(storageUsed)} /{' '}
              {formatStorageSize(storageLimit)}
            </span>
          </div>
          <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
            <motion.div
              className={cn(
                'h-full',
                storagePercentage > 90
                  ? 'bg-destructive'
                  : storagePercentage > 70
                    ? 'bg-warning'
                    : 'bg-primary'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${storagePercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex-1 overflow-hidden p-0'>
        <div className='h-full flex flex-col'>
          {/* Info Alert */}
          <div className='px-4 pb-3 shrink-0'>
            <Alert>
              <Info className='h-4 w-4 shrink-0' />
              <AlertDescription className='text-xs'>
                Drag files from the left panel and drop them here to copy to
                your workspace. Files will maintain their folder structure.
              </AlertDescription>
            </Alert>
          </div>

          {/* Workspace Tree */}
          <div className='flex-1 overflow-hidden px-4'>
            <ScrollArea className='h-full'>
              <div className='pb-4'>
                {/* TODO: Replace with new FileTree component
                <WorkspaceTree
                  onRootDrop={dataTransfer => {
                    // Handle drop on root
                    setDropTarget(null);
                    const e = { dataTransfer } as React.DragEvent;
                    handleDrop(e);
                  }}
                />
                */}
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <FolderTree className='h-12 w-12 text-muted-foreground mb-4' />
                  <p className='text-muted-foreground text-sm mb-2'>
                    Tree component temporarily disabled
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Migration to new FileTree in progress
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Copy Progress Overlay */}
        {isCopying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center'
          >
            <div className='text-center'>
              <div className='h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3' />
              <p className='text-sm font-medium'>
                Copying items to your workspace...
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                {
                  [
                    "Hold tight, we're yeeting your files over! 🚀",
                    'Just vibing with your data transfer rn... 💫',
                    'Files coming through, this might take a sec... ⏳',
                    'Your files are on their way, bestie! ✨',
                    "Copying faster than you can say 'bussin'! 🔥",
                  ][Math.floor(Math.random() * 5)]
                }
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
