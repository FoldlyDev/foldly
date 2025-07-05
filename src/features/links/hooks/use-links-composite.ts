/**
 * Composite hooks that combine multiple stores
 * Eliminates prop drilling by providing clean, focused interfaces
 * Following 2025 React + Zustand best practices
 */

import { useMemo, useCallback } from 'react';
import {
  useLinksDataStore,
  useLinksUIStore,
  useLinksModalStore,
  linksDataSelectors,
  linksUISelectors,
  linksModalSelectors,
} from '../store';
import { useLinkCardActions } from './use-link-card-actions';
import type { LinkData, LinkId } from '../store';

/**
 * Combined hook for link card components
 * Replaces the current useLinkCard hook with store-based approach
 */
export const useLinkCardStore = (linkId: LinkId) => {
  // Data subscriptions with stable selectors
  const link = useLinksDataStore(
    useCallback(
      state => state.links.find((l: LinkData) => l.id === linkId),
      [linkId]
    )
  );
  const isLoading = useLinksDataStore(linksDataSelectors.isLoading);

  // UI subscriptions with stable selectors
  const isSelected = useLinksUIStore(
    useCallback(state => state.selectedLinkIds.has(linkId), [linkId])
  );
  const isMultiSelectMode = useLinksUIStore(state => state.isMultiSelectMode);

  // Stable action references
  const updateLink = useLinksDataStore(state => state.updateLink);
  const removeLink = useLinksDataStore(state => state.removeLink);
  const updateLinkStats = useLinksDataStore(state => state.updateLinkStats);
  const toggleLinkSelection = useLinksUIStore(
    state => state.toggleLinkSelection
  );

  // Get actions using the new hook
  const actions = useLinkCardActions({
    link: link!,
    isBaseLink: link?.linkType === 'base',
  });

  // Memoized computed values with stable dependencies
  const computed = useMemo(() => {
    if (!link) return null;

    return {
      isBaseLink: link.linkType === 'base',
      formattedDate: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(link.createdAt)),

      // Use actions from the hook
      handleViewDetails: actions.handleViewDetails,
      handleShare: actions.handleShare,
      handleDelete: actions.handleDelete,
      handleCopyLink: actions.handleCopyLink,
      handleSettings: actions.handleSettings,
      handleOpenExternal: actions.handleOpenExternal,
      handleToggleSelection: () => toggleLinkSelection(link.id),

      // Action arrays for different contexts
      dropdownActions: actions.dropdownActions,
      quickActions: actions.quickActions,
    };
  }, [link, actions, toggleLinkSelection]);

  return useMemo(
    () => ({
      link,
      isLoading,
      isSelected,
      isMultiSelectMode,
      computed,
      // Direct actions
      updateLink,
      removeLink,
      updateLinkStats,
    }),
    [
      link,
      isLoading,
      isSelected,
      isMultiSelectMode,
      computed,
      updateLink,
      removeLink,
      updateLinkStats,
    ]
  );
};

/**
 * Hook for links container/list components
 * Provides all necessary state and actions for managing the links list
 */
