'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  FolderPlus,
  Search,
  MoreVertical,
  Minimize2,
  Maximize2,
  X,
  Trash2,
  CheckSquare,
  Square,
  CloudUpload,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { useLinkUploadStagingStore } from '../../stores/staging-store';
import { formatBytes } from '@/lib/utils';

interface LinkUploadToolbarProps {
  className?: string;
  treeInstance?: {
    getSelectedItems?: () => Array<{
      getId: () => string;
      getItemName: () => string;
      isFolder: () => boolean;
    }>;
    getItemInstance?: (
      id: string
    ) => { expand: () => void; isExpanded: () => boolean } | null;
    addFolder?: (name: string, parentId?: string) => string | null;
    deleteItems?: (itemIds: string[]) => void;
    expandAll?: () => void;
    collapseAll?: () => void;
    isTouchDevice?: () => boolean;
    isSelectionMode?: () => boolean;
    setSelectionMode?: (mode: boolean) => void;
    addFolderToTree?: (folder: any) => void;
  };
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedItems?: string[];
  onClearSelection?: () => void;
  selectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
  onOpenUploadModal?: () => void;
  onOpenVerificationModal?: () => void;
}

export function LinkUploadToolbar({
  className = '',
  treeInstance,
  searchQuery = '',
  setSearchQuery,
  selectedItems = [],
  onClearSelection,
  selectionMode = false,
  onSelectionModeChange,
  onOpenUploadModal,
  onOpenVerificationModal,
}: LinkUploadToolbarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const {
    getStagedFileCount,
    getTotalStagedSize,
    hasAnyStaged,
    hasValidContent,
    removeStagedItems,
    addStagedFolder,
    getAllStagedItems,
  } = useLinkUploadStagingStore();

  // Get mobile state from tree instance
  const isMobile = treeInstance?.isTouchDevice?.() || false;

  // Use external selection mode state if provided, otherwise fallback to tree instance
  const isSelectionMode =
    selectionMode ?? (treeInstance?.isSelectionMode?.() || false);

  // Handle selection mode toggle
  const handleToggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    // Update external state if handler provided
    if (onSelectionModeChange) {
      onSelectionModeChange(newMode);
    }
    // Also update tree instance if available
    if (treeInstance?.setSelectionMode) {
      treeInstance.setSelectionMode(newMode);
    }
  };

  // Collapse all functionality
  const handleCollapseAll = () => {
    if (treeInstance?.collapseAll) {
      treeInstance.collapseAll();
    }
  };

  // Expand all functionality
  const handleExpandAll = () => {
    if (treeInstance?.expandAll) {
      treeInstance.expandAll();
    }
  };

  // Handle folder creation for staging
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    // Get parent folder from selected items
    const selectedTreeItems = treeInstance?.getSelectedItems?.() || [];
    const selectedFolders = selectedTreeItems.filter(item => item.isFolder?.());
    const parentId = selectedFolders.length === 1 ? selectedFolders[0]?.getId() : null;
    
    // Add folder to staging store
    const folderId = addStagedFolder(newFolderName, parentId || null);
    
    // Add folder to tree
    if (treeInstance?.addFolderToTree) {
      treeInstance.addFolderToTree({
        id: folderId,
        name: newFolderName,
        parentId,
        type: 'folder',
        path: '/',
        depth: 0,
        fileCount: 0,
        totalSize: 0,
        isArchived: false,
        sortOrder: 999,
      });
    }
    
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Handle delete for staged items
  const handleDelete = () => {
    if (selectedItems.length === 0) return;
    
    // Remove from staging store
    removeStagedItems(selectedItems);
    
    // Remove from tree
    if (treeInstance?.deleteItems) {
      treeInstance.deleteItems(selectedItems);
    }
    
    // Clear selection
    onClearSelection?.();
  };

  // Get the container folder name for new folder creation
  const getTargetFolderName = () => {
    const selectedTreeItems = treeInstance?.getSelectedItems?.() || [];
    const selectedFolders = selectedTreeItems.filter(item => item.isFolder?.());

    if (selectedFolders.length === 1) {
      return selectedFolders[0]?.getItemName?.() || 'Selected Folder';
    } else if (selectedFolders.length > 1) {
      return 'Multiple Folders';
    } else {
      return 'Root';
    }
  };

  // Get staging stats
  const { folders, files } = getAllStagedItems();

  // Count empty folders
  const emptyFolders = folders.filter(folder => {
    // Check if this folder has any files in it
    const hasFiles = files.some(file => file.parentId === folder.id);
    if (hasFiles) return false;

    // Check if this folder has any subfolders with content
    const hasSubfoldersWithContent = folders.some(subfolder =>
      subfolder.parentId === folder.id &&
      files.some(file => file.parentId === subfolder.id)
    );
    return !hasSubfoldersWithContent;
  });

  const stagingStats = {
    fileCount: getStagedFileCount(),
    folderCount: folders.length,
    emptyFolderCount: emptyFolders.length,
    totalSize: getTotalStagedSize(),
    hasAnyStaged: hasAnyStaged(), // Has files OR folders
    hasValidContent: hasValidContent(), // Only true if all folders have files
  };

  // Handle send files click with validation
  const handleSendFilesClick = () => {
    if (!stagingStats.hasValidContent) {
      // Don't open modal - the inline message already explains why
      return;
    }
    // Open verification modal if we have valid content
    onOpenVerificationModal?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
      className={`workspace-toolbar ${className}`}
    >
      {/* Staging info bar - shows when anything is staged */}
      {stagingStats.hasAnyStaged && (
        <div className='bg-primary/5 border-b border-primary/20'>
          <div className='flex items-center justify-between px-6 py-2'>
            <div className='flex items-center gap-4'>
              <span className='text-sm font-medium'>
                {stagingStats.fileCount > 0 ? (
                  `${stagingStats.fileCount} file${stagingStats.fileCount !== 1 ? 's' : ''} staged`
                ) : (
                  `${stagingStats.folderCount} empty folder${stagingStats.folderCount !== 1 ? 's' : ''}`
                )}
              </span>
              {stagingStats.fileCount > 0 && (
                <span className='text-sm text-muted-foreground'>
                  {formatBytes(stagingStats.totalSize)}
                </span>
              )}
            </div>
            <Button
              size='sm'
              onClick={handleSendFilesClick}
              className='flex items-center'
              disabled={!stagingStats.hasValidContent}
              variant={stagingStats.hasValidContent ? 'default' : 'secondary'}
            >
              {!stagingStats.hasValidContent && (
                <AlertCircle className='h-4 w-4 mr-2' />
              )}
              {stagingStats.hasValidContent && (
                <Send className='h-4 w-4 mr-2' />
              )}
              Send Files
            </Button>
          </div>
          {/* Show inline message when there are empty folders */}
          {!stagingStats.hasValidContent && stagingStats.emptyFolderCount > 0 && (
            <div className='px-6 pb-2'>
              <div className='flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500'>
                <AlertCircle className='h-3 w-3' />
                <span>
                  {stagingStats.emptyFolderCount} empty folder{stagingStats.emptyFolderCount !== 1 ? 's' : ''} detected -
                  all folders must contain files before uploading
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main toolbar */}
      <div className='workspace-toolbar-main'>
        {/* Left side - Main actions */}
        <div className='workspace-toolbar-left'>
          {/* Selection mode toggle */}
          <div className='flex items-center mr-3'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={isSelectionMode}
                onChange={handleToggleSelectionMode}
                className='sr-only'
              />
              <Button
                size='sm'
                variant={isSelectionMode ? 'default' : 'ghost'}
                onClick={handleToggleSelectionMode}
                className='flex items-center'
                type='button'
              >
                {isSelectionMode ? (
                  <CheckSquare className='h-4 w-4 mr-2' />
                ) : (
                  <Square className='h-4 w-4 mr-2' />
                )}
                <span>
                  {isMobile ? (isSelectionMode ? 'Exit' : 'Select') : 'Select'}
                </span>
              </Button>
            </label>
          </div>

          {/* Add files button */}
          <Button
            size='sm'
            variant='ghost'
            onClick={onOpenUploadModal}
            className='mr-2'
          >
            <CloudUpload className='h-4 w-4 mr-2' />
            Add Files
          </Button>

          {/* Create folder */}
          {isCreatingFolder ? (
            <div className='workspace-folder-creation'>
              <div className='workspace-folder-input-group'>
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
                  className='workspace-folder-input h-8'
                  autoFocus
                />
                <Button
                  size='sm'
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
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
              <span className='text-xs text-muted-foreground'>
                Creating in: {getTargetFolderName()}
              </span>
            </div>
          ) : (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className='h-4 w-4 mr-2' />
              New Folder
            </Button>
          )}
        </div>

        {/* Right side - Search and menu */}
        <div className='workspace-toolbar-right'>
          {/* Search */}
          <div className='workspace-search-container'>
            <Input
              type='text'
              placeholder='Search files and folders...'
              value={searchQuery}
              onChange={e => setSearchQuery?.(e.target.value)}
              className='h-8 w-full pl-8'
            />
            <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          </div>

          {/* More options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='ghost'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleExpandAll}>
                <Maximize2 className='h-4 w-4 mr-2' />
                Expand All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCollapseAll}>
                <Minimize2 className='h-4 w-4 mr-2' />
                Collapse All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mini-actions toolbar - shows when items are selected */}
      {(selectedItems.length > 0 || (isMobile && isSelectionMode)) && (
        <div className='flex items-center justify-between px-6 py-2 bg-tertiary/10 dark:bg-primary/10 border-b border-neutral-200 dark:border-border'>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-tertiary dark:text-primary'>
              {selectedItems.length > 0 ? (
                <>
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? 's' : ''} selected
                </>
              ) : (
                'Tap items to select'
              )}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            {selectedItems.length > 0 && (
              <Button
                size='sm'
                variant='ghost'
                className='h-8 px-3 text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                onClick={handleDelete}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </Button>
            )}

            <Button
              size='sm'
              variant='ghost'
              className='h-8 px-3'
              onClick={() => {
                onClearSelection?.();
                // Exit selection mode on mobile when clearing
                if (isMobile && isSelectionMode && selectedItems.length > 0) {
                  handleToggleSelectionMode();
                }
              }}
            >
              <X className='h-4 w-4 mr-2' />
              {isMobile && isSelectionMode && selectedItems.length === 0
                ? 'Cancel'
                : 'Clear'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}