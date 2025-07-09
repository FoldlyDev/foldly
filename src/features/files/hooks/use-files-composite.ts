/**
 * Composite hooks that combine multiple stores
 * Eliminates prop drilling by providing clean, focused interfaces
 * Following 2025 React + Zustand best practices
 */

import { useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useFilesDataStore,
  useFilesUIStore,
  useFilesModalStore,
  useFilesWorkspaceStore,
} from '../store';
import type { FileData, FolderData } from '../types/database';
import type { FileId, FolderId } from '@/types';
import { FILE_STATUS } from '../store/files-data-store';
import { VIEW_MODE, SORT_BY, SORT_ORDER } from '../store/files-ui-store';
import { MODAL_TYPE } from '../store/files-modal-store';

/**
 * Combined hook for file card components
 * Replaces prop drilling with store-based approach
 */
export const useFileCardStore = (fileId: FileId) => {
  // Data subscriptions with stable selectors
  const file = useFilesDataStore(
    useCallback(
      state => state.files.find((f: FileData) => f.id === fileId),
      [fileId]
    )
  );
  const isLoading = useFilesDataStore(state => state.isLoading);
  const operationStatus = useFilesDataStore(state => state.operationStatus);

  // UI subscriptions with stable selectors
  const isSelected = useFilesUIStore(
    useCallback(state => state.selectedFileIds.includes(fileId), [fileId])
  );
  const isMultiSelectMode = useFilesUIStore(state => state.isMultiSelectMode);
  const isDragging = useFilesUIStore(state => state.isDragging);
  const draggedItemIds = useFilesUIStore(state => state.draggedItemIds);
  const focusedItemId = useFilesUIStore(state => state.focusedItemId);

  // Stable action references
  const updateFile = useFilesDataStore(state => state.updateFile);
  const deleteFile = useFilesDataStore(state => state.deleteFile);
  const toggleFileSelection = useFilesUIStore(
    state => state.toggleFileSelection
  );
  const setFocusedItem = useFilesUIStore(state => state.setFocusedItem);
  const startDrag = useFilesUIStore(state => state.startDrag);
  const endDrag = useFilesUIStore(state => state.endDrag);

  // Modal actions
  const openModal = useFilesModalStore(state => state.openModal);

  // Memoized computed values with stable dependencies
  const computed = useMemo(() => {
    if (!file) return null;

    const isBeingDragged = draggedItemIds.includes(fileId);
    const isFocused = focusedItemId === fileId;

    return {
      isBeingDragged,
      isFocused,
      isProcessing: file.status === FILE_STATUS.PROCESSING,
      isError: file.status === FILE_STATUS.ERROR,
      isActive: file.status === FILE_STATUS.ACTIVE,

      // Formatted values
      formattedSize: formatFileSize(file.size),
      formattedDate: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(file.createdAt)),
      fileExtension: file.name.split('.').pop()?.toLowerCase() || '',

      // Action handlers
      handleSelect: () => toggleFileSelection(fileId),
      handleFocus: () => setFocusedItem(fileId),
      handleViewDetails: () =>
        openModal(MODAL_TYPE.FILE_DETAILS, { fileData: file }),
      handleShare: () => openModal(MODAL_TYPE.SHARE, { fileData: file }),
      handleDelete: () => openModal(MODAL_TYPE.DELETE, { fileData: file }),
      handlePreview: () => openModal(MODAL_TYPE.PREVIEW, { fileData: file }),
      handleDownload: () => downloadFile(file),
      handleRename: () => openModal(MODAL_TYPE.RENAME, { fileData: file }),
      handleMove: () =>
        openModal(MODAL_TYPE.MOVE, { selectedFileIds: [fileId] }),
      handleCopy: () =>
        openModal(MODAL_TYPE.COPY, { selectedFileIds: [fileId] }),

      // Drag and drop
      handleDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', fileId);
        startDrag([fileId]);
      },
      handleDragEnd: () => endDrag(),
    };
  }, [
    file,
    fileId,
    draggedItemIds,
    focusedItemId,
    toggleFileSelection,
    setFocusedItem,
    openModal,
    startDrag,
    endDrag,
  ]);

  return useMemo(
    () => ({
      file,
      isLoading,
      operationStatus,
      isSelected,
      isMultiSelectMode,
      isDragging,
      computed,
      // Direct actions
      updateFile,
      deleteFile,
    }),
    [
      file,
      isLoading,
      operationStatus,
      isSelected,
      isMultiSelectMode,
      isDragging,
      computed,
      updateFile,
      deleteFile,
    ]
  );
};