export const useLinksListStore = () => {
  // Data subscriptions with stable selectors
  const links = useLinksDataStore(linksDataSelectors.links);
  const isLoading = useLinksDataStore(linksDataSelectors.isLoading);
  const error = useLinksDataStore(linksDataSelectors.error);

  // Use atomic selectors to prevent object recreation on every call
  const totalLinks = useLinksDataStore(linksDataSelectors.totalLinks);
  const activeLinks = useLinksDataStore(linksDataSelectors.activeLinks);
  const totalViews = useLinksDataStore(linksDataSelectors.totalViews);
  const totalUploads = useLinksDataStore(linksDataSelectors.totalUploads);

  // Memoize stats object with stable dependencies
  const stats = useMemo(
    () => ({
      total: totalLinks,
      active: activeLinks,
      totalViews,
      totalUploads,
    }),
    [totalLinks, activeLinks, totalViews, totalUploads]
  );

  // UI subscriptions with atomic selectors to prevent object recreation
  const viewMode = useLinksUIStore(linksUISelectors.viewMode);
  const searchQuery = useLinksUIStore(linksUISelectors.searchQuery);

  // Atomic selectors for sorting
  const sortBy = useLinksUIStore(state => state.sortBy);
  const sortDirection = useLinksUIStore(state => state.sortDirection);

  // Atomic selectors for filters
  const filterStatus = useLinksUIStore(state => state.filterStatus);
  const filterType = useLinksUIStore(state => state.filterType);

  // Atomic selectors for selection
  const isMultiSelectMode = useLinksUIStore(state => state.isMultiSelectMode);
  const selectedLinkIds = useLinksUIStore(state => state.selectedLinkIds);

  // Atomic selectors for pagination
  const currentPage = useLinksUIStore(state => state.currentPage);
  const itemsPerPage = useLinksUIStore(state => state.itemsPerPage);

  // Memoize complex objects with stable dependencies
  const sorting = useMemo(
    () => ({ sortBy, sortDirection }),
    [sortBy, sortDirection]
  );

  const filters = useMemo(
    () => ({ status: filterStatus, type: filterType }),
    [filterStatus, filterType]
  );

  const selection = useMemo(
    () => ({
      isMultiSelectMode,
      selectedLinkIds,
      selectedCount: selectedLinkIds.size,
    }),
    [isMultiSelectMode, selectedLinkIds]
  );

  const pagination = useMemo(
    () => ({ currentPage, itemsPerPage }),
    [currentPage, itemsPerPage]
  );

  // Stable action references
  const setLoading = useLinksDataStore(state => state.setLoading);
  const setError = useLinksDataStore(state => state.setError);
  const setLinks = useLinksDataStore(state => state.setLinks);
  const addLink = useLinksDataStore(state => state.addLink);
  const updateLink = useLinksDataStore(state => state.updateLink);
  const removeLink = useLinksDataStore(state => state.removeLink);

  const setViewMode = useLinksUIStore(state => state.setViewMode);
  const setSorting = useLinksUIStore(state => state.setSorting);
  const setSearchQuery = useLinksUIStore(state => state.setSearchQuery);
  const setStatusFilter = useLinksUIStore(state => state.setStatusFilter);
  const setTypeFilter = useLinksUIStore(state => state.setTypeFilter);
  const toggleMultiSelectMode = useLinksUIStore(
    state => state.toggleMultiSelectMode
  );
  const selectAllLinks = useLinksUIStore(state => state.selectAllLinks);
  const clearSelection = useLinksUIStore(state => state.clearSelection);
  const setPage = useLinksUIStore(state => state.setPage);
  const resetFilters = useLinksUIStore(state => state.resetFilters);

  const openCreateLinkModal = useLinksModalStore(
    state => state.openCreateLinkModal
  );
  const openBulkActionsModal = useLinksModalStore(
    state => state.openBulkActionsModal
  );

  // Process links (filtering, sorting, pagination)
  const processedLinks = useMemo(() => {
    let filtered = [...links];

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        link =>
          link.name.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          link.settings?.customMessage?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(link => link.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      const isBase = filters.type === 'base';
      filtered = filtered.filter(link => (link.linkType === 'base') === isBase);
    }

    // Apply sorting with proper typing
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      // Type-safe property access
      switch (sorting.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity || a.createdAt).getTime();
          bValue = new Date(b.lastActivity || b.createdAt).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'uploads':
          aValue = a.uploads;
          bValue = b.uploads;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sorting.sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pin base links to the top (after filtering and sorting)
    // This ensures base links appear first if they match search/filter criteria
    const baseLinks = filtered.filter(link => link.linkType === 'base');
    const otherLinks = filtered.filter(link => link.linkType !== 'base');

    // Return base links first, followed by other links
    return [...baseLinks, ...otherLinks];
  }, [links, searchQuery, filters, sorting]);

  // Return memoized object to prevent recreation
  return useMemo(
    () => ({
      // Data
      links: processedLinks,
      originalLinks: links,
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

      // Actions
      setLoading,
      setError,
      setLinks,
      addLink,
      updateLink,
      removeLink,
      setViewMode,
      setSorting,
      setSearchQuery,
      setStatusFilter,
      setTypeFilter,
      toggleMultiSelectMode,
      selectAllLinks,
      clearSelection,
      setPage,
      resetFilters,
      openCreateLinkModal,
      openBulkActionsModal,
    }),
    [
      processedLinks,
      links,
      isLoading,
      error,
      stats,
      viewMode,
      sorting,
      searchQuery,
      filters,
      selection,
      pagination,
      setLoading,
      setError,
      setLinks,
      addLink,
      updateLink,
      removeLink,
      setViewMode,
      setSorting,
      setSearchQuery,
      setStatusFilter,
      setTypeFilter,
      toggleMultiSelectMode,
      selectAllLinks,
      clearSelection,
      setPage,
      resetFilters,
      openCreateLinkModal,
      openBulkActionsModal,
    ]
  );
};

