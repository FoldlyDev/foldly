'use client';

import { memo } from 'react';
import { Copy, Share2, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useLinkCardStore } from '../../hooks/use-links-composite';
import { LinkCardMobile } from './LinkCardMobile';
import { LinkCardDesktop } from './LinkCardDesktop';
import { LinkCardGrid } from './LinkCardGrid';
import type { LinkId } from '@/types';

interface LinkCardProps {
  linkId: LinkId;
  view: 'grid' | 'list';
  index: number;
  searchQuery?: string;
}

const LinkCardComponent = ({
  linkId,
  view,
  index,
  searchQuery = '',
}: LinkCardProps) => {
  const isMobile = useIsMobile();
  const { link, isLoading, isSelected, isMultiSelectMode, computed } =
    useLinkCardStore(linkId);

  // Handle loading state
  if (isLoading || !link || !computed) {
    return (
      <div className='p-4 bg-gray-100 rounded-lg animate-pulse'>
        <div className='h-4 bg-gray-300 rounded mb-2'></div>
        <div className='h-4 bg-gray-300 rounded w-2/3'></div>
      </div>
    );
  }

  // Grid view - same for mobile and desktop
  if (view === 'grid') {
    return (
      <LinkCardGrid
        link={link}
        index={index}
        isBaseLink={computed.isBaseLink}
        formattedDate={computed.formattedDate}
        isMultiSelected={isSelected}
        onOpenDetails={computed.handleViewDetails}
        onMultiSelect={computed.handleToggleSelection}
        searchQuery={searchQuery}
        actions={computed.dropdownActions}
        quickActions={computed.quickActions}
      />
    );
  }

  // List view - different layouts for mobile vs desktop
  if (isMobile) {
    return (
      <LinkCardMobile
        link={link}
        index={index}
        isBaseLink={computed.isBaseLink}
        formattedDate={computed.formattedDate}
        isMultiSelected={isSelected}
        onOpenDetails={computed.handleViewDetails}
        actions={computed.dropdownActions}
        quickActions={computed.quickActions}
        searchQuery={searchQuery}
      />
    );
  }

  return (
    <LinkCardDesktop
      link={link}
      index={index}
      isBaseLink={computed.isBaseLink}
      formattedDate={computed.formattedDate}
      isMultiSelectMode={isMultiSelectMode}
      isMultiSelected={isSelected}
      onOpenDetails={computed.handleViewDetails}
      onCopyLink={computed.handleCopyLink}
      onShare={computed.handleShare}
      onSelectionChange={(linkId: string, checked: boolean) => {
        if (checked) {
          computed.handleToggleSelection();
        }
      }}
      searchQuery={searchQuery}
      actions={computed.dropdownActions}
      quickActions={computed.quickActions}
    />
  );
};

// ✅ Memoized component to prevent unnecessary re-renders
// Only re-renders when linkId, view, or index change
export const LinkCard = memo(LinkCardComponent);
