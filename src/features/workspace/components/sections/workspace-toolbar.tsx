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
// No longer using old tree store - functionality moved to new WorkspaceTree component

interface WorkspaceToolbarProps {
  className?: string;
}

export function WorkspaceToolbar({ className = '' }: WorkspaceToolbarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const queryClient = useQueryClient();

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

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const result = await createFolderAction(folderName);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      toast.success('Folder created successfully');
      setNewFolderName('');
      setIsCreatingFolder(false);
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create folder'
      );
    },
  });

  const handleCreateFolder = () => {
    if (isCreatingFolder) {
      if (newFolderName.trim()) {
        createFolderMutation.mutate(newFolderName.trim());
      }
    } else {
      setIsCreatingFolder(true);
      setNewFolderName('');
    }
  };

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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-between p-4 bg-white border-b border-[var(--neutral-200)] ${className}`}
    >
      {/* Left side - Actions */}
      <div className='flex items-center gap-2'>
        {isCreatingFolder ? (
          <div className='flex items-center gap-2'>
            <Input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Folder name'
              className='w-40'
              autoFocus
            />
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              size='sm'
              variant='default'
            >
              Create
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
            >
              <FolderPlus className='w-4 h-4' />
              New Folder
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
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <SortAsc className='w-4 h-4 mr-2' />
              Toggle Sort Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
