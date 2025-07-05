// CreateFolderModal - Create Folder Modal Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useFilesModalsStore } from '../../hooks';
import { FOLDER_COLORS } from '../../constants';

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const CreateFolderModal = memo(() => {
  // Store-based state - eliminates prop drilling
  const { activeModal, isModalOpen, actions } = useFilesModalsStore();

  // Local state
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  // Show modal only if create folder modal is active
  const isOpen = isModalOpen && activeModal === 'createFolder';

  // Event handlers
  const handleClose = useCallback(() => {
    actions.onClose();
    setFolderName('');
    setSelectedColor(FOLDER_COLORS[0]);
  }, [actions]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (folderName.trim()) {
        // TODO: Implement folder creation logic
        console.log('Create folder:', {
          name: folderName,
          color: selectedColor,
        });
        handleClose();
      }
    },
    [folderName, selectedColor, handleClose]
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
          {/* Folder name */}
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

          {/* Color selection */}
          <div className='space-y-2'>
            <Label>Folder Color</Label>
            <div className='flex gap-2 flex-wrap'>
              {FOLDER_COLORS.map(color => (
                <button
                  key={color}
                  type='button'
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={!folderName.trim()}>
              Create Folder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

CreateFolderModal.displayName = 'CreateFolderModal';

export default CreateFolderModal;