/**
 * Hook for modal management
 * Centralized modal state and actions
 */
export const useLinksModalsStore = () => {
  const activeModal = useLinksModalStore(linksModalSelectors.activeModal);
  const modalData = useLinksModalStore(linksModalSelectors.modalData);
  const isLoading = useLinksModalStore(linksModalSelectors.isLoading);
  const error = useLinksModalStore(linksModalSelectors.error);

  // Stable action references
  const openCreateLinkModal = useLinksModalStore(
    state => state.openCreateLinkModal
  );
  const openLinkDetailsModal = useLinksModalStore(
    state => state.openLinkDetailsModal
  );
  const openLinkSettingsModal = useLinksModalStore(
    state => state.openLinkSettingsModal
  );
  const openShareLinkModal = useLinksModalStore(
    state => state.openShareLinkModal
  );
  const openDeleteConfirmationModal = useLinksModalStore(
    state => state.openDeleteConfirmationModal
  );
  const openBulkActionsModal = useLinksModalStore(
    state => state.openBulkActionsModal
  );
  const closeModal = useLinksModalStore(state => state.closeModal);
  const setModalLoading = useLinksModalStore(state => state.setModalLoading);
  const setModalError = useLinksModalStore(state => state.setModalError);
  const updateModalData = useLinksModalStore(state => state.updateModalData);

  // Return memoized object
  return useMemo(
    () => ({
      activeModal,
      modalData,
      isLoading,
      error,
      openCreateLinkModal,
      openLinkDetailsModal,
      openLinkSettingsModal,
      openShareLinkModal,
      openDeleteConfirmationModal,
      openBulkActionsModal,
      closeModal,
      setModalLoading,
      setModalError,
      updateModalData,
    }),
    [
      activeModal,
      modalData,
      isLoading,
      error,
      openCreateLinkModal,
      openLinkDetailsModal,
      openLinkSettingsModal,
      openShareLinkModal,
      openDeleteConfirmationModal,
      openBulkActionsModal,
      closeModal,
      setModalLoading,
      setModalError,
      updateModalData,
    ]
  );
};

/**
 * Hook for settings functionality
 * Handles settings state with real-time synchronization
 */