/**
 * Combined hook for folder card components
 * Replaces prop drilling with store-based approach
 */
export const useFolderCardStore = (folderId: FolderId) => {
  // Data subscriptions with stable selectors
  const folder = useFilesDataStore(
    useCallback(
      state => state.folders.find((f: FolderData) => f.id === folderId),
      [folderId]
    )
  );
  const isLoading = useFilesDataStore(state => state.isLoading);

  // Get folder stats
  const folderStats = useFilesDataStore(
    useCallback(
      state => {
        const files = state.files.filter(f => f.folderId === folderId);
        const subfolders = state.folders.filter(f => f.parentId === folderId);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        return {
          fileCount: files.length,
          subfolderCount: subfolders.length,
          totalSize,
          isEmpty: files.length === 0 && subfolders.length === 0,
        };
      },
      [folderId]
    )
  );

  // UI subscriptions with stable selectors
  const isSelected = useFilesUIStore(
    useCallback(state => state.selectedFolderIds.includes(folderId), [folderId])
  );
  const isExpanded = useFilesUIStore(
    useCallback(state => state.expandedFolderIds.includes(folderId), [folderId])
  );
  const isMultiSelectMode = useFilesUIStore(state => state.isMultiSelectMode);
  const currentFolderId = useFilesUIStore(state => state.currentFolderId);
  const dragOverFolderId = useFilesUIStore(state => state.dragOverFolderId);

  // Workspace subscriptions
  const isFavorite = useFilesWorkspaceStore(
    useCallback(state => state.favoriteFolders.includes(folderId), [folderId])
  );
  const isPinned = useFilesWorkspaceStore(
    useCallback(state => state.pinnedFolders.includes(folderId), [folderId])
  );

  // Stable action references
  const updateFolder = useFilesDataStore(state => state.updateFolder);
  const deleteFolder = useFilesDataStore(state => state.deleteFolder);
  const toggleFolderSelection = useFilesUIStore(
    state => state.toggleFolderSelection
  );
  const toggleFolderExpansion = useFilesUIStore(
    state => state.toggleFolderExpansion
  );
  const navigateToFolder = useFilesUIStore(state => state.navigateToFolder);
  const setDragOver = useFilesUIStore(state => state.setDragOver);
  const toggleFavoriteFolder = useFilesWorkspaceStore(
    state => state.toggleFavoriteFolder
  );
  const togglePinnedFolder = useFilesWorkspaceStore(
    state => state.togglePinnedFolder
  );

  // Modal actions
  const openModal = useFilesModalStore(state => state.openModal);

  // Memoized computed values
  const computed = useMemo(() => {
    if (!folder) return null;

    const isCurrentFolder = currentFolderId === folderId;
    const isDraggedOver = dragOverFolderId === folderId;

    return {
      isCurrentFolder,
      isDraggedOver,
      isFavorite,
      isPinned,
      folderStats,

      // Formatted values
      formattedSize: formatFileSize(folderStats.totalSize),
      formattedDate: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(folder.createdAt)),

      // Action handlers
      handleSelect: () => toggleFolderSelection(folderId),
      handleExpand: () => toggleFolderExpansion(folderId),
      handleNavigate: () => navigateToFolder(folderId),
      handleViewDetails: () =>
        openModal(MODAL_TYPE.FOLDER_DETAILS, { folderData: folder }),
      handleShare: () => openModal(MODAL_TYPE.SHARE, { folderData: folder }),
      handleDelete: () => openModal(MODAL_TYPE.DELETE, { folderData: folder }),
      handleRename: () => openModal(MODAL_TYPE.RENAME, { folderData: folder }),
      handleMove: () =>
        openModal(MODAL_TYPE.MOVE, { selectedFolderIds: [folderId] }),
      handleCopy: () =>
        openModal(MODAL_TYPE.COPY, { selectedFolderIds: [folderId] }),
      handleToggleFavorite: () => toggleFavoriteFolder(folderId),
      handleTogglePin: () => togglePinnedFolder(folderId),

      // Drag and drop
      handleDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(folderId);
      },
      handleDragLeave: () => setDragOver(null),
      handleDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(null);
        // Handle drop logic here
      },
    };
  }, [
    folder,
    folderId,
    currentFolderId,
    dragOverFolderId,
    isFavorite,
    isPinned,
    folderStats,
    toggleFolderSelection,
    toggleFolderExpansion,
    navigateToFolder,
    openModal,
    setDragOver,
    toggleFavoriteFolder,
    togglePinnedFolder,
  ]);

  return useMemo(
    () => ({
      folder,
      isLoading,
      isSelected,
      isExpanded,
      isMultiSelectMode,
      computed,
      // Direct actions
      updateFolder,
      deleteFolder,
    }),
    [
      folder,
      isLoading,
      isSelected,
      isExpanded,
      isMultiSelectMode,
      computed,
      updateFolder,
      deleteFolder,
    ]
  );
};

