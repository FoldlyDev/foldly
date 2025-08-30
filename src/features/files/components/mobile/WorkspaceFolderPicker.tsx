'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, FolderOpen, ChevronRight, Home, Check } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
// TODO: Replace with new FileTree component from @/components/file-tree
// import WorkspaceTree from '@/features/workspace/components/tree/WorkspaceTree';
// TODO: Fix import - useWorkspaceTree doesn't exist
// import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { cn } from '@/lib/utils';

interface WorkspaceFolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

export function WorkspaceFolderPicker({
  isOpen,
  onClose,
  onSelect,
  selectedFolderId,
}: WorkspaceFolderPickerProps) {
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(
    selectedFolderId
  );
  // TODO: Fix - useWorkspaceTree doesn't exist
  // const { data: workspaceData } = useWorkspaceTree();
  const workspaceData: any = null; // Temporary fix

  // Check if there are any folders in the workspace
  const hasFolders = workspaceData?.folders && workspaceData.folders.length > 0;

  const handleSelect = () => {
    onSelect(tempSelectedId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 bg-background/80 backdrop-blur-sm'
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className='fixed bottom-0 left-0 right-0 z-50 h-[80vh] bg-background rounded-t-2xl shadow-xl'
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b'>
            <h2 className='text-lg font-semibold'>Select Destination</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='h-8 w-8'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className='flex-1 h-[calc(80vh-8rem)]'>
            <div className='p-4'>
              {/* Root folder option */}
              <button
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
                  'hover:bg-accent',
                  tempSelectedId === null && 'bg-accent'
                )}
                onClick={() => setTempSelectedId(null)}
              >
                <Home className='h-5 w-5 text-muted-foreground' />
                <span className='flex-1 text-left font-medium'>
                  My Workspace
                </span>
                {tempSelectedId === null && (
                  <Check className='h-4 w-4 text-primary' />
                )}
              </button>

              {/* Workspace tree */}
              <div className='mt-4'>
                {hasFolders ? (
                  /* TODO: Replace with new FileTree component
                  <WorkspaceTree
                    onSelectionChange={selectedItems => {
                      if (selectedItems.length > 0) {
                        setTempSelectedId(selectedItems[0]);
                      }
                    }}
                    selectedItems={tempSelectedId ? [tempSelectedId] : []}
                  />
                  */
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Folder className='h-12 w-12 text-muted-foreground mb-4' />
                    <p className='text-muted-foreground text-sm mb-2'>
                      Tree component temporarily disabled
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      Migration to new FileTree in progress
                    </p>
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Folder className='h-12 w-12 text-muted-foreground mb-4' />
                    <p className='text-muted-foreground text-sm mb-2'>
                      No folders yet? No cap! 🧢
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      Your files will vibe in the root folder for now
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className='p-4 border-t'>
            <div className='flex gap-3'>
              <Button variant='outline' onClick={onClose} className='flex-1'>
                Cancel
              </Button>
              <Button onClick={handleSelect} className='flex-1'>
                {!hasFolders && tempSelectedId === null
                  ? 'Copy to Root'
                  : 'Copy Here'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
