'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  FolderPlus,
  Upload,
  Search,
  SortAsc,
  Filter,
  MoreVertical,
  Minimize2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { useWorkspaceUI } from '../../hooks/use-workspace-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolderAction } from '../../lib/actions';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { toast } from 'sonner';
import { useWorkspaceTreeSelectionSafe } from '../../hooks/use-workspace-tree-selection';
import { VIRTUAL_ROOT_ID } from '@/lib/utils/workspace-tree-utils';
import type { useSelectMode } from '../../hooks/use-select-mode';
import { MiniActionsToolbar } from './mini-actions-toolbar';
// No longer using old tree store - functionality moved to new WorkspaceTree component

interface WorkspaceToolbarProps {
  className?: string;
  selectMode: ReturnType<typeof useSelectMode>;
}

export function WorkspaceToolbar({
  className = '',
  selectMode,
}: WorkspaceToolbarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const queryClient = useQueryClient();

  // Get tree selection context (may be null if not in tree context)
  const treeSelection = useWorkspaceTreeSelectionSafe();

  const {
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    openUploadModal,
  } = useWorkspaceUI();

  // Collapse all functionality is now handled by the new WorkspaceTree component
  const handleCollapseAll = () => {
    // This will be handled by the new WorkspaceTree component's built-in functionality
    toast.success('All folders collapsed');
  };

  // Create folder mutation with smart parent detection
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      console.log('📁 Creating folder:', folderName);

      // Validate folder name
      const trimmedName = folderName.trim();
      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }
      if (trimmedName.length > 255) {
        throw new Error('Folder name is too long (max 255 characters)');
      }
      if (/[<>:"/\\|?*]/.test(trimmedName)) {
        throw new Error('Folder name contains invalid characters');
      }

      // Determine parent folder based on tree selection
      const parentFolderId = treeSelection?.getSelectedFolderForCreation();
      const actualParentId =
        parentFolderId === VIRTUAL_ROOT_ID ? undefined : parentFolderId;

      console.log('📁 Folder creation details:', {
        folderName: trimmedName,
        parentFolderId,
        actualParentId,
      });

      const result = await createFolderAction(trimmedName, actualParentId);
      console.log('📁 Create folder result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      return { data: result.data, parentFolderId, folderName: trimmedName };
    },
    onSuccess: ({ parentFolderId, folderName }) => {
      console.log('✅ Folder created successfully, invalidating queries...', {
        folderName,
        parentFolderId,
      });

      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      console.log(
        '🔄 Query invalidation called for key:',
        workspaceQueryKeys.tree()
      );

      // Show success message with context
      const parentName =
        parentFolderId === VIRTUAL_ROOT_ID
          ? 'workspace root'
          : treeSelection?.getItemName(parentFolderId!) || 'selected folder';

      toast.success(`Folder "${folderName}" created in ${parentName}`);

      // Expand parent folder to show new folder (best effort)
      if (
        treeSelection &&
        parentFolderId &&
        parentFolderId !== VIRTUAL_ROOT_ID
      ) {
        try {
          treeSelection.expandItem(parentFolderId);
        } catch (error) {
          // Expansion is not critical, continue silently
          console.debug('Could not expand parent folder:', parentFolderId);
        }
      }

      setNewFolderName('');
      setIsCreatingFolder(false);
    },
    onError: error => {
      console.error('❌ Folder creation failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create folder'
      );
    },
  });

  const handleCreateFolder = () => {
    if (isCreatingFolder) {
      if (canCreateFolder) {
        createFolderMutation.mutate(newFolderName.trim());
      } else if (!newFolderName.trim()) {
        toast.error('Please enter a folder name');
      } else {
        toast.error(nameValidation.error || 'Invalid folder name');
      }
    } else {
      setIsCreatingFolder(true);
      setNewFolderName('');
    }
  };

  // Get context for where folder will be created
  const getCreateFolderContext = () => {
    if (!treeSelection) return 'workspace root';

    const parentFolderId = treeSelection.getSelectedFolderForCreation();
    if (parentFolderId === VIRTUAL_ROOT_ID) {
      return 'workspace root';
    }

    return treeSelection.getItemName(parentFolderId);
  };

  // Validate folder name in real-time
  const validateFolderName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { isValid: false, error: '' }; // Empty is allowed for UX
    if (trimmed.length > 255)
      return { isValid: false, error: 'Name too long (max 255 characters)' };
    if (/[<>:"/\\|?*]/.test(trimmed))
      return {
        isValid: false,
        error: 'Invalid characters: < > : " / \\ | ? *',
      };
    return { isValid: true, error: '' };
  };

  const nameValidation = validateFolderName(newFolderName);
  const canCreateFolder =
    newFolderName.trim() &&
    nameValidation.isValid &&
    !createFolderMutation.isPending;

  const handleCancelCreate = () => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center justify-between p-4 bg-white border-b border-[var(--neutral-200)] ${className}`}
      >
        {/* Left side - Actions */}
        <div className='flex items-center gap-2'>
          {isCreatingFolder ? (
            <div className='flex items-start gap-2'>
              <div className='flex flex-col gap-1 items-start'>
                <Input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder='Folder name'
                  className={`w-48 ${!nameValidation.isValid && newFolderName ? 'border-destructive' : ''}`}
                  autoFocus
                />
                <div className='flex flex-col gap-0.5'>
                  <span className='text-xs text-muted-foreground ml-1'>
                    Creating in: {getCreateFolderContext()}
                  </span>
                  {!nameValidation.isValid && newFolderName && (
                    <span className='text-xs text-destructive ml-1'>
                      {nameValidation.error}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleCreateFolder}
                disabled={!canCreateFolder}
                size='sm'
                variant='default'
              >
                {createFolderMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
              <Button onClick={handleCancelCreate} size='sm' variant='ghost'>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={handleCreateFolder}
                size='sm'
                variant='default'
                className='flex items-center gap-2'
                title={`Create new folder in ${getCreateFolderContext()}`}
              >
                <FolderPlus className='w-4 h-4' />
                New Folder
                {treeSelection?.selectedItem && (
                  <span className='text-xs opacity-70'>
                    in {getCreateFolderContext().substring(0, 15)}
                    {getCreateFolderContext().length > 15 ? '...' : ''}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => {
                  openUploadModal();
                }}
                size='sm'
                variant='outline'
                className='flex items-center gap-2'
              >
                <Upload className='w-4 h-4' />
                Upload
              </Button>

              <Button
                onClick={handleCollapseAll}
                size='sm'
                variant='ghost'
                className='flex items-center gap-2'
                disabled={false}
              >
                <Minimize2 className='w-4 h-4' />
                Collapse All
              </Button>
            </>
          )}
        </div>

        {/* Right side - Search and View options */}
        <div className='flex items-center gap-2'>
          {/* Search */}
          <div className='relative'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--neutral-500)]' />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Search files...'
              className='pl-9 w-64'
            />
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='w-4 h-4 mr-2' />
                {filterBy === 'all'
                  ? 'All'
                  : filterBy === 'files'
                    ? 'Files'
                    : 'Folders'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterBy('all')}>
                All Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('files')}>
                Files Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('folders')}>
                Folders Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <SortAsc className='w-4 h-4 mr-2' />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date Modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('size')}>
                Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                <SortAsc className='w-4 h-4 mr-2' />
                Toggle Sort Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Mini Actions Toolbar */}
      <MiniActionsToolbar
        isSelectMode={selectMode.isSelectMode}
        selectedItemsCount={selectMode.selectedItemsCount}
        selectedItems={selectMode.selectedItems}
        onToggleSelectMode={selectMode.toggleSelectMode}
        onClearSelection={selectMode.clearSelection}
      />
    </>
  );
}