/**
 * Hook for files container/list components
 * Provides all necessary state and actions for managing the files list
 */
export const useFilesListStore = () => {
  // Data subscriptions with stable selectors
  const files = useFilesDataStore(state => state.files);
  const folders = useFilesDataStore(state => state.folders);
  const isLoading = useFilesDataStore(state => state.isLoading);
  const error = useFilesDataStore(state => state.error);
  const workspaceData = useFilesDataStore(state => state.workspaceData);

  // UI subscriptions with atomic selectors
  const viewMode = useFilesUIStore(state => state.viewMode);
  const searchQuery = useFilesUIStore(state => state.searchQuery);
  const sortBy = useFilesUIStore(state => state.sortBy);
  const sortOrder = useFilesUIStore(state => state.sortOrder);
  const filterStatus = useFilesUIStore(state => state.filterStatus);
  const filterType = useFilesUIStore(state => state.filterType);
  const currentFolderId = useFilesUIStore(state => state.currentFolderId);
  const selectedFileIds = useFilesUIStore(state => state.selectedFileIds);
  const selectedFolderIds = useFilesUIStore(state => state.selectedFolderIds);
  const isMultiSelectMode = useFilesUIStore(state => state.isMultiSelectMode);
  const currentPage = useFilesUIStore(state => state.currentPage);
  const itemsPerPage = useFilesUIStore(state => state.itemsPerPage);

  // Memoized complex objects
  const stats = useMemo(() => {
    const totalFiles = files.length;
    const totalFolders = folders.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const activeFiles = files.filter(
      f => f.status === FILE_STATUS.ACTIVE
    ).length;

    return {
      totalFiles,
      totalFolders,
      totalSize,
      activeFiles,
      totalItems: totalFiles + totalFolders,
    };
  }, [files, folders]);

  const sorting = useMemo(() => ({ sortBy, sortOrder }), [sortBy, sortOrder]);

  const filters = useMemo(
    () => ({
      status: filterStatus,
      type: filterType,
      hasActiveFilters:
        searchQuery !== '' || filterStatus !== 'all' || filterType !== 'all',
    }),
    [filterStatus, filterType, searchQuery]
  );

  const selection = useMemo(
    () => ({
      selectedFileIds,
      selectedFolderIds,
      isMultiSelectMode,
      selectedFileCount: selectedFileIds.length,
      selectedFolderCount: selectedFolderIds.length,
      totalSelected: selectedFileIds.length + selectedFolderIds.length,
      hasSelection: selectedFileIds.length > 0 || selectedFolderIds.length > 0,
    }),
    [selectedFileIds, selectedFolderIds, isMultiSelectMode]
  );

  const pagination = useMemo(
    () => ({ currentPage, itemsPerPage }),
    [currentPage, itemsPerPage]
  );

  // Stable action references
  const fetchWorkspaceData = useFilesDataStore(
    state => state.fetchWorkspaceData
  );
  const uploadFile = useFilesDataStore(state => state.uploadFile);
  const createFolder = useFilesDataStore(state => state.createFolder);
  const setViewMode = useFilesUIStore(state => state.setViewMode);
  const setSorting = useFilesUIStore(state => state.setSorting);
  const setSearchQuery = useFilesUIStore(state => state.setSearchQuery);
  const setFilterStatus = useFilesUIStore(state => state.setFilterStatus);
  const setFilterType = useFilesUIStore(state => state.setFilterType);
  const clearFilters = useFilesUIStore(state => state.clearFilters);
  const navigateToFolder = useFilesUIStore(state => state.navigateToFolder);
  const selectAllFiles = useFilesUIStore(state => state.selectAllFiles);
  const selectAllFolders = useFilesUIStore(state => state.selectAllFolders);
  const clearSelection = useFilesUIStore(state => state.clearSelection);
  const toggleMultiSelectMode = useFilesUIStore(
    state => state.toggleMultiSelectMode
  );
  const setCurrentPage = useFilesUIStore(state => state.setCurrentPage);

  // Modal actions
  const openModal = useFilesModalStore(state => state.openModal);

  // Process files and folders (filtering, sorting, pagination)
  const processedItems = useMemo(() => {
    // Filter by current folder
    const currentFiles = files.filter(f => f.folderId === currentFolderId);
    const currentFolders = folders.filter(f => f.parentId === currentFolderId);

    let filteredFiles = [...currentFiles];
    let filteredFolders = [...currentFolders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(
        file =>
          file.name.toLowerCase().includes(query) ||
          file.type.toLowerCase().includes(query)
      );
      filteredFolders = filteredFolders.filter(
        folder =>
          folder.name.toLowerCase().includes(query) ||
          folder.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filteredFiles = filteredFiles.filter(
        file => file.status === filters.status
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      if (filters.type === 'files') {
        filteredFolders = [];
      } else if (filters.type === 'folders') {
        filteredFiles = [];
      } else {
        // Filter by file type
        filteredFiles = filteredFiles.filter(file => {
          const fileType = file.type.toLowerCase();
          switch (filters.type) {
            case 'images':
              return fileType.startsWith('image/');
            case 'documents':
              return ['pdf', 'doc', 'docx', 'txt', 'rtf'].some(ext =>
                fileType.includes(ext)
              );
            case 'videos':
              return fileType.startsWith('video/');
            case 'audio':
              return fileType.startsWith('audio/');
            case 'archives':
              return ['zip', 'rar', '7z', 'tar', 'gz'].some(ext =>
                fileType.includes(ext)
              );
            default:
              return true;
          }
        });
      }
    }

    // Apply sorting
    const sortFiles = (items: FileData[]) => {
      return [...items].sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sorting.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'type':
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime();
            bValue = new Date(b.updatedAt).getTime();
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sorting.sortOrder === 'asc' ? comparison : -comparison;
      });
    };

    const sortFolders = (items: FolderData[]) => {
      return [...items].sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sorting.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime();
            bValue = new Date(b.updatedAt).getTime();
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sorting.sortOrder === 'asc' ? comparison : -comparison;
      });
    };

    return {
      files: sortFiles(filteredFiles),
      folders: sortFolders(filteredFolders),
      totalItems: filteredFiles.length + filteredFolders.length,
    };
  }, [files, folders, currentFolderId, searchQuery, filters, sorting]);

  // Return memoized object
  return useMemo(
    () => ({
      // Data
      files: processedItems.files,
      folders: processedItems.folders,
      totalItems: processedItems.totalItems,
      workspaceData,
      isLoading,
      error,
      stats,

      // UI State
      viewMode,
      sorting,
      searchQuery,
      filters,
      selection,
      pagination,
      currentFolderId,

      // Actions
      fetchWorkspaceData,
      uploadFile,
      createFolder,
      setViewMode,
      setSorting,
      setSearchQuery,
      setFilterStatus,
      setFilterType,
      clearFilters,
      navigateToFolder,
      selectAllFiles,
      selectAllFolders,
      clearSelection,
      toggleMultiSelectMode,
      setCurrentPage,

      // Modal actions
      openUploadModal: () => openModal(MODAL_TYPE.UPLOAD),
      openCreateFolderModal: () => openModal(MODAL_TYPE.CREATE_FOLDER),
      openBulkActionsModal: () => openModal(MODAL_TYPE.BULK_ACTIONS),
      openOrganizeModal: () => openModal(MODAL_TYPE.ORGANIZE),
    }),
    [
      processedItems,
      workspaceData,
      isLoading,
      error,
      stats,
      viewMode,
      sorting,
      searchQuery,
      filters,
      selection,
      pagination,
      currentFolderId,
      fetchWorkspaceData,
      uploadFile,
      createFolder,
      setViewMode,
      setSorting,
      setSearchQuery,
      setFilterStatus,
      setFilterType,
      clearFilters,
      navigateToFolder,
      selectAllFiles,
      selectAllFolders,
      clearSelection,
      toggleMultiSelectMode,
      setCurrentPage,
      openModal,
    ]
  );
};

