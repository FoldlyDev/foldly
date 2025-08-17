// Files Container Component - Main Files Display
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  List,
  LayoutGrid,
  Search,
  Filter,
  Plus,
  FolderPlus,
  Upload,
  SortAsc,
  SortDesc,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { cn } from '@/lib/utils';
import { useFilesListStore } from '../../hooks/use-files-composite';
import FileCard from '../cards/FileCard';
import FolderCard from '../cards/FolderCard';
import EmptyFilesState from './EmptyFilesState';
import TwoPanelFilesView from './TwoPanelFilesView';
import { FadeTransitionWrapper } from '@/components/feedback';
import { FilesSkeleton } from '../skeletons/files-skeleton';
import {
  VIEW_MODE,
  SORT_BY,
  SORT_ORDER,
  FILTER_STATUS,
  FILTER_TYPE,
} from '../../store/files-ui-store';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FilesContainerProps {
  readonly className?: string;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FilesContainer = memo(({ className }: FilesContainerProps) => {
  // Panel mode state
  const [panelMode, setPanelMode] = useState<'single' | 'dual'>('single');

  // Store-based state - eliminates prop drilling
  const {
    files,
    folders,
    totalItems,
    isLoading,
    error,
    stats,
    viewMode,
    sorting,
    searchQuery,
    filters,
    selection,
    currentFolderId,
    // Actions
    setViewMode,
    setSorting,
    setSearchQuery,
    setFilterStatus,
    setFilterType,
    clearFilters,
    clearSelection,
    toggleMultiSelectMode,
    fetchWorkspaceData,
    // Modal actions
    openUploadModal,
    openCreateFolderModal,
    openBulkActionsModal,
  } = useFilesListStore();

  // Event handlers
  const handleViewModeChange = useCallback(
    (mode: string) => {
      setViewMode(mode as (typeof VIEW_MODE)[keyof typeof VIEW_MODE]);
    },
    [setViewMode]
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      setSorting(
        sortBy as (typeof SORT_BY)[keyof typeof SORT_BY],
        sorting.sortOrder
      );
    },
    [setSorting, sorting.sortOrder]
  );

  const handleSortOrderToggle = useCallback(() => {
    setSorting(
      sorting.sortBy,
      sorting.sortOrder === SORT_ORDER.ASC ? SORT_ORDER.DESC : SORT_ORDER.ASC
    );
  }, [setSorting, sorting]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleFilterStatusChange = useCallback(
    (status: string) => {
      setFilterStatus(
        status as (typeof FILTER_STATUS)[keyof typeof FILTER_STATUS]
      );
    },
    [setFilterStatus]
  );

  const handleFilterTypeChange = useCallback(
    (type: string) => {
      setFilterType(type as (typeof FILTER_TYPE)[keyof typeof FILTER_TYPE]);
    },
    [setFilterType]
  );

  const handleRefresh = useCallback(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Grid classes based on view mode
  const gridClasses = useMemo(() => {
    switch (viewMode) {
      case VIEW_MODE.GRID:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
      case VIEW_MODE.CARD:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
      case VIEW_MODE.LIST:
        return 'flex flex-col gap-2';
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }
  }, [viewMode]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  // Show empty state if no items
  if (!isLoading && totalItems === 0 && !filters.hasActiveFilters) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <EmptyFilesState
          onUpload={openUploadModal}
          onCreateFolder={openCreateFolderModal}
        />
      </div>
    );
  }

  // Show error state without loading
  if (error && !isLoading) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <div className='flex items-center justify-center p-8 text-red-600 h-full'>
          <div className='text-center'>
            <p className='text-lg font-medium'>Error loading files</p>
            <p className='text-sm text-red-500 mt-1'>{error}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              className='mt-4'
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FadeTransitionWrapper
      isLoading={isLoading}
      loadingComponent={<FilesSkeleton />}
      duration={300}
      className={cn('h-full flex flex-col', className)}
    >
      <div className={cn('h-full flex flex-col', className)}>
        {/* Header with controls */}
        <div className='flex flex-col gap-4 mb-6'>
          {/* Top row - Title and actions */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-semibold'>
                {currentFolderId ? 'Folder Contents' : 'My Files'}
              </h1>
              <Badge variant='secondary'>
                {stats.totalFiles} files, {stats.totalFolders} folders
              </Badge>
              {selection.hasSelection && (
                <Badge variant='outline'>
                  {selection.totalSelected} selected
                </Badge>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {selection.hasSelection && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={openBulkActionsModal}
                  >
                    Bulk Actions
                  </Button>
                  <Button variant='ghost' size='sm' onClick={clearSelection}>
                    Clear Selection
                  </Button>
                  <Separator orientation='vertical' className='h-6' />
                </>
              )}

              <Button
                variant='outline'
                size='sm'
                onClick={openCreateFolderModal}
              >
                <FolderPlus className='w-4 h-4 mr-2' />
                New Folder
              </Button>
              <Button variant='outline' size='sm' onClick={openUploadModal}>
                <Upload className='w-4 h-4 mr-2' />
                Upload
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={toggleMultiSelectMode}
                className={selection.isMultiSelectMode ? 'bg-blue-100' : ''}
              >
                <Grid3X3 className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn('w-4 h-4', isLoading && 'animate-spin')}
                />
              </Button>
            </div>
          </div>

          {/* Second row - Search, filters, and view controls */}
          <div className='flex items-center gap-4'>
            {/* Search */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Search files and folders...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='pl-9'
              />
            </div>

            {/* Filters */}
            <Select
              value={filters.status}
              onValueChange={handleFilterStatusChange}
            >
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_STATUS.ALL}>All Status</SelectItem>
                <SelectItem value={FILTER_STATUS.ACTIVE}>Active</SelectItem>
                <SelectItem value={FILTER_STATUS.PROCESSING}>
                  Processing
                </SelectItem>
                <SelectItem value={FILTER_STATUS.ERROR}>Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_TYPE.ALL}>All Types</SelectItem>
                <SelectItem value={FILTER_TYPE.FILES}>Files</SelectItem>
                <SelectItem value={FILTER_TYPE.FOLDERS}>Folders</SelectItem>
                <SelectItem value={FILTER_TYPE.IMAGES}>Images</SelectItem>
                <SelectItem value={FILTER_TYPE.DOCUMENTS}>Documents</SelectItem>
                <SelectItem value={FILTER_TYPE.VIDEOS}>Videos</SelectItem>
                <SelectItem value={FILTER_TYPE.AUDIO}>Audio</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className='flex items-center gap-1'>
              <Select value={sorting.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SORT_BY.NAME}>Name</SelectItem>
                  <SelectItem value={SORT_BY.SIZE}>Size</SelectItem>
                  <SelectItem value={SORT_BY.TYPE}>Type</SelectItem>
                  <SelectItem value={SORT_BY.CREATED_AT}>Created</SelectItem>
                  <SelectItem value={SORT_BY.UPDATED_AT}>Modified</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleSortOrderToggle}
                className='p-2'
              >
                {sorting.sortOrder === SORT_ORDER.ASC ? (
                  <SortAsc className='w-4 h-4' />
                ) : (
                  <SortDesc className='w-4 h-4' />
                )}
              </Button>
            </div>

            {/* View mode toggles */}
            <div className='flex items-center border rounded-lg p-1'>
              <Button
                variant={viewMode === VIEW_MODE.GRID ? 'default' : 'ghost'}
                size='sm'
                onClick={() => handleViewModeChange(VIEW_MODE.GRID)}
                className='p-2'
              >
                <Grid3X3 className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === VIEW_MODE.CARD ? 'default' : 'ghost'}
                size='sm'
                onClick={() => handleViewModeChange(VIEW_MODE.CARD)}
                className='p-2'
              >
                <LayoutGrid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === VIEW_MODE.LIST ? 'default' : 'ghost'}
                size='sm'
                onClick={() => handleViewModeChange(VIEW_MODE.LIST)}
                className='p-2'
              >
                <List className='w-4 h-4' />
              </Button>
            </div>

            {/* Panel mode toggle */}
            <div className='flex items-center border rounded-lg p-1 ml-2'>
              <Button
                variant={panelMode === 'single' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setPanelMode('single')}
                className='p-2 text-xs'
                title='Single Panel View'
              >
                Single
              </Button>
              <Button
                variant={panelMode === 'dual' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setPanelMode('dual')}
                className='p-2 text-xs'
                title='Dual Panel View'
              >
                Dual
              </Button>
            </div>

            {/* Clear filters */}
            {filters.hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='text-red-600 hover:text-red-700'
              >
                <Filter className='w-4 h-4 mr-2' />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* No results state */}
        {totalItems === 0 && filters.hasActiveFilters && (
          <div className='flex items-center justify-center p-8 text-gray-500'>
            <div className='text-center'>
              <Search className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p className='text-lg font-medium'>No files found</p>
              <p className='text-sm mt-1'>
                Try adjusting your search or filters
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={clearFilters}
                className='mt-4'
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Main Content - Conditional rendering based on panel mode */}
        {totalItems > 0 && (
          <>
            {/* Dual Panel View */}
            {panelMode === 'dual' ? (
              <div className='flex-1'>
                <TwoPanelFilesView />
              </div>
            ) : /* Single Panel View - Traditional Files Grid */
            totalItems > 0 ? (
              <motion.div
                variants={containerVariants}
                initial='hidden'
                animate='visible'
                className={cn('flex-1 overflow-auto', gridClasses)}
              >
                {/* Folders first */}
                <AnimatePresence mode='popLayout'>
                  {folders.map((folder, index) => (
                    <FolderCard
                      key={folder.id}
                      folderId={folder.id}
                      view={viewMode}
                      index={index}
                    />
                  ))}
                </AnimatePresence>

                {/* Then files */}
                <AnimatePresence mode='popLayout'>
                  {files.map((file, index) => (
                    <FileCard
                      key={file.id}
                      fileId={file.id}
                      view={viewMode}
                      index={folders.length + index}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Empty state for single panel */
              <EmptyFilesState />
            )}
          </>
        )}
      </div>
    </FadeTransitionWrapper>
  );
});

FilesContainer.displayName = 'FilesContainer';

export { FilesContainer };
