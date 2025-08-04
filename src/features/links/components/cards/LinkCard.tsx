'use client';

import { memo } from 'react';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { LinkCardMobile } from './LinkCardMobile';
import { LinkCardDesktop } from './LinkCardDesktop';
import { LinkCardGrid } from './LinkCardGrid';
import { toast } from 'sonner';
import { useLinkUrl } from '../../hooks/use-link-url';
import type { LinkWithStats } from '@/lib/database/types';
import { Eye, Copy, Share, ExternalLink, Settings, Trash2 } from 'lucide-react';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useNotificationStore } from '@/features/notifications/store/notification-store';

interface LinkCardProps {
  link: LinkWithStats;
  viewMode: 'grid' | 'list';
  onDetails: () => void;
  onShare: () => void;
  onSettings: () => void;
  onDelete: () => void;
  searchQuery?: string;
  isMultiSelected?: boolean;
  onMultiSelect?: (linkId: string) => void;
}

const LinkCardComponent = ({
  link,
  viewMode,
  onDetails,
  onShare,
  onSettings,
  onDelete,
  searchQuery = '',
  isMultiSelected = false,
  onMultiSelect,
}: LinkCardProps) => {
  const isMobile = useIsMobile();
  const unreadCounts = useNotificationStore(state => state.unreadCounts);
  const clearLinkNotificationsLocal = useNotificationStore(state => state.clearLinkNotifications);
  
  // Get unread count for this link
  const unreadCount = unreadCounts.get(link.id) || 0;
  
  // Clear notifications both locally and in database
  const clearLinkNotifications = async (linkId: string) => {
    // Clear local state immediately for instant UI feedback
    clearLinkNotificationsLocal(linkId);
    
    // Clear in database
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId }),
      });
      
      if (!response.ok) {
        // If failed, refetch counts to sync with database
        const countsResponse = await fetch('/api/notifications/unread-counts');
        if (countsResponse.ok) {
          const counts = await countsResponse.json();
          useNotificationStore.getState().setUnreadCounts(counts);
        }
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Computed values
  const isBaseLink = link.linkType === 'base';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(link.createdAt));

  // Get dynamic URLs
  const { fullUrl } = useLinkUrl(link.slug, link.topic);

  // Action handlers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenExternal = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Define dropdown actions with actual icon components (actions not in quick actions)
  const dropdownActions = [
    {
      id: 'details',
      label: 'View Details',
      icon: Eye,
      onClick: onDetails,
    },
    {
      id: 'external',
      label: 'Open External',
      icon: ExternalLink,
      onClick: handleOpenExternal,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: onSettings,
    },
    ...(isBaseLink
      ? []
      : [
          {
            id: 'delete',
            label: 'Delete',
            icon: Trash2,
            onClick: onDelete,
            variant: 'destructive' as const,
          },
        ]),
  ];

  // Define quick actions with actual icon components (only most essential actions)
  const quickActions = [
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      onClick: handleCopyLink,
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share,
      onClick: onShare,
    },
  ];

  // Grid view - same for mobile and desktop
  if (viewMode === 'grid') {
    return (
      <LinkCardGrid
        link={link}
        index={0}
        isBaseLink={isBaseLink}
        formattedDate={formattedDate}
        isMultiSelected={isMultiSelected}
        onOpenDetails={onDetails}
        onMultiSelect={onMultiSelect || (() => {})}
        searchQuery={searchQuery}
        actions={dropdownActions}
        quickActions={quickActions}
        unreadCount={unreadCount}
        onClearNotifications={() => clearLinkNotifications(link.id)}
      />
    );
  }

  // List view - different layouts for mobile vs desktop
  if (isMobile) {
    return (
      <LinkCardMobile
        link={link}
        index={0}
        isBaseLink={isBaseLink}
        formattedDate={formattedDate}
        isMultiSelected={isMultiSelected}
        onOpenDetails={onDetails}
        onMultiSelect={onMultiSelect || (() => {})}
        actions={dropdownActions}
        quickActions={quickActions}
        searchQuery={searchQuery}
      />
    );
  }

  return (
    <LinkCardDesktop
      link={link}
      index={0}
      isBaseLink={isBaseLink}
      formattedDate={formattedDate}
      isMultiSelectMode={true}
      isMultiSelected={isMultiSelected}
      onOpenDetails={onDetails}
      onCopyLink={handleCopyLink}
      onShare={onShare}
      onSelectionChange={onMultiSelect || (() => {})}
      searchQuery={searchQuery}
      actions={dropdownActions}
      quickActions={quickActions}
    />
  );
};

// ✅ Memoized component to prevent unnecessary re-renders
// Only re-renders when link, viewMode, or action handlers change
export const LinkCard = memo(LinkCardComponent);
