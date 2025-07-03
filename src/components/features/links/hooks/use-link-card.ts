'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { LinkData } from '../types';
import type { ActionItem } from '@/components/ui/types';
import { defaultActions } from '@/components/ui';

interface LinkCardProps {
  link: LinkData;
  view: 'grid' | 'list';
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onMultiSelect?: (linkId: string) => void;
  isMultiSelected?: boolean;
  onShare?: (linkId: string) => void;
  onSettings?: (linkId: string) => void;
  onDelete?: (linkId: string) => void;
  onViewDetails?: (linkId: string) => void;
  onOpenDetails?: (link: LinkData) => void;
  onSelectionChange?: (linkId: string, checked: boolean) => void;
  isMultiSelectMode?: boolean;
}

export function useLinkCard({
  link,
  onShare,
  onSettings,
  onDelete,
  onViewDetails,
  onOpenDetails,
}: LinkCardProps) {
  const router = useRouter();
  const [isMobileActionMenuOpen, setIsMobileActionMenuOpen] = useState(false);

  // Computed values
  const linkUrl = `https://${link.url}`;
  const isBaseLink = link.linkType === 'base' || !link.topic;

  // Helper function to copy text to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard:', text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  // Helper function to handle sharing
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: link.name,
        url: link.url,
      });
    } else {
      copyToClipboard(link.url);
    }
  }, [link.name, link.url, copyToClipboard]);

  // Helper function to handle copy link
  const handleCopyLink = useCallback(() => {
    copyToClipboard(link.url);
  }, [link.url, copyToClipboard]);

  // Optimized handlers with useCallback to prevent unnecessary re-renders
  const handleViewFiles = useCallback(() => {
    router.push(`/dashboard/files?link=${link.id}`);
  }, [router, link.id]);

  const handleSettings = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      onSettings?.(link.id);
    },
    [onSettings, link.id]
  );

  const handleViewDetails = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      onViewDetails?.(link.id);
    },
    [onViewDetails, link.id]
  );

  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      onDelete?.(link.id);
    },
    [onDelete, link.id]
  );

  const handleOpenDetails = useCallback(() => {
    onOpenDetails?.(link);
  }, [onOpenDetails, link]);

  // Memoized actions array to prevent unnecessary re-renders
  const actions = useMemo(
    () => [
      defaultActions.details(() => onViewDetails?.(link.id)),
      defaultActions.copy(() => copyToClipboard(link.url)),
      defaultActions.share(() => handleShare()),
      defaultActions.settings(() => onSettings?.(link.id)),
      defaultActions.delete(() => onDelete?.(link.id)),
    ],
    [
      onViewDetails,
      copyToClipboard,
      link.url,
      link.id,
      handleShare,
      onSettings,
      onDelete,
    ]
  );

  // Helper function to format dates safely
  const formatDate = useCallback(
    (dateInput: string | Date | undefined): string => {
      if (!dateInput) return 'No date';

      try {
        const date =
          typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'No date';
        }

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        });
      } catch (error) {
        return 'No date';
      }
    },
    []
  );

  const formattedDate = formatDate(link.createdAt);

  return {
    // State
    isMobileActionMenuOpen,
    setIsMobileActionMenuOpen,

    // Computed values
    linkUrl,
    isBaseLink,
    formattedDate,

    // Handlers
    handleViewFiles,
    handleShare,
    handleCopyLink,
    handleSettings,
    handleViewDetails,
    handleDelete,
    handleOpenDetails,
    copyToClipboard,

    // Memoized data
    actions,
  };
}
