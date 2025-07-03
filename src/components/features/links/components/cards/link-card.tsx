'use client';

import { memo } from 'react';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useLinkCard } from '../../hooks/use-link-card';
import { LinkCardMobile } from './link-card-mobile';
import { LinkCardDesktop } from './link-card-desktop';
import { LinkCardGrid } from './link-card-grid';
import type { LinkData } from '../../types';

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

const LinkCardComponent = (props: LinkCardProps) => {
  const {
    link,
    view,
    index,
    isMultiSelected,
    onMultiSelect,
    onSelectionChange,
    isMultiSelectMode,
  } = props;

  const isMobile = useIsMobile();
  const linkCardData = useLinkCard(props);

  // Grid view - same for mobile and desktop
  if (view === 'grid') {
    return (
      <LinkCardGrid
        link={link}
        index={index}
        isBaseLink={linkCardData.isBaseLink}
        formattedDate={linkCardData.formattedDate}
        isMultiSelected={isMultiSelected}
        onOpenDetails={linkCardData.handleOpenDetails}
        onMultiSelect={onMultiSelect}
        actions={linkCardData.actions}
      />
    );
  }

  // List view - different layouts for mobile vs desktop
  if (isMobile) {
    return (
      <LinkCardMobile
        link={link}
        index={index}
        isBaseLink={linkCardData.isBaseLink}
        formattedDate={linkCardData.formattedDate}
        isMultiSelected={isMultiSelected}
        onOpenDetails={linkCardData.handleOpenDetails}
        onCopyLink={linkCardData.handleCopyLink}
        onShare={linkCardData.handleShare}
        onViewDetails={linkCardData.handleViewDetails}
        onDelete={linkCardData.handleDelete}
        isMobileActionMenuOpen={linkCardData.isMobileActionMenuOpen}
        setIsMobileActionMenuOpen={linkCardData.setIsMobileActionMenuOpen}
      />
    );
  }

  return (
    <LinkCardDesktop
      link={link}
      index={index}
      isBaseLink={linkCardData.isBaseLink}
      formattedDate={linkCardData.formattedDate}
      isMultiSelectMode={isMultiSelectMode}
      isMultiSelected={isMultiSelected}
      onOpenDetails={linkCardData.handleOpenDetails}
      onCopyLink={linkCardData.handleCopyLink}
      onShare={linkCardData.handleShare}
      onSelectionChange={onSelectionChange}
      actions={linkCardData.actions}
    />
  );
};

// ✅ Memoized component to prevent unnecessary re-renders
// Only re-renders when props actually change
export const LinkCard = memo(LinkCardComponent);
