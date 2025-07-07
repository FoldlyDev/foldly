// FileUploadModal - File Upload Modal Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Progress } from '@/components/ui/shadcn/progress';
import { useFilesModalsStore } from '../../hooks';

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FileUploadModal = memo(() => {
  // Store-based state - eliminates prop drilling
  const { activeModal, isModalOpen, actions } = useFilesModalsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show modal only if upload modal is active
  const isOpen = isModalOpen && activeModal === 'upload';

  // Event handlers
  const handleClose = useCallback(() => {
    actions.onClose();
  }, [actions]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        // TODO: Implement file upload logic
        console.log('Files selected:', files);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // TODO: Implement file upload logic
      console.log('Files dropped:', files);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='w-5 h-5' />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            Upload files to your workspace. You can drag and drop or click to
            select files.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-blue-400 hover:bg-blue-50'
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <Upload className='w-12 h-12 mx-auto text-gray-400 mb-4' />
            <p className='text-lg font-medium text-gray-700 mb-2'>
              Drop files here or click to browse
            </p>
            <p className='text-sm text-gray-500'>
              Supports all file types up to 100MB each
            </p>
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={handleFileChange}
          />

          {/* Upload progress (placeholder) */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Uploading files...</span>
              <span>0%</span>
            </div>
            <Progress value={0} className='h-2' />
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleFileSelect}>Select Files</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

FileUploadModal.displayName = 'FileUploadModal';

export default FileUploadModal;
