/**
 * Composite hooks that combine multiple stores
 * Eliminates prop drilling by providing clean, focused interfaces
 * Following 2025 React + Zustand best practices
 *
 * ALIGNED WITH DATABASE SCHEMA - Only uses fields from src/lib/supabase/types
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
import type { LinkWithStats, LinkType } from '@/lib/supabase/types';
import type { DatabaseId } from '@/lib/supabase/types';

// Link type constants for convenience
const LINK_TYPE = {
  BASE: 'base',
  CUSTOM: 'custom',
  GENERATED: 'generated',
} as const satisfies Record<string, LinkType>;

/**
 * Combined hook for link card components
 * Replaces the current useLinkCard hook with store-based approach
 */
export const useLinkCardStore = (linkId: DatabaseId) => {
  // Data subscriptions with stable selectors
  const link = useLinksDataStore(
    useCallback(
      state => state.links.find((l: LinkWithStats) => l.id === linkId),
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
    isBaseLink: link?.linkType === LINK_TYPE.BASE,
  });

  // Memoized computed values with stable dependencies
  const computed = useMemo(() => {
    if (!link) return null;

    return {
      isBaseLink: link.linkType === LINK_TYPE.BASE,
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
  const totalFiles = useLinksDataStore(linksDataSelectors.totalFiles);
  const totalUploads = useLinksDataStore(linksDataSelectors.totalUploads);

  // Memoize stats object with stable dependencies
  const stats = useMemo(
    () => ({
      total: totalLinks,
      active: activeLinks,
      totalFiles,
      totalUploads,
    }),
    [totalLinks, activeLinks, totalFiles, totalUploads]
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
  const clearSelection = useLinksUIStore(state => state.clearSelection);
  const selectAllLinks = useLinksUIStore(state => state.selectAllLinks);
  const toggleLinkSelection = useLinksUIStore(
    state => state.toggleLinkSelection
  );
  const setCurrentPage = useLinksUIStore(state => state.setCurrentPage);
  const setItemsPerPage = useLinksUIStore(state => state.setItemsPerPage);

  return useMemo(
    () => ({
      // State
      links,
      originalLinks: links, // Alias for compatibility with LinksContainer
      isLoading,
      error,
      stats,
      viewMode,
      searchQuery,
      sorting,
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
      clearSelection,
      selectAllLinks,
      toggleLinkSelection,
      setCurrentPage,
      setItemsPerPage,
    }),
    [
      links,
      isLoading,
      error,
      stats,
      viewMode,
      searchQuery,
      sorting,
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
      clearSelection,
      selectAllLinks,
      toggleLinkSelection,
      setCurrentPage,
      setItemsPerPage,
    ]
  );
};

/**
 * Hook for modal management
 * Provides modal state and actions
 */
export const useLinksModalsStore = () => {
  const modalStore = useLinksModalStore();

  return useMemo(
    () => ({
      // State
      activeModal: modalStore.activeModal,
      modalData: modalStore.modalData,
      isLoading: modalStore.isLoading,
      error: modalStore.error,

      // Actions
      openLinkDetailsModal: modalStore.openLinkDetailsModal,
      openShareLinkModal: modalStore.openShareLinkModal,
      openLinkSettingsModal: modalStore.openLinkSettingsModal,
      openDeleteConfirmationModal: modalStore.openDeleteConfirmationModal,
      openCreateLinkModal: modalStore.openCreateLinkModal,
      closeModal: modalStore.closeModal,
      updateModalData: modalStore.updateModalData,
    }),
    [modalStore]
  );
};

/**
 * Hook for settings functionality
 * Handles settings state with real-time synchronization
 * ALIGNED WITH DATABASE SCHEMA - Only database fields
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

  // Define the settings interface for type safety - only database fields
  interface SettingsData {
    title: string;
    description: string | null;
    isPublic: boolean;
    requireEmail: boolean;
    requirePassword: boolean;
    password: string;
    expiresAt: string | undefined;
    maxFiles: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    brandEnabled: boolean;
    brandColor: string;
  }

  // Extract current settings from modal data - only database fields
  const currentSettings = useMemo((): SettingsData | null => {
    if (!modalData.linkData) return null;

    const link = modalData.linkData;
    return {
      // Database fields only
      title: link.title,
      description: link.description,
      isPublic: link.isPublic,
      requireEmail: link.requireEmail,
      requirePassword: link.requirePassword,
      password: '',
      expiresAt: link.expiresAt
        ? link.expiresAt.toISOString().split('T')[0]
        : undefined,
      maxFiles: link.maxFiles,
      maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
      allowedFileTypes: link.allowedFileTypes ? [...link.allowedFileTypes] : [],
      brandEnabled: link.brandEnabled,
      brandColor: link.brandColor || '',
    };
  }, [modalData.linkData]);

  // Stable action references
  const updateModalData = useLinksModalStore(
    useCallback(state => state.updateModalData, [])
  );
  const updateLink = useLinksDataStore(
    useCallback(state => state.updateLink, [])
  );

  // Update settings in modal data for real-time sync - only database fields
  const updateSettings = useCallback(
    (updates: Partial<SettingsData>) => {
      if (!modalData.linkData || !updates) {
        console.warn(
          '⚠️ SETTINGS STORE: No linkData or updates available for update'
        );
        return;
      }

      // Build the updated LinkData object with only database fields
      const updatedLinkData: typeof modalData.linkData = {
        ...modalData.linkData,
        // Only update database fields
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.isPublic !== undefined && { isPublic: updates.isPublic }),
        ...(updates.requireEmail !== undefined && {
          requireEmail: updates.requireEmail,
        }),
        ...(updates.requirePassword !== undefined && {
          requirePassword: updates.requirePassword,
        }),
        ...(updates.expiresAt !== undefined && {
          expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null,
        }),
        ...(updates.maxFiles !== undefined && { maxFiles: updates.maxFiles }),
        // Handle file size conversion for maxFileSize
        ...(updates.maxFileSize !== undefined && {
          maxFileSize: updates.maxFileSize * 1024 * 1024, // Convert MB to bytes
        }),
        ...(updates.allowedFileTypes !== undefined && {
          allowedFileTypes:
            updates.allowedFileTypes.length > 0
              ? updates.allowedFileTypes
              : null,
        }),
        ...(updates.brandEnabled !== undefined && {
          brandEnabled: updates.brandEnabled,
        }),
        ...(updates.brandColor !== undefined && {
          brandColor: updates.brandColor || null,
        }),
      };

      console.log('🔄 SETTINGS STORE: Updating settings', {
        updates,
        updatedLinkData,
      });
      updateModalData({ linkData: updatedLinkData });
    },
    [modalData.linkData, updateModalData]
  );

  // Save settings to actual store - only database fields
  const saveSettings = useCallback(async () => {
    if (!modalData.linkData) return;

    const link = modalData.linkData;

    // Convert UI settings back to database format
    const updatedSettings = {
      title: link.title,
      description: link.description,
      isPublic: link.isPublic,
      requireEmail: link.requireEmail,
      requirePassword: link.requirePassword,
      maxFiles: link.maxFiles,
      maxFileSize: link.maxFileSize, // Already converted in updateSettings
      allowedFileTypes: link.allowedFileTypes,
      expiresAt: link.expiresAt,
      brandEnabled: link.brandEnabled,
      brandColor: link.brandColor,
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
 * ALIGNED WITH DATABASE SCHEMA - Only database branding fields
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

  // Return memoized object with only database branding fields
  return useMemo(
    () => ({
      // State
      brandingContext,
      brandingFormData,
      isCreationContext,
      isSettingsContext,
      currentLink: modalData.linkData || null,

      // Computed - only database branding fields
      isBrandingEnabled: brandingFormData.brandEnabled,
      hasCustomBranding:
        brandingFormData.brandEnabled && !!brandingFormData.brandColor,

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
