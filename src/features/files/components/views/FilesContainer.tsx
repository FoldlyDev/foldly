'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSearchParams } from 'next/navigation';
import { TwoPanelLayout } from '../desktop/TwoPanelLayout';
import { ContentLoader } from '@/components/ui/feedback';
import { Alert, AlertDescription } from '@/components/ui/core/shadcn/alert';
import { AlertCircle } from 'lucide-react';
import { fetchLinksWithFilesAction } from '../../lib/actions';
import { filesQueryKeys } from '../../lib/query-keys';
import { useAuth } from '@clerk/nextjs';
import { SinglePanelLayout } from '../mobile/SinglePanelLayout';
import { useStorageTracking } from '@/features/workspace/hooks';
import { useRealtimeFiles } from '../../hooks/use-realtime-files';
import '../../styles/files-layout.css';

export function FilesContainer() {
  const { userId } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const searchParams = useSearchParams();
  
  // Enable real-time updates for files
  useRealtimeFiles();
  
  // Get linkId and highlight from URL params
  const linkIdFromUrl = searchParams.get('linkId');
  const shouldHighlight = searchParams.get('highlight') === 'true';
  
  // Show skeleton during initial hydration to prevent flash
  const [hydrated, setHydrated] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  // Auto-select link when navigating from notification
  useEffect(() => {
    if (linkIdFromUrl && shouldHighlight) {
      setSelectedLinkId(linkIdFromUrl);
      // Optionally show a visual highlight effect
      setTimeout(() => {
        const element = document.getElementById(`link-${linkIdFromUrl}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-animation');
          setTimeout(() => {
            element.classList.remove('highlight-animation');
          }, 2000);
        }
      }, 100);
    }
  }, [linkIdFromUrl, shouldHighlight]);
  
  // Get storage information
  const { storageInfo } = useStorageTracking();

  // Fetch links with files
  const { data, isLoading, error } = useQuery({
    queryKey: filesQueryKeys.linksWithFiles(),
    queryFn: async () => {
      const result = await fetchLinksWithFilesAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links');
      }
      return result.data || [];
    },
    enabled: !!userId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <ContentLoader 
          size="lg" 
          text="Loading your files..." 
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load files'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Responsive layout with full height
  return (
    <div className="files-layout">
      <div className="files-container">
        {!hydrated ? (
          // Minimal skeleton to prevent layout shift
          <div className="h-full flex gap-4">
            <div className="flex-1 rounded-lg border bg-card animate-pulse" />
            <div className="flex-1 rounded-lg border bg-card animate-pulse hidden md:block" />
          </div>
        ) : isDesktop ? (
          <TwoPanelLayout 
            links={data || []} 
            storageUsed={storageInfo.storageUsedBytes}
            storageLimit={storageInfo.storageLimitBytes}
            className="h-full"
            selectedLinkId={selectedLinkId}
            onLinkSelect={setSelectedLinkId}
          />
        ) : (
          <SinglePanelLayout 
            links={data || []}
            selectedLinkId={selectedLinkId}
            onLinkSelect={setSelectedLinkId}
          />
        )}
      </div>
    </div>
  );
}