export const useLinksSettingsStore = () => {
  // Settings subscriptions from modal store with stable selectors
  const modalData = useLinksModalStore(
    useCallback(state => state.modalData, [])
  );
  const isLoading = useLinksModalStore(
    useCallback(state => state.isLoading, [])
  );
  const error = useLinksModalStore(useCallback(state => state.error, []));

  // Extract current settings from modal data
  const currentSettings = useMemo(() => {
    if (!modalData.linkData) return null;

    const link = modalData.linkData;
    return {
      // Visibility and Security
      isPublic: link.isPublic,
      requireEmail: link.requireEmail ?? false,
      requirePassword: link.requirePassword ?? false,
      password: '',
      expiresAt: link.expiresAt,

      // File and Upload Limits
      maxFiles: link.maxFiles,
      maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
      allowedFileTypes: link.allowedFileTypes,

      // Organization Settings
      autoCreateFolders: link.autoCreateFolders,

      // Legacy settings
      allowMultiple: link.settings?.allowMultiple ?? false,
      customMessage: link.settings?.customMessage || '',
    };
  }, [modalData.linkData]);

  // Stable action references
  const updateModalData = useLinksModalStore(
    useCallback(state => state.updateModalData, [])
  );
  const updateLink = useLinksDataStore(
    useCallback(state => state.updateLink, [])
  );

  // Update settings in modal data for real-time sync
  const updateSettings = useCallback(
    (updates: Partial<typeof currentSettings>) => {
      if (!modalData.linkData) {
        console.warn('⚠️ SETTINGS STORE: No linkData available for update');
        return;
      }

      const updatedLinkData = {
        ...modalData.linkData,
        ...updates,
        // Handle file size conversion
        maxFileSize: updates.maxFileSize
          ? updates.maxFileSize * 1024 * 1024
          : modalData.linkData.maxFileSize,
        settings: {
          ...modalData.linkData.settings,
          allowMultiple:
            updates.allowMultiple ?? modalData.linkData.settings?.allowMultiple,
          customMessage:
            updates.customMessage ?? modalData.linkData.settings?.customMessage,
        },
      };

      console.log('🔄 SETTINGS STORE: Updating settings', {
        updates,
        updatedLinkData,
      });
      updateModalData({ linkData: updatedLinkData });
    },
    [modalData.linkData, updateModalData]
  );

  // Save settings to actual store
  const saveSettings = useCallback(async () => {
    if (!modalData.linkData) return;

    const link = modalData.linkData;

    // Convert UI settings back to LinkData format
    const updatedSettings = {
      isPublic: link.isPublic,
      requireEmail: link.requireEmail,
      requirePassword: link.requirePassword,
      maxFiles: link.maxFiles,
      maxFileSize: link.maxFileSize, // Already converted in updateSettings
      allowedFileTypes: link.allowedFileTypes,
      autoCreateFolders: link.autoCreateFolders,
      settings: {
        ...link.settings,
        allowMultiple: link.settings?.allowMultiple || false,
        customMessage: link.settings?.customMessage || undefined,
      },
    };

    updateLink(link.id, updatedSettings);
  }, [modalData.linkData, updateLink]);

  return {
    settings: currentSettings,
    updateSettings,
    saveSettings,
    isLoading,
    error,
  };
};

/**
 * Hook for branding functionality
 * Handles branding state with modal context awareness (creation vs settings)
 */
export const useLinksBrandingStore = () => {
  // Branding subscriptions from modal store
  const brandingContext = useLinksModalStore(
    linksModalSelectors.brandingContext
  );
  const brandingFormData = useLinksModalStore(
    linksModalSelectors.brandingFormData
  );
  const isCreationContext = useLinksModalStore(
    linksModalSelectors.isCreationContext
  );
  const isSettingsContext = useLinksModalStore(
    linksModalSelectors.isSettingsContext
  );
  const modalData = useLinksModalStore(linksModalSelectors.modalData);

  // Stable action references
  const updateBrandingData = useLinksModalStore(
    state => state.updateBrandingData
  );
  const initializeBrandingForCreation = useLinksModalStore(
    state => state.initializeBrandingForCreation
  );
  const initializeBrandingForSettings = useLinksModalStore(
    state => state.initializeBrandingForSettings
  );

  // Return memoized object
  return useMemo(
    () => ({
      // State
      brandingContext,
      brandingFormData,
      isCreationContext,
      isSettingsContext,
      currentLink: modalData.linkData || null,

      // Computed
      isBrandingEnabled: brandingFormData.brandingEnabled,
      hasCustomBranding:
        brandingFormData.brandingEnabled &&
        (brandingFormData.brandColor !== '#6c47ff' ||
          brandingFormData.accentColor !== '#4ade80' ||
          brandingFormData.logoUrl !== ''),

      // Actions
      updateBrandingData,
      initializeBrandingForCreation,
      initializeBrandingForSettings,
    }),
    [
      brandingContext,
      brandingFormData,
      isCreationContext,
      isSettingsContext,
      modalData.linkData,
      updateBrandingData,
      initializeBrandingForCreation,
      initializeBrandingForSettings,
    ]
  );
};
