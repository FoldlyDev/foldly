import { useMemo } from 'react';
import { useLinksStore } from '@/store/slices/links-store';

/**
 * Custom hook that encapsulates all links state management logic
 * Provides computed values and clean interface for components
 */
export const useLinksState = () => {
  const {
    links,
    isLoading,
    error,
    viewMode,
    searchQuery,
    sortOption,
    filter,
    selectedLinkIds,
    isCreateModalOpen,
    isEditModalOpen,
    editingLinkId,
    // Actions
    setViewMode,
    setSearchQuery,
    setSortOption,
    setFilter,
    setSelectedLinkIds,
    toggleLinkSelection,
    selectAllLinks,
    clearSelection,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    fetchLinks,
    publishCreatedLinks,
    createLink,
    updateLink,
    removeLink,
  } = useLinksStore();

  // Computed values
  const computedValues = useMemo(() => {
    // Check if user has a base link (foundation link without topic)
    const baseLink = links.find(
      link => !link.topic || link.topic.trim() === ''
    );
    const hasBaseLink = Boolean(baseLink);

    // Filter links based on current filters
    let filteredLinks = links;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredLinks = filteredLinks.filter(
        link =>
          link.title.toLowerCase().includes(query) ||
          link.slug.toLowerCase().includes(query) ||
          (link.description &&
            link.description.toLowerCase().includes(query)) ||
          (link.topic && link.topic.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filteredLinks = filteredLinks.filter(link => {
        switch (filter) {
          case 'active':
            return !link.expiresAt || new Date(link.expiresAt) > new Date();
          case 'paused':
            return false; // TODO: Add paused state to UploadLink
          case 'expired':
            return link.expiresAt && new Date(link.expiresAt) <= new Date();
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sortedLinks = [...filteredLinks].sort((a, b) => {
      switch (sortOption) {
        case 'created_desc':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'created_asc':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'uploads_desc':
          return b.totalUploads - a.totalUploads;
        case 'uploads_asc':
          return a.totalUploads - b.totalUploads;
        default:
          return 0;
      }
    });

    // Separate base link from topic links for display
    const baseLinkInFiltered = sortedLinks.find(
      link => !link.topic || link.topic.trim() === ''
    );
    const topicLinks = sortedLinks.filter(
      link => link.topic && link.topic.trim() !== ''
    );

    // Statistics
    const linkStats = {
      total: links.length,
      active: links.filter(
        link => !link.expiresAt || new Date(link.expiresAt) > new Date()
      ).length,
      expired: links.filter(
        link => link.expiresAt && new Date(link.expiresAt) <= new Date()
      ).length,
      public: links.filter(link => link.isPublic).length,
      private: links.filter(link => !link.isPublic).length,
      totalUploads: links.reduce((sum, link) => sum + link.totalUploads, 0),
      hasSelection: selectedLinkIds.length > 0,
      selectedCount: selectedLinkIds.length,
    };

    return {
      hasBaseLink,
      baseLink,
      filteredLinks: sortedLinks,
      baseLinkInFiltered,
      topicLinks,
      linkStats,
      isEmpty: links.length === 0,
      isSearchActive: searchQuery.trim() !== '',
      isFilterActive: filter !== 'all',
    };
  }, [links, searchQuery, filter, sortOption, selectedLinkIds]);

  // Return all state and computed values
  return {
    // Raw state
    links,
    isLoading,
    error,
    viewMode,
    searchQuery,
    sortOption,
    filter,
    selectedLinkIds,
    isCreateModalOpen,
    isEditModalOpen,
    editingLinkId,

    // Computed values
    ...computedValues,

    // Actions
    setViewMode,
    setSearchQuery,
    setSortOption,
    setFilter,
    setSelectedLinkIds,
    toggleLinkSelection,
    selectAllLinks,
    clearSelection,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    fetchLinks,
    publishCreatedLinks,
    createLink,
    updateLink,
    removeLink,
  };
};
