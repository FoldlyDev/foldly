'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLinksListStore } from '../../hooks/use-links-composite';
import { initializeSeedData } from '../../utils';
import { Button } from '@/components/ui/shadcn/button';

/**
 * Development Tools Panel
 * Provides utilities for testing the Zustand store flow
 * Only visible in development mode
 */
export const DeveloperToolsPanel = () => {
  const { links, setLinks, stats } = useLinksListStore();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  const handleLoadSeedData = () => {
    const username = 'demo-user';
    initializeSeedData(setLinks, username);
    toast.success('Seed data loaded successfully!');
  };

  const handleClearData = () => {
    setLinks([]);
    toast.success('All links cleared!');
  };

  const handleUpdateStats = () => {
    // Simulate some activity by updating random links
    const updatedLinks = links.map(link => ({
      ...link,
      views: link.views + Math.floor(Math.random() * 10),
      uploads: link.uploads + Math.floor(Math.random() * 3),
      lastActivity: new Date().toISOString(),
    }));
    setLinks(updatedLinks);
    toast.success('Stats updated with random activity!');
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm'
    >
      <div className='flex items-center gap-2 mb-3'>
        <Database className='w-4 h-4 text-blue-600' />
        <h3 className='font-semibold text-gray-900'>Dev Tools</h3>
      </div>

      <div className='space-y-2 text-xs text-gray-600 mb-4'>
        <div>Links: {stats.total}</div>
        <div>Total Views: {stats.totalViews}</div>
        <div>Total Uploads: {stats.totalUploads}</div>
      </div>

      <div className='space-y-2'>
        <Button
          onClick={handleLoadSeedData}
          size='sm'
          className='w-full text-xs'
          variant='outline'
        >
          <Database className='w-3 h-3 mr-1' />
          Load Seed Data
        </Button>

        <Button
          onClick={handleUpdateStats}
          size='sm'
          className='w-full text-xs'
          variant='outline'
          disabled={links.length === 0}
        >
          <RefreshCw className='w-3 h-3 mr-1' />
          Simulate Activity
        </Button>

        <Button
          onClick={handleClearData}
          size='sm'
          className='w-full text-xs'
          variant='destructive'
          disabled={links.length === 0}
        >
          <Trash2 className='w-3 h-3 mr-1' />
          Clear All Data
        </Button>
      </div>

      <div className='text-xs text-gray-500 mt-3 pt-3 border-t'>
        Testing the complete Zustand flow
      </div>
    </motion.div>
  );
};
