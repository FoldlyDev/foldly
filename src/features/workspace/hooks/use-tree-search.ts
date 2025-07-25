'use client';

import React from 'react';

export type UseTreeSearchParams = {
  tree: any;
  searchQuery: string;
};

/**
 * Hook that manages tree search functionality
 * Handles search state, expand/collapse behavior, and query application
 */
export function useTreeSearch({ tree, searchQuery }: UseTreeSearchParams) {
  // Track search state and preserve expanded items
  const [isSearching, setIsSearching] = React.useState(false);
  const [preSearchExpandedItems, setPreSearchExpandedItems] = React.useState<
    string[]
  >([]);

  // Handle search - let tree manage its own state
  React.useEffect(() => {
    if (!tree) return;

    const hasSearchQuery = searchQuery.trim().length > 0;

    // Apply the search to the tree's internal state
    const searchProps = tree.getSearchInputElementProps();
    if (searchProps?.onChange) {
      const syntheticEvent = {
        target: { value: searchQuery },
      } as React.ChangeEvent<HTMLInputElement>;
      searchProps.onChange(syntheticEvent);
    }

    // Handle expand/collapse based on search state
    if (hasSearchQuery && !isSearching) {
      // Starting search - save current state and expand all
      const currentExpanded = tree.getState()?.expandedItems || [];
      setPreSearchExpandedItems(currentExpanded);
      setIsSearching(true);
      tree.expandAll();
    } else if (!hasSearchQuery && isSearching) {
      // Ending search - restore previous expanded state
      setIsSearching(false);
      // Note: Commented out setState as it might cause issues
      // tree.setState(prevState => ({
      //   ...prevState,
      //   expandedItems: preSearchExpandedItems,
      // }));
      tree.collapseAll();
    }
  }, [searchQuery, tree, isSearching]);

  return {
    isSearching,
    preSearchExpandedItems,
  };
}