/**
 * Hook for modal management
 * Centralized modal state and actions
 */
export const useFilesModalsStore = () => {
  const activeModal = useFilesModalStore(state => state.activeModal);
  const modalData = useFilesModalStore(state => state.modalData);
  const isModalOpen = useFilesModalStore(state => state.isModalOpen);
  const isSubmitting = useFilesModalStore(state => state.isSubmitting);
  const submitError = useFilesModalStore(state => state.submitError);
  const validationErrors = useFilesModalStore(state => state.validationErrors);

  // Stable action references
  const openModal = useFilesModalStore(state => state.openModal);
  const closeModal = useFilesModalStore(state => state.closeModal);
  const setSubmitting = useFilesModalStore(state => state.setSubmitting);
  const setSubmitError = useFilesModalStore(state => state.setSubmitError);
  const setValidationErrors = useFilesModalStore(
    state => state.setValidationErrors
  );
  const clearValidationErrors = useFilesModalStore(
    state => state.clearValidationErrors
  );
  const updateModalData = useFilesModalStore(state => state.updateModalData);

  // Return memoized object
  return useMemo(
    () => ({
      activeModal,
      modalData,
      isModalOpen,
      isSubmitting,
      submitError,
      validationErrors,
      hasValidationErrors: Object.keys(validationErrors).length > 0,
      openModal,
      closeModal,
      setSubmitting,
      setSubmitError,
      setValidationErrors,
      clearValidationErrors,
      updateModalData,
    }),
    [
      activeModal,
      modalData,
      isModalOpen,
      isSubmitting,
      submitError,
      validationErrors,
      openModal,
      closeModal,
      setSubmitting,
      setSubmitError,
      setValidationErrors,
      clearValidationErrors,
      updateModalData,
    ]
  );
};

