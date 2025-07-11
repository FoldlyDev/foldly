'use client';

import { useCallback, useMemo } from 'react';
import {
  Copy,
  Share2,
  Eye,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ActionItem } from '@/components/ui/types';
import type { LinkWithStats } from '@/lib/supabase/types';
import { generateFullUrl } from '../lib/utils';
import { useLinksModalsStore } from './use-links-composite';

/**
 * Hook that provides standardized link card actions with modal connections
 * Eliminates code duplication and ensures consistent behavior across all card variants
 *
 * Features:
 * - Connects dropdown actions to modal system
 * - Handles copy link functionality
 * - Provides share capabilities
 * - Manages modal state through centralized store
 * - Supports different action sets based on context
 */

interface UseLinkCardActionsOptions {
  link: LinkWithStats;
  isBaseLink?: boolean;
  showDeleteAction?: boolean;
  showSettingsAction?: boolean;
}

interface UseLinkCardActionsReturn {
  // Individual action handlers
  handleCopyLink: () => void;
  handleShare: () => void;
  handleViewDetails: () => void;
  handleSettings: () => void;
  handleDelete: () => void;
  handleOpenExternal: () => void;

  // Action arrays for different contexts
  dropdownActions: ActionItem[];
  quickActions: ActionItem[];
  mobileActions: ActionItem[];
}

export const useLinkCardActions = ({
  link,
  isBaseLink = false,
  showDeleteAction = true,
  showSettingsAction = true,
}: UseLinkCardActionsOptions): UseLinkCardActionsReturn => {
  const modalStore = useLinksModalsStore();

  const {
    openLinkDetailsModal,
    openShareLinkModal,
    openLinkSettingsModal,
    openDeleteConfirmationModal,
  } = modalStore;

  // Individual action handlers
  const handleCopyLink = useCallback(async () => {
    try {
      // Generate the full URL from slug and topic
      const baseUrl = window.location.origin; // or use your app's base URL
      const linkUrl = generateFullUrl(baseUrl, link.slug, link.topic);
      await navigator.clipboard.writeText(linkUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  }, [link.slug, link.topic, link.id]);

  const handleShare = useCallback(() => {
    openShareLinkModal(link);
  }, [openShareLinkModal, link]);

  const handleViewDetails = useCallback(() => {
    openLinkDetailsModal(link);
  }, [openLinkDetailsModal, link]);

  const handleSettings = useCallback(() => {
    openLinkSettingsModal(link);
  }, [openLinkSettingsModal, link]);

  const handleDelete = useCallback(() => {
    openDeleteConfirmationModal(link);
  }, [openDeleteConfirmationModal, link]);

  const handleOpenExternal = useCallback(() => {
    // Generate the full URL from slug and topic
    const baseUrl = window.location.origin; // or use your app's base URL
    const linkUrl = generateFullUrl(baseUrl, link.slug, link.topic);
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  }, [link.slug, link.topic, link.id]);

  // Memoized action arrays for different contexts - REMOVED copy and share from dropdown
  const dropdownActions = useMemo((): ActionItem[] => {
    const actions: ActionItem[] = [
      {
        id: 'view-details',
        label: 'View Details',
        onClick: () => {
          handleViewDetails();
        },
        icon: Eye,
      },
      {
        id: 'open-external',
        label: 'Open Link',
        onClick: () => {
          handleOpenExternal();
        },
        icon: ExternalLink,
      },
    ];

    // Add settings action if enabled
    if (showSettingsAction) {
      actions.push({
        id: 'settings',
        label: 'Settings',
        onClick: () => {
          handleSettings();
        },
        icon: Settings,
      });
    }

    // Add delete action if enabled and not a base link
    if (showDeleteAction && !isBaseLink) {
      actions.push({
        id: 'delete',
        label: 'Delete Link',
        onClick: () => {
          handleDelete();
        },
        icon: Trash2,
        variant: 'destructive' as const,
      });
    }

    return actions;
  }, [
    handleViewDetails,
    handleOpenExternal,
    handleSettings,
    handleDelete,
    showSettingsAction,
    showDeleteAction,
    isBaseLink,
    link.id,
  ]);

  // Quick actions for desktop cards (shown as buttons) - These will be positioned in bottom left
  const quickActions = useMemo(
    (): ActionItem[] => [
      {
        id: 'copy',
        label: 'Copy Link',
        onClick: () => {
          handleCopyLink();
        },
        icon: Copy,
      },
      {
        id: 'share',
        label: 'Share',
        onClick: () => {
          handleShare();
        },
        icon: Share2,
      },
    ],
    [handleCopyLink, handleShare]
  );

  // Mobile-optimized actions (touch-friendly)
  const mobileActions = useMemo(
    (): ActionItem[] => [
      {
        id: 'view-details',
        label: 'View Details',
        onClick: () => {
          handleViewDetails();
        },
        icon: Eye,
      },
      {
        id: 'open-external',
        label: 'Open Link',
        onClick: () => {
          handleOpenExternal();
        },
        icon: ExternalLink,
      },
      ...(showSettingsAction
        ? [
            {
              id: 'settings',
              label: 'Settings',
              onClick: () => {
                handleSettings();
              },
              icon: Settings,
            },
          ]
        : []),
      ...(showDeleteAction && !isBaseLink
        ? [
            {
              id: 'delete',
              label: 'Delete Link',
              onClick: () => {
                handleDelete();
              },
              icon: Trash2,
              variant: 'destructive' as const,
            },
          ]
        : []),
    ],
    [
      handleViewDetails,
      handleOpenExternal,
      handleSettings,
      handleDelete,
      showSettingsAction,
      showDeleteAction,
      isBaseLink,
    ]
  );

  console.log('🔧 useLinkCardActions - Returning actions:', {
    dropdownActions: dropdownActions.length,
    quickActions: quickActions.length,
    mobileActions: mobileActions.length,
  });

  return {
    // Individual handlers
    handleCopyLink,
    handleShare,
    handleViewDetails,
    handleSettings,
    handleDelete,
    handleOpenExternal,

    // Action arrays
    dropdownActions,
    quickActions,
    mobileActions,
  };
};

export default useLinkCardActions;
