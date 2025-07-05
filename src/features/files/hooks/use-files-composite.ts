// Files Composite Hooks - Eliminate Prop Drilling
// Zustand composite hooks for files feature
// Following 2025 TypeScript best practices and links feature patterns

import { useCallback, useMemo } from 'react';
import type { FileId, FolderId, WorkspaceId } from '../types';
import {
  useFilesDataStore,
  useFilesUIStore,
  useFilesModalStore,
  useFilesWorkspaceStore,
} from '../store';

// =============================================================================
// INDIVIDUAL FILE CARD HOOKS
// =============================================================================

/**
 * Hook for individual file card state - eliminates prop drilling
 * @param fileId - The file ID
 * @returns File data and actions for a single file card
 */
export const useFileCardStore = (fileId: FileId) => {
  // File data
  const file = useFilesDataStore(
    useCallback(state => state.files.find(f => f.id === fileId), [fileId])
  );

  // UI state
  const isSelected = useFilesUIStore(
    useCallback(state => state.selectedFileIds.includes(fileId), [fileId])
  );

  const isMultiSelectMode = useFilesUIStore(
    useCallback(state => state.isMultiSelectMode, [])
  );

  // Actions
  const selectFile = useFilesUIStore(
    useCallback(state => state.selectFile, [])
  );

  const updateFile = useFilesDataStore(
    useCallback(state => state.updateFile, [])
  );

  const removeFile = useFilesDataStore(
    useCallback(state => state.removeFile, [])
  );

  const openModal = useFilesModalStore(
    useCallback(state => state.openModal, [])
  );

  // Computed properties
  const computed = useMemo(
    () => ({
      canDelete: file?.permissions?.canDelete ?? false,
      canEdit: file?.permissions?.canEdit ?? false,
      canShare: file?.permissions?.canShare ?? false,
      canMove: file?.permissions?.canMove ?? false,
      isLoading: false,
    }),
    [file]
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onSelect: (multiSelect?: boolean) => selectFile(fileId, multiSelect),
      onUpdate: (updates: Parameters<typeof updateFile>[1]) =>
        updateFile(fileId, updates),
      onDelete: () => removeFile(fileId),
      onViewDetails: () => openModal('fileDetails', { fileData: file }),
      onShare: () => openModal('share', { fileData: file }),
      onMove: () => openModal('move', { selectedFileIds: [fileId] }),
      onRename: () => openModal('rename', { fileData: file }),
      onPreview: () => openModal('preview', { fileData: file }),
    }),
    [fileId, file, selectFile, updateFile, removeFile, openModal]
  );

  return useMemo(
    () => ({
      file,
      isSelected,
      isMultiSelectMode,
      computed,
      actions,
    }),
    [file, isSelected, isMultiSelectMode, computed, actions]
  );
};

// =============================================================================
// FOLDER CARD HOOKS
// =============================================================================

/**
 * Hook for individual folder card state - eliminates prop drilling
 * @param folderId - The folder ID
 * @returns Folder data and actions for a single folder card
 */