/**
 * Hook for upload functionality
 * Handles upload state and progress
 */
export const useFilesUploadStore = () => {
  const uploadFormData = useFilesModalStore(state => state.uploadFormData);
  const uploadProgress = useFilesModalStore(state => state.uploadProgress);
  const uploadStatus = useFilesModalStore(state => state.uploadStatus);
  const uploadErrors = useFilesModalStore(state => state.uploadErrors);

  // Stable action references
  const updateUploadFormData = useFilesModalStore(
    state => state.updateUploadFormData
  );
  const setUploadProgress = useFilesModalStore(
    state => state.setUploadProgress
  );
  const setUploadStatus = useFilesModalStore(state => state.setUploadStatus);
  const setUploadError = useFilesModalStore(state => state.setUploadError);
  const clearUploadData = useFilesModalStore(state => state.clearUploadData);

  // Computed upload state
  const uploadState = useMemo(() => {
    const progressValues = Object.values(uploadProgress);
    const statuses = Object.values(uploadStatus);
    const errors = Object.values(uploadErrors);

    return {
      totalProgress:
        progressValues.length > 0
          ? Math.round(
              progressValues.reduce((sum, p) => sum + p, 0) /
                progressValues.length
            )
          : 0,
      isUploading: statuses.some(s => s === 'uploading'),
      isCompleted:
        statuses.length > 0 &&
        statuses.every(s => s === 'completed' || s === 'failed'),
      hasErrors: errors.length > 0,
      totalFiles: statuses.length,
      completedFiles: statuses.filter(s => s === 'completed').length,
      failedFiles: statuses.filter(s => s === 'failed').length,
      pendingFiles: statuses.filter(s => s === 'pending').length,
      uploadingFiles: statuses.filter(s => s === 'uploading').length,
    };
  }, [uploadProgress, uploadStatus, uploadErrors]);

  return useMemo(
    () => ({
      uploadFormData,
      uploadProgress,
      uploadStatus,
      uploadErrors,
      uploadState,
      updateUploadFormData,
      setUploadProgress,
      setUploadStatus,
      setUploadError,
      clearUploadData,
    }),
    [
      uploadFormData,
      uploadProgress,
      uploadStatus,
      uploadErrors,
      uploadState,
      updateUploadFormData,
      setUploadProgress,
      setUploadStatus,
      setUploadError,
      clearUploadData,
    ]
  );
};

