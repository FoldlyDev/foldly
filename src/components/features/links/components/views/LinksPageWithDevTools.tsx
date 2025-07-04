'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { LinksContainer } from './links-container';
import { DeveloperToolsPanel } from '../dev';
import { useLinksListStore } from '../../hooks/use-links-composite';
import { initializeSeedData } from '../../utils';

/**
 * Links page wrapper with developer tools
 * Automatically loads seed data if no links exist
 */
export const LinksPageWithDevTools = () => {
  const { user } = useUser();
  const { links, setLinks } = useLinksListStore();

  // Auto-load seed data if no links exist (for testing)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && links.length === 0) {
      const username =
        user?.username || user?.firstName?.toLowerCase() || 'demo-user';
      console.log('🌱 Auto-loading seed data for testing...');
      initializeSeedData(setLinks, username);
    }
  }, [links.length, setLinks, user]);

  return (
    <>
      <LinksContainer />
      <DeveloperToolsPanel />
    </>
  );
};