export const useFolderCardStore = (folderId: FolderId) => {
  // Folder data
  const folder = useFilesDataStore(
    useCallback(state => state.folders.find(f => f.id === folderId), [folderId])
  );

  // UI state
  const isSelected = useFilesUIStore(
    useCallback(state => state.selectedFolderIds.includes(folderId), [folderId])
  );

  const isExpanded = useFilesUIStore(
    useCallback(state => state.expandedFolderIds.includes(folderId), [folderId])
  );

  const isMultiSelectMode = useFilesUIStore(
    useCallback(state => state.isMultiSelectMode, [])
  );

  // Actions
  const selectFolder = useFilesUIStore(
    useCallback(state => state.selectFolder, [])
  );

  const updateFolder = useFilesDataStore(
    useCallback(state => state.updateFolder, [])
  );

  const removeFolder = useFilesDataStore(
    useCallback(state => state.removeFolder, [])
  );

  const expandFolder = useFilesUIStore(
    useCallback(state => state.expandFolder, [])
  );

  const collapseFolder = useFilesUIStore(
    useCallback(state => state.collapseFolder, [])
  );

  const openModal = useFilesModalStore(
    useCallback(state => state.openModal, [])
  );

  // Navigation
  const navigateToFolder = useFilesUIStore(
    useCallback(state => state.navigateToFolder, [])
  );

  // Computed properties
  const computed = useMemo(
    () => ({
      canDelete: folder?.permissions?.canDelete ?? false,
      canEdit: folder?.permissions?.canEdit ?? false,
      canShare: folder?.permissions?.canShare ?? false,
      canMove: folder?.permissions?.canMove ?? false,
      fileCount: folder?.fileCount ?? 0,
      totalSize: folder?.totalSize ?? 0,
      isLoading: false,
    }),
    [folder]
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onSelect: (multiSelect?: boolean) => selectFolder(folderId, multiSelect),
      onUpdate: (updates: Parameters<typeof updateFolder>[1]) =>
        updateFolder(folderId, updates),
      onDelete: () => removeFolder(folderId),
      onOpen: () => {
        const breadcrumbs = [
          { name: 'Home', path: '/', folderId: null, isLast: false },
          {
            name: folder?.name ?? 'Folder',
            path: `/${folder?.name ?? ''}`,
            folderId,
            isLast: true,
          },
        ];
        navigateToFolder(folderId, breadcrumbs);
      },
      onExpand: () => expandFolder(folderId),
      onCollapse: () => collapseFolder(folderId),
      onToggleExpansion: () =>
        isExpanded ? collapseFolder(folderId) : expandFolder(folderId),
      onViewDetails: () => openModal('folderDetails', { folderData: folder }),
      onShare: () => openModal('share', { folderData: folder }),
      onMove: () => openModal('move', { selectedFolderIds: [folderId] }),
      onRename: () => openModal('rename', { folderData: folder }),
    }),
    [
      folderId,
      folder,
      isExpanded,
      selectFolder,
      updateFolder,
      removeFolder,
      expandFolder,
      collapseFolder,
      navigateToFolder,
      openModal,
    ]
  );

  return useMemo(
    () => ({
      folder,
      isSelected,
      isExpanded,
      isMultiSelectMode,
      computed,
      actions,
    }),
    [folder, isSelected, isExpanded, isMultiSelectMode, computed, actions]
  );
};

// =============================================================================
// FILES LIST HOOKS
// =============================================================================

/**
 * Hook for files list state - eliminates prop drilling
 * @returns Files list data and actions
 */
