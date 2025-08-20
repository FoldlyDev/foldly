'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { FolderPlus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { eventBus, NotificationEventType } from '@/features/notifications/core';
import { useStagingStore } from '../../stores/staging-store';

interface FolderCreationProps {
  linkId: string;
  getSelectedFolderId?: () => string | undefined;
  getTargetFolderName?: () => string;
}

export function FolderCreation({
  linkId,
  getSelectedFolderId,
  getTargetFolderName = () => 'Link Root',
}: FolderCreationProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const { addFolder: addStagedFolder } = useStagingStore();

  // Create folder mutation - stages the folder
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const trimmedName = folderName.trim();
      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }

      const parentFolderId = getSelectedFolderId?.();
      // If parentFolderId is the link ID itself, treat it as root (undefined)
      const effectiveParentId =
        parentFolderId === linkId ? undefined : parentFolderId;
      const stagingId = addStagedFolder(trimmedName, effectiveParentId);

      return { id: stagingId, name: trimmedName, parentFolderId };
    },
    onSuccess: (data) => {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
        folderId: data.id,
        folderName: data.name,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    },
    onError: error => {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: newFolderName,
        error: error instanceof Error ? error.message : 'Failed to stage folder',
      });
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  if (isCreatingFolder) {
    const targetName = getTargetFolderName();
    return (
      <div className='link-upload-folder-creation'>
        <div className='flex items-center gap-2'>
          <Input
            type='text'
            placeholder='Folder name'
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              } else if (e.key === 'Escape') {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }
            }}
            className='h-9 w-40'
            autoFocus
          />
          <Button
            size='sm'
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || createFolderMutation.isPending}
          >
            Create
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName('');
            }}
          >
            Cancel
          </Button>
        </div>
        <div className='text-xs text-muted-foreground mt-1 ml-1'>
          Creating in: <span className='font-medium'>{targetName}</span>
        </div>
      </div>
    );
  }

  const targetName = getTargetFolderName();

  return (
    <div className='flex items-center gap-2'>
      <Button
        onClick={() => setIsCreatingFolder(true)}
        variant='outline'
        className='gap-2'
        title={`Create folder in: ${targetName}`}
      >
        <FolderPlus className='h-4 w-4' />
        New Folder
      </Button>
      {targetName !== 'Link Root' && (
        <span className='text-xs text-muted-foreground'>→ {targetName}</span>
      )}
    </div>
  );
}
