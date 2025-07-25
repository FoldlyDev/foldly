// CreateFolderModal - Create Folder Modal Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useFilesModalsStore } from '../../hooks/use-files-composite';
import { useFilesDataStore } from '../../store';

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const CreateFolderModal = memo(() => {
  // Store-based state - eliminates prop drilling
  const { activeModal, isModalOpen, closeModal, modalData, isSubmitting } =
    useFilesModalsStore();

  const createFolder = useFilesDataStore(state => state.createFolder);

  // Local state - Simplified for MVP
  const [folderName, setFolderName] = useState('');

  // Show modal only if create folder modal is active
  const isOpen = isModalOpen && activeModal === 'createFolder';

  // Event handlers
  const handleClose = useCallback(() => {
    closeModal();
    setFolderName('');
  }, [closeModal]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (folderName.trim()) {
        try {
          await createFolder({
            name: folderName.trim(),
            parentId: modalData?.currentFolderId || null,
            isPublic: false,
          });

          handleClose();
        } catch (error) {
          console.error('Failed to create folder:', error);
        }
      }
    },
    [folderName, modalData, createFolder, handleClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FolderPlus className='w-5 h-5' />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder to organize your files.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Folder name - Simplified for MVP */}
          <div className='space-y-2'>
            <Label htmlFor='folderName'>Folder Name</Label>
            <Input
              id='folderName'
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder='Enter folder name'
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={!folderName.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

CreateFolderModal.displayName = 'CreateFolderModal';

export default CreateFolderModal;