export const useFilesListStore = () => {
  // Files data
  const files = useFilesDataStore(useCallback(state => state.files, []));

  const folders = useFilesDataStore(useCallback(state => state.folders, []));

  const isLoading = useFilesDataStore(
    useCallback(state => state.isLoading, [])
  );

  const error = useFilesDataStore(useCallback(state => state.error, []));

  // UI state
  const viewMode = useFilesUIStore(useCallback(state => state.viewMode, []));

  const sortBy = useFilesUIStore(useCallback(state => state.sortBy, []));

  const sortOrder = useFilesUIStore(useCallback(state => state.sortOrder, []));

  const selectedFileIds = useFilesUIStore(
    useCallback(state => state.selectedFileIds, [])
  );

  const selectedFolderIds = useFilesUIStore(
    useCallback(state => state.selectedFolderIds, [])
  );

  const searchQuery = useFilesUIStore(
    useCallback(state => state.searchQuery, [])
  );

  const activeFilters = useFilesUIStore(
    useCallback(state => state.activeFilters, [])
  );

  // Actions
  const setViewMode = useFilesUIStore(
    useCallback(state => state.setViewMode, [])
  );

  const setSortBy = useFilesUIStore(useCallback(state => state.setSortBy, []));

  const setSortOrder = useFilesUIStore(
    useCallback(state => state.setSortOrder, [])
  );

  const setSearchQuery = useFilesUIStore(
    useCallback(state => state.setSearchQuery, [])
  );

  const setActiveFilters = useFilesUIStore(
    useCallback(state => state.setActiveFilters, [])
  );

  const clearFilters = useFilesUIStore(
    useCallback(state => state.clearFilters, [])
  );

  const selectAll = useFilesUIStore(useCallback(state => state.selectAll, []));

  const deselectAll = useFilesUIStore(
    useCallback(state => state.deselectAll, [])
  );

  const openModal = useFilesModalStore(
    useCallback(state => state.openModal, [])
  );

  // Computed properties
  const computed = useMemo(
    () => ({
      totalFiles: files.length,
      totalFolders: folders.length,
      selectedCount: selectedFileIds.length + selectedFolderIds.length,
      hasSelection: selectedFileIds.length > 0 || selectedFolderIds.length > 0,
      hasFiles: files.length > 0,
      hasFolders: folders.length > 0,
      isEmpty: files.length === 0 && folders.length === 0,
      isFiltered:
        searchQuery.length > 0 ||
        Object.values(activeFilters).some(v => v !== undefined && v !== ''),
    }),
    [
      files,
      folders,
      selectedFileIds,
      selectedFolderIds,
      searchQuery,
      activeFilters,
    ]
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onViewModeChange: setViewMode,
      onSortByChange: setSortBy,
      onSortOrderChange: setSortOrder,
      onSearchQueryChange: setSearchQuery,
      onFiltersChange: setActiveFilters,
      onClearFilters: clearFilters,
      onSelectAll: () =>
        selectAll(
          files.map(f => f.id),
          folders.map(f => f.id)
        ),
      onDeselectAll: deselectAll,
      onUpload: () => openModal('upload'),
      onCreateFolder: () => openModal('createFolder'),
      onBulkActions: () => openModal('bulkActions'),
      onOrganize: () => openModal('organize'),
    }),
    [
      setViewMode,
      setSortBy,
      setSortOrder,
      setSearchQuery,
      setActiveFilters,
      clearFilters,
      selectAll,
      deselectAll,
      openModal,
      files,
      folders,
    ]
  );

  return useMemo(
    () => ({
      files,
      folders,
      isLoading,
      error,
      viewMode,
      sortBy,
      sortOrder,
      selectedFileIds,
      selectedFolderIds,
      searchQuery,
      activeFilters,
      computed,
      actions,
    }),
    [
      files,
      folders,
      isLoading,
      error,
      viewMode,
      sortBy,
      sortOrder,
      selectedFileIds,
      selectedFolderIds,
      searchQuery,
      activeFilters,
      computed,
      actions,
    ]
  );
};

// =============================================================================
// FILES MODALS HOOKS
// =============================================================================

/**
 * Hook for files modals state - eliminates prop drilling
 * @returns Modal state and actions
 */
export const useFilesModalsStore = () => {
  // Modal state
  const activeModal = useFilesModalStore(
    useCallback(state => state.activeModal, [])
  );

  const modalData = useFilesModalStore(
    useCallback(state => state.modalData, [])
  );

  const isModalOpen = useFilesModalStore(
    useCallback(state => state.isModalOpen, [])
  );

  const isSubmitting = useFilesModalStore(
    useCallback(state => state.isSubmitting, [])
  );

  const submitError = useFilesModalStore(
    useCallback(state => state.submitError, [])
  );

  const validationErrors = useFilesModalStore(
    useCallback(state => state.validationErrors, [])
  );

  // Actions
  const openModal = useFilesModalStore(
    useCallback(state => state.openModal, [])
  );

  const closeModal = useFilesModalStore(
    useCallback(state => state.closeModal, [])
  );

  const updateModalData = useFilesModalStore(
    useCallback(state => state.updateModalData, [])
  );

  const setSubmitting = useFilesModalStore(
    useCallback(state => state.setSubmitting, [])
  );

  const setSubmitError = useFilesModalStore(
    useCallback(state => state.setSubmitError, [])
  );

  const setValidationErrors = useFilesModalStore(
    useCallback(state => state.setValidationErrors, [])
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onOpen: openModal,
      onClose: closeModal,
      onUpdateData: updateModalData,
      onSetSubmitting: setSubmitting,
      onSetSubmitError: setSubmitError,
      onSetValidationErrors: setValidationErrors,
    }),
    [
      openModal,
      closeModal,
      updateModalData,
      setSubmitting,
      setSubmitError,
      setValidationErrors,
    ]
  );

  return useMemo(
    () => ({
      activeModal,
      modalData,
      isModalOpen,
      isSubmitting,
      submitError,
      validationErrors,
      actions,
    }),
    [
      activeModal,
      modalData,
      isModalOpen,
      isSubmitting,
      submitError,
      validationErrors,
      actions,
    ]
  );
};

