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
}: LinkCardProps) {
  const router = useRouter();
  const linkUrl = `https://${link.url}`;
  const isBaseLink = link.linkType === 'base' || !link.topic;

  const handleViewFiles = () => {
    router.push(`/dashboard/files?link=${link.id}`);
  };

  // Create actions for the dropdown menu (no duplicates from card body)
  const actions: ActionItem[] = [
    defaultActions.viewFiles(handleViewFiles),
    defaultActions.settings(() => onSettings?.(link.id)),
    defaultActions.details(() => onSelect(link.id)),
    defaultActions.delete(() => onDelete?.(link.id)),
  ];

  // Visibility indicator component
  const VisibilityIndicator = () => {
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          link.isPublic
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-orange-100 text-orange-700'
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
        <span className='font-semibold'>
          {link.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    );
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`
          group bg-white rounded-xl p-4 border border-[var(--neutral-200)] 
          hover:shadow-md transition-all duration-300
          ${isMultiSelected ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : ''}
        `}
      >
        <div className='flex items-center justify-between'>
          {/* Left Section */}
          <div className='flex items-center gap-4 flex-1 min-w-0'>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isBaseLink
                  ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] shadow-lg group-hover:shadow-xl group-hover:scale-105'
                  : 'bg-[var(--secondary-subtle)] group-hover:bg-[var(--secondary-subtle-hover)]'
              }`}
            >
              <Link2
                className={`w-6 h-6 transition-transform duration-300 ${
                  isBaseLink
                    ? 'text-white group-hover:scale-110'
                    : 'text-[var(--secondary)] group-hover:text-[var(--secondary-dark)]'
                }`}
              />
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                {/* Multi-select checkbox - Only show for custom links (base links cannot be deleted) */}
                {onMultiSelect && !isBaseLink && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className='flex items-center'
                  >
                    <Checkbox
                      checked={isMultiSelected}
                      onCheckedChange={() => onMultiSelect(link.id)}
                      className='data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]'
                    />
                  </div>
                )}
                <h3 className='font-semibold text-[var(--quaternary)] truncate flex-1 min-w-0'>
                  {link.name}
                </h3>
                <StatusBadge
                  status={link.status as 'active' | 'paused' | 'expired'}
                  size='sm'
                  variant='dot'
                  className='flex-shrink-0'
                />
                <VisibilityIndicator />
              </div>
              <p className='text-[var(--neutral-500)] text-sm truncate'>
                {link.url}
              </p>
            </div>
          </div>

          {/* Stats - Hidden on mobile, shown on tablet+ */}
          <div className='hidden md:flex items-center gap-6 mr-4'>
            <div className='text-center'>
              <div className='text-lg font-bold text-[var(--quaternary)]'>
                {link.uploads}
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>Uploads</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-[var(--quaternary)]'>
                {link.views}
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>Views</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-[var(--neutral-600)]'>
                {link.lastActivity}
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>
                Last activity
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-1'>
            <CopyButton
              value={linkUrl}
              size='icon'
              className='h-8 w-8 text-[var(--neutral-500)] hover:text-[var(--quaternary)] cursor-pointer'
            />

            {/* Mobile: Show individual buttons, Desktop: Show dropdown */}
            <div className='hidden sm:block'>
              <CardActionsMenu actions={actions} />
            </div>

            {/* Mobile actions - individual buttons */}
            <div className='flex sm:hidden gap-1'>
              <ActionButton
                variant='ghost'
                size='icon'
                motionType='subtle'
                onClick={e => {
                  e.stopPropagation();
                  onShare?.(link.id);
                }}
                className='h-8 w-8 text-[var(--neutral-500)] hover:text-[var(--quaternary)] cursor-pointer'
              >
                <Share2 className='w-4 h-4' />
              </ActionButton>
              <CardActionsMenu actions={actions} />
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
        group relative bg-white rounded-2xl p-6 border border-[var(--neutral-200)] 
        shadow-sm hover:shadow-lg transition-all duration-300
        ${isMultiSelected ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : ''}
      `}
    >
      {/* Background Gradient */}
      <div
        className='absolute inset-0 bg-gradient-to-br from-white via-white to-[var(--neutral-50)] 
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
                    ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] shadow-lg group-hover:shadow-xl group-hover:scale-105'
                    : 'bg-[var(--secondary-subtle)] group-hover:bg-[var(--secondary-subtle-hover)]'
                }`}
              >
                <Link2
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isBaseLink
                      ? 'text-white group-hover:scale-110'
                      : 'text-[var(--secondary)] group-hover:text-[var(--secondary-dark)]'
                  }`}
                />
              </div>
              <StatusBadge
                status={link.status as 'active' | 'paused' | 'expired'}
                size='sm'
                variant='dot'
              />
              <VisibilityIndicator />
            </div>

            <div className='flex items-center gap-3 mb-1'>
              {/* Multi-select checkbox - Only show for custom links (base links cannot be deleted) */}
              {onMultiSelect && !isBaseLink && (
                <div
                  onClick={e => e.stopPropagation()}
                  className='flex items-center'
                >
                  <Checkbox
                    checked={isMultiSelected}
                    onCheckedChange={() => onMultiSelect(link.id)}
                    className='data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]'
                  />
                </div>
              )}
              <h3 className='font-bold text-[var(--quaternary)] text-lg truncate flex-1 min-w-0'>
                {link.name}
              </h3>
            </div>

            <div className='flex items-center gap-1 text-[var(--neutral-500)] text-sm'>
              <span className='truncate'>{link.url}</span>
              <ExternalLink className='w-3 h-3 flex-shrink-0' />
            </div>
          </div>

          <CardActionsMenu actions={actions} />
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
              <span className='text-2xl font-bold text-[var(--quaternary)]'>
                {link.uploads}
              </span>
            </div>
            <div className='text-xs text-[var(--neutral-500)]'>Uploads</div>
          </div>

          <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Eye className='w-4 h-4 text-[var(--neutral-500)]' />
              <span className='text-2xl font-bold text-[var(--quaternary)]'>
                {link.views}
              </span>
            </div>
            <div className='text-xs text-[var(--neutral-500)]'>Views</div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t border-[var(--neutral-100)]'>
          <div className='flex items-center gap-1 text-xs text-[var(--neutral-500)]'>
            <Clock className='w-3 h-3' />
            {link.lastActivity}
          </div>

          <div className='flex items-center gap-1'>
            <CopyButton
              value={linkUrl}
              size='icon'
              className='h-7 w-7 text-[var(--neutral-500)] hover:text-[var(--quaternary)] cursor-pointer'
            />

            <ActionButton
              variant='ghost'
              size='icon'
              motionType='subtle'
              onClick={e => {
                e.stopPropagation();
                onShare?.(link.id);
              }}
              className='h-7 w-7 text-[var(--neutral-500)] hover:text-[var(--quaternary)] cursor-pointer'
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
