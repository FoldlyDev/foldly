'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Link2,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  Clock,
  Share2,
  Globe,
  Copy,
  Settings,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { Checkbox } from '@/components/animate-ui';
import {
  StatusBadge,
  CopyButton,
  ActionButton,
  CardActionsMenu,
  defaultActions,
  type ActionItem,
} from '@/components/ui';
import type { LinkData } from '@/lib/hooks/use-dashboard-links';

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
}

export function LinkCard({
  link,
  view,
  index,
  onSelect,
  isSelected,
  onMultiSelect,
  isMultiSelected,
  onShare,
  onSettings,
  onDelete,
  onViewDetails,
}: LinkCardProps) {
  const router = useRouter();
  const linkUrl = `https://${link.url}`;
  const isBaseLink = link.linkType === 'base' || !link.topic;

  const handleViewFiles = () => {
    router.push(`/dashboard/files?link=${link.id}`);
  };

  const handleShare = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onShare?.(link.id);
  };

  const handleSettings = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSettings?.(link.id);
  };

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onViewDetails?.(link.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onDelete?.(link.id);
  };

  const handleCopyLink = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(linkUrl);
  };

  // Create actions for the dropdown menu - base links have different actions
  const actions: ActionItem[] = [
    defaultActions.viewFiles(handleViewFiles),
    defaultActions.details(handleViewDetails),
    defaultActions.settings(handleSettings),
    // Only add delete option for non-base links
    ...(isBaseLink ? [] : [defaultActions.delete(handleDelete)]),
  ];

  // Visibility indicator component
  const VisibilityIndicator = () => {
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          link.isPublic
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-orange-100 text-orange-800 border border-orange-200'
        }`}
        title={
          link.isPublic
            ? 'Public - Anyone can access'
            : 'Private - Restricted access'
        }
      >
        {link.isPublic ? (
          <Globe className='w-3 h-3' />
        ) : (
          <EyeOff className='w-3 h-3' />
        )}
        <span className='font-medium'>
          {link.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    );
  };

  // Status badge component
  const StatusIndicator = () => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            dotColor: 'bg-green-600',
            text: 'Active',
          };
        case 'paused':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            dotColor: 'bg-yellow-600',
            text: 'Paused',
          };
        case 'expired':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            dotColor: 'bg-red-600',
            text: 'Expired',
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            dotColor: 'bg-gray-600',
            text: 'Unknown',
          };
      }
    };

    const statusConfig = getStatusConfig(link.status);

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
      >
        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
        {statusConfig.text}
      </div>
    );
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`
          relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md 
          transition-all duration-300 overflow-hidden group
          ${isSelected ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}
        `}
      >
        {/* Multi-select checkbox - only for custom links */}
        {!isBaseLink && onMultiSelect && (
          <div className='absolute top-3 left-3 z-10'>
            <Checkbox
              checked={isMultiSelected || false}
              onCheckedChange={() => onMultiSelect(link.id)}
              className='data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
            />
          </div>
        )}

        {/* Three-dot menu */}
        <div className='absolute top-3 right-3 z-10'>
          <CardActionsMenu actions={actions} />
        </div>

        {/* Card Content */}
        <div className='p-6 cursor-pointer' onClick={() => onSelect?.(link.id)}>
          {/* Header with Link Info */}
          <div className='flex items-start justify-between gap-3 mb-4'>
            {/* Link Icon */}
            <div className='flex-shrink-0'>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Link2 className='w-5 h-5 text-blue-600' />
              </div>
            </div>

            {/* Link Details */}
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-gray-900 truncate mb-1'>
                {link.name}
              </h3>
              <p className='text-sm text-gray-700 truncate mb-2'>{link.url}</p>
              <div className='flex items-center gap-2'>
                <StatusIndicator />
                <VisibilityIndicator />
              </div>
            </div>
          </div>

          {/* Stats Section - Centered */}
          <div className='text-center mb-6'>
            <div className='flex items-center justify-center gap-1 text-gray-900 mb-1'>
              <FileText className='w-4 h-4 text-gray-600' />
              <span className='text-2xl font-bold'>{link.uploads}</span>
            </div>
            <p className='text-sm text-gray-700'>Uploads</p>

            {link.views !== undefined && (
              <div className='flex items-center justify-center gap-1 text-gray-800 mt-2'>
                <Eye className='w-3 h-3 text-gray-600' />
                <span className='text-sm font-medium'>{link.views}</span>
                <span className='text-sm text-gray-600'>Views</span>
              </div>
            )}

            {link.lastActivity && (
              <div className='flex items-center justify-center gap-1 text-gray-700 mt-1'>
                <Clock className='w-3 h-3 text-gray-500' />
                <span className='text-xs'>{link.lastActivity}</span>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
            {/* Quick Info */}
            <div className='text-xs text-gray-600'>
              Created {new Date(link.createdAt).toLocaleDateString()}
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
              <button
                onClick={handleCopyLink}
                className='p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors'
                title='Copy link'
              >
                <Copy className='w-4 h-4' />
              </button>

              <button
                onClick={handleShare}
                className='p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors'
                title='Share link'
              >
                <Share2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        group relative bg-white rounded-2xl p-6 border border-gray-200 
        shadow-sm hover:shadow-lg transition-all duration-300
        ${isMultiSelected ? 'ring-2 ring-purple-500 border-purple-500' : ''}
      `}
    >
      {/* Background Gradient */}
      <div
        className='absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 
                    rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isBaseLink
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg group-hover:shadow-xl group-hover:scale-105'
                    : 'bg-slate-100 group-hover:bg-slate-200'
                }`}
              >
                <Link2
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isBaseLink
                      ? 'text-white group-hover:scale-110'
                      : 'text-slate-600 group-hover:text-slate-700'
                  }`}
                />
              </div>
              <StatusIndicator />
              <VisibilityIndicator />
            </div>

            <div className='flex items-center gap-3 mb-1'>
              {/* Multi-select checkbox - Only show for custom links */}
              {onMultiSelect && !isBaseLink && (
                <div
                  onClick={e => e.stopPropagation()}
                  className='flex items-center'
                >
                  <Checkbox
                    checked={isMultiSelected || false}
                    onCheckedChange={() => onMultiSelect(link.id)}
                    className='data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                  />
                </div>
              )}
              <h3 className='font-bold text-slate-900 text-lg truncate flex-1 min-w-0'>
                {link.name}
              </h3>
            </div>

            <div className='flex items-center gap-1 text-slate-500 text-sm'>
              <span className='truncate'>{link.url}</span>
              <ExternalLink className='w-3 h-3 flex-shrink-0' />
            </div>
          </div>

          <CardActionsMenu actions={actions} />
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <FileText className='w-4 h-4 text-slate-500' />
              <span className='text-2xl font-bold text-slate-900'>
                {link.uploads}
              </span>
            </div>
            <div className='text-xs text-slate-500'>Uploads</div>
          </div>

          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Eye className='w-4 h-4 text-slate-500' />
              <span className='text-2xl font-bold text-slate-900'>
                {link.views}
              </span>
            </div>
            <div className='text-xs text-slate-500'>Views</div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
          <div className='flex items-center gap-1 text-xs text-slate-500'>
            <Clock className='w-3 h-3' />
            {link.lastActivity}
          </div>

          <div className='flex items-center gap-1'>
            <CopyButton
              value={linkUrl}
              size='icon'
              className='h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer'
            />

            <ActionButton
              variant='ghost'
              size='icon'
              motionType='subtle'
              onClick={handleShare}
              className='h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer'
              title='Share'
            >
              <Share2 className='w-4 h-4' />
            </ActionButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Example Base Dump Link for demonstration