// =============================================================================
// FILES WORKSPACE HOOKS
// =============================================================================

/**
 * Hook for files workspace state - eliminates prop drilling
 * @returns Workspace state and actions
 */
export const useFilesWorkspaceComposite = () => {
  // Workspace data
  const currentWorkspace = useFilesWorkspaceStore(
    useCallback(state => state.currentWorkspace, [])
  );

  const workspaceSettings = useFilesWorkspaceStore(
    useCallback(state => state.workspaceSettings, [])
  );

  const fileTree = useFilesWorkspaceStore(
    useCallback(state => state.fileTree, [])
  );

  const treeStats = useFilesWorkspaceStore(
    useCallback(state => state.treeStats, [])
  );

  const isTreeLoading = useFilesWorkspaceStore(
    useCallback(state => state.isTreeLoading, [])
  );

  const navigationState = useFilesWorkspaceStore(
    useCallback(state => state.navigationState, [])
  );

  // Actions
  const updateWorkspaceSettings = useFilesWorkspaceStore(
    useCallback(state => state.updateWorkspaceSettings, [])
  );

  const buildFileTree = useFilesWorkspaceStore(
    useCallback(state => state.buildFileTree, [])
  );

  const navigateToPath = useFilesWorkspaceStore(
    useCallback(state => state.navigateToPath, [])
  );

  const expandTreeNode = useFilesWorkspaceStore(
    useCallback(state => state.expandTreeNode, [])
  );

  const collapseTreeNode = useFilesWorkspaceStore(
    useCallback(state => state.collapseTreeNode, [])
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onUpdateSettings: updateWorkspaceSettings,
      onBuildTree: buildFileTree,
      onNavigateToPath: navigateToPath,
      onExpandNode: expandTreeNode,
      onCollapseNode: collapseTreeNode,
    }),
    [
      updateWorkspaceSettings,
      buildFileTree,
      navigateToPath,
      expandTreeNode,
      collapseTreeNode,
    ]
  );

  return useMemo(
    () => ({
      currentWorkspace,
      workspaceSettings,
      fileTree,
      treeStats,
      isTreeLoading,
      navigationState,
      actions,
    }),
    [
      currentWorkspace,
      workspaceSettings,
      fileTree,
      treeStats,
      isTreeLoading,
      navigationState,
      actions,
    ]
  );
};

// =============================================================================
// DRAG & DROP HOOKS
// =============================================================================

/**
 * Hook for drag & drop state - eliminates prop drilling
 * @returns Drag & drop state and actions
 */
export const useFilesDragDropStore = () => {
  // Drag & drop state
  const draggedItems = useFilesUIStore(
    useCallback(state => state.draggedItems, [])
  );

  const isDragging = useFilesUIStore(
    useCallback(state => state.isDragging, [])
  );

  const dragOverFolderId = useFilesUIStore(
    useCallback(state => state.dragOverFolderId, [])
  );

  // Actions
  const startDrag = useFilesUIStore(useCallback(state => state.startDrag, []));

  const endDrag = useFilesUIStore(useCallback(state => state.endDrag, []));

  const setDragOverFolder = useFilesUIStore(
    useCallback(state => state.setDragOverFolder, [])
  );

  const moveFilesToFolder = useFilesDataStore(
    useCallback(state => state.moveFilesToFolder, [])
  );

  // Actions object
  const actions = useMemo(
    () => ({
      onStartDrag: startDrag,
      onEndDrag: endDrag,
      onDragOverFolder: setDragOverFolder,
      onDropToFolder: moveFilesToFolder,
    }),
    [startDrag, endDrag, setDragOverFolder, moveFilesToFolder]
  );

  return useMemo(
    () => ({
      draggedItems,
      isDragging,
      dragOverFolderId,
      actions,
    }),
    [draggedItems, isDragging, dragOverFolderId, actions]
  );
};
