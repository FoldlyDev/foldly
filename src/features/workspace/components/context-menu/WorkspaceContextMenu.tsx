'use client';

import React, { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import {
  ContextMenu as ContextMenuRoot,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/core/shadcn/context-menu';
import { generateLinkFromFolderAction, checkFolderHasGeneratedLinkAction } from '@/features/links/lib/actions';
import { useQueryClient } from '@tanstack/react-query';
import { generateLinkUrl } from '@/lib/config/url-config';
import { showWorkspaceError } from '@/features/notifications/utils';
import { showGeneratedLinkNotification } from '@/features/notifications/utils/link-notifications';
import { useGeneratingLinksStore } from '../../store/generating-links-store';

interface WorkspaceContextMenuProps {
  children: React.ReactNode;
  folderId: string;
  folderName: string;
  onOpenChange?: (open: boolean) => void;
}

export function WorkspaceContextMenu({
  children,
  folderId,
  folderName,
  onOpenChange,
}: WorkspaceContextMenuProps) {
  const [hasGeneratedLink, setHasGeneratedLink] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Use store for generating state
  const { addGeneratingItem, removeGeneratingItem, addFolderWithLink, isGenerating } = useGeneratingLinksStore();
  const isGeneratingLink = isGenerating(folderId);

  // Check if folder already has a generated link when menu opens
  React.useEffect(() => {
    if (isOpen) {
      setIsCheckingLink(true);
      checkFolderHasGeneratedLinkAction(folderId)
        .then(result => {
          setHasGeneratedLink(result.hasLink);
        })
        .catch(error => {
          console.error('Error checking folder link status:', error);
          // Assume no link on error to allow generation
          setHasGeneratedLink(false);
        })
        .finally(() => {
          setIsCheckingLink(false);
        });
    }
  }, [isOpen, folderId]);

  const handleGenerateLink = async () => {
    if (isGeneratingLink || hasGeneratedLink || isCheckingLink) return;

    // Add to generating state
    addGeneratingItem(folderId);
    
    try {
      const result = await generateLinkFromFolderAction({ folderId });

      if (result.success && result.data) {
        // Invalidate links query to refresh the links list
        await queryClient.invalidateQueries({ queryKey: ['links'] });
        
        // Mark that this folder now has a generated link
        setHasGeneratedLink(true);
        addFolderWithLink(folderId);
        
        // Build the link URL
        const linkUrl = generateLinkUrl(result.data.slug, result.data.topic || null, { absolute: true });
        
        // Show interactive notification
        showGeneratedLinkNotification({
          linkId: result.data.id,
          linkUrl,
          folderName,
        });
      } else {
        showWorkspaceError('link_generated', {
          itemName: folderName,
          itemType: 'folder',
        }, result.error || 'An unexpected error occurred');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      showWorkspaceError('link_generated', {
        itemName: folderName,
        itemType: 'folder',
      }, 'Failed to generate link. Please try again.');
    } finally {
      // Remove from generating state
      removeGeneratingItem(folderId);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <ContextMenuRoot open={isOpen} onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={handleGenerateLink}
          disabled={isGeneratingLink || hasGeneratedLink || isCheckingLink}
          className="flex items-center"
        >
          {isCheckingLink ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="flex-1">Checking...</span>
            </>
          ) : isGeneratingLink ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="flex-1">Generating...</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              <span className="flex-1">
                {hasGeneratedLink ? 'Link Already Generated' : 'Generate link for this folder'}
              </span>
            </>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}