export const exampleBaseDumpLink = {
  id: 'base-dump-001',
  name: 'My Base Dump Area',
  slug: 'yourname',
  url: 'foldly.com/yourname',
  status: 'active' as const,
  uploads: 247,
  views: 1205,
  lastActivity: '2 hours ago',
  expiresAt: '',
  createdAt: '2025-01-15T10:30:00Z',
  linkType: 'base' as const,
  topic: undefined,
  settings: {
    requireEmail: false,
    allowMultiple: true,
    maxFileSize: '100MB',
    customMessage: "Drop any files here - I'll organize them later!",
  },
};

// Example Custom Topic Link for demonstration
export const exampleTopicLink = {
  id: 'topic-headshots-001',
  name: 'Team Headshots Collection',
  slug: 'yourname',
  url: 'foldly.com/yourname/team-headshots',
  status: 'active' as const,
  uploads: 8,
  views: 24,
  lastActivity: '1 day ago',
  expiresAt: '2025-02-15T23:59:59Z',
  createdAt: '2025-01-10T14:20:00Z',
  linkType: 'custom' as const,
  topic: 'team-headshots',
  settings: {
    requireEmail: true,
    allowMultiple: false,
    maxFileSize: '50MB',
    customMessage: 'Please upload high-res headshots (minimum 1200x1200px)',
  },
};
