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
import { showWorkspaceNotification, showWorkspaceError } from '@/features/notifications/utils';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedLink, setHasGeneratedLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check if folder already has a generated link when menu opens
  React.useEffect(() => {
    if (isOpen) {
      checkFolderHasGeneratedLinkAction(folderId).then(result => {
        setHasGeneratedLink(result.hasLink);
      });
    }
  }, [isOpen, folderId]);

  const handleGenerateLink = async () => {
    if (isGenerating || hasGeneratedLink) return;

    setIsGenerating(true);
    try {
      const result = await generateLinkFromFolderAction({ folderId });

      if (result.success && result.data) {
        // Invalidate links query to refresh the links list
        await queryClient.invalidateQueries({ queryKey: ['links'] });
        
        // Build the link URL
        const linkUrl = generateLinkUrl(result.data.slug, result.data.topic || null, { absolute: true });
        
        // Show success notification
        showWorkspaceNotification('link_generated', {
          itemName: folderName,
          itemType: 'folder',
          targetLocation: linkUrl,
        });

        // Mark that this folder now has a generated link
        setHasGeneratedLink(true);

        // TODO: Add notification support for generated links
        // This requires extending the notification system beyond upload notifications
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
      setIsGenerating(false);
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
          disabled={isGenerating || hasGeneratedLink}
          className="flex items-center"
        >
          {isGenerating ? (
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