/**
 * Hook for workspace and tree functionality
 * Handles workspace settings and tree navigation
 */
export const useFilesWorkspaceCompositeStore = () => {
  const currentWorkspace = useFilesWorkspaceStore(
    state => state.currentWorkspace
  );
  const workspaceSettings = useFilesWorkspaceStore(
    state => state.workspaceSettings
  );
  const fileTree = useFilesWorkspaceStore(state => state.fileTree);
  const treeStats = useFilesWorkspaceStore(state => state.treeStats);
  const expandedNodes = useFilesWorkspaceStore(state => state.expandedNodes);
  const selectedNodes = useFilesWorkspaceStore(state => state.selectedNodes);
  const showTreeView = useFilesWorkspaceStore(state => state.showTreeView);
  const currentPath = useFilesWorkspaceStore(state => state.currentPath);
  const navigationPath = useFilesWorkspaceStore(state => state.navigationPath);
  const quickAccess = useFilesWorkspaceStore(
    useShallow(state => ({
      recentFolders: state.recentFolders,
      favoriteFolders: state.favoriteFolders,
      pinnedFolders: state.pinnedFolders,
    }))
  );

  // Stable action references
  const setCurrentWorkspace = useFilesWorkspaceStore(
    state => state.setCurrentWorkspace
  );
  const updateWorkspaceSettings = useFilesWorkspaceStore(
    state => state.updateWorkspaceSettings
  );
  const setFileTree = useFilesWorkspaceStore(state => state.setFileTree);
  const expandTreeNode = useFilesWorkspaceStore(state => state.expandTreeNode);
  const collapseTreeNode = useFilesWorkspaceStore(
    state => state.collapseTreeNode
  );
  const toggleTreeNode = useFilesWorkspaceStore(state => state.toggleTreeNode);
  const selectTreeNode = useFilesWorkspaceStore(state => state.selectTreeNode);
  const setTreeViewVisible = useFilesWorkspaceStore(
    state => state.setTreeViewVisible
  );
  const navigateToFolder = useFilesWorkspaceStore(
    state => state.navigateToFolder
  );
  const addRecentFolder = useFilesWorkspaceStore(
    state => state.addRecentFolder
  );
  const toggleFavoriteFolder = useFilesWorkspaceStore(
    state => state.toggleFavoriteFolder
  );
  const togglePinnedFolder = useFilesWorkspaceStore(
    state => state.togglePinnedFolder
  );

  return useMemo(
    () => ({
      // Workspace state
      currentWorkspace,
      workspaceSettings,
      hasWorkspace: currentWorkspace !== null,

      // Tree state
      fileTree,
      treeStats,
      expandedNodes,
      selectedNodes,
      showTreeView,
      hasTree: fileTree.length > 0,
      hasExpandedNodes: expandedNodes.length > 0,
      hasSelectedNodes: selectedNodes.length > 0,

      // Navigation state
      currentPath,
      navigationPath,

      // Quick access state
      quickAccess,
      hasQuickAccess:
        quickAccess.recentFolders.length > 0 ||
        quickAccess.favoriteFolders.length > 0 ||
        quickAccess.pinnedFolders.length > 0,

      // Actions
      setCurrentWorkspace,
      updateWorkspaceSettings,
      setFileTree,
      expandTreeNode,
      collapseTreeNode,
      toggleTreeNode,
      selectTreeNode,
      setTreeViewVisible,
      navigateToFolder,
      addRecentFolder,
      toggleFavoriteFolder,
      togglePinnedFolder,
    }),
    [
      currentWorkspace,
      workspaceSettings,
      fileTree,
      treeStats,
      expandedNodes,
      selectedNodes,
      showTreeView,
      currentPath,
      navigationPath,
      quickAccess,
      setCurrentWorkspace,
      updateWorkspaceSettings,
      setFileTree,
      expandTreeNode,
      collapseTreeNode,
      toggleTreeNode,
      selectTreeNode,
      setTreeViewVisible,
      navigateToFolder,
      addRecentFolder,
      toggleFavoriteFolder,
      togglePinnedFolder,
    ]
  );
};

// ===== UTILITY FUNCTIONS =====

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download file utility
 */
function downloadFile(file: FileData): void {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
