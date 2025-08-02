'use client';

import { useEffect } from 'react';
import type { TreeInstance } from '@headless-tree/core';
import type { LinkTreeItem } from '../lib/tree-data';

interface UseLinkTreeSearchProps {
  tree: TreeInstance<LinkTreeItem>;
  searchQuery: string;
}

export function useLinkTreeSearch({ tree, searchQuery }: UseLinkTreeSearchProps) {
  useEffect(() => {
    if (!tree) return;

    if (searchQuery.trim()) {
      console.log('🔍 Applying search query:', searchQuery);
      tree.setSearch(searchQuery);
    } else {
      console.log('🔍 Clearing search query');
      tree.setSearch('');
    }
  }, [tree, searchQuery]);
}