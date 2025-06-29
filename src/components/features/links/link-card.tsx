'use client';

import { motion } from 'framer-motion';
import {
  Link2,
  Eye,
  FileText,
  Copy,
  Settings,
  MoreHorizontal,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Share2,
} from 'lucide-react';
import { useState } from 'react';

interface LinkCardProps {
  link: {
    id: string;
    name: string;
    slug: string;
    url: string;
    status: 'active' | 'paused' | 'expired';
    uploads: number;
    views: number;
    lastActivity: string;
    expiresAt: string;
    createdAt: string;
    settings: {
      requireEmail: boolean;
      allowMultiple: boolean;
      maxFileSize: string;
      customMessage: string;
    };
  };
  view: 'grid' | 'list';
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onMultiSelect?: (linkId: string) => void;
  isMultiSelected?: boolean;
  onShare?: (linkId: string) => void;
  onSettings?: (linkId: string) => void;
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
}: LinkCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-50',
          text: 'Active',
          dotColor: 'bg-green-500',
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-yellow-600 bg-yellow-50',
          text: 'Paused',
          dotColor: 'bg-yellow-500',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          color: 'text-red-600 bg-red-50',
          text: 'Expired',
          dotColor: 'bg-red-500',
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-gray-600 bg-gray-50',
          text: 'Unknown',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const statusConfig = getStatusConfig(link.status);
  const StatusIcon = statusConfig.icon;

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
        onClick={() => onSelect(link.id)}
      >
        <div className='flex items-center justify-between'>
          {/* Left Section */}
          <div className='flex items-center gap-4 flex-1'>
            <div className='w-12 h-12 bg-[var(--primary-subtle)] rounded-xl flex items-center justify-center'>
              <Link2 className='w-6 h-6 text-[var(--primary)]' />
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                {/* Multi-select checkbox beside title in list view */}
                {onMultiSelect && (
                  <input
                    type='checkbox'
                    checked={isMultiSelected}
                    onChange={e => {
                      e.stopPropagation();
                      onMultiSelect(link.id);
                    }}
                    className='w-4 h-4 text-[var(--primary)] bg-white border-[var(--neutral-300)] rounded focus:ring-[var(--primary)] focus:ring-2 shadow-sm'
                  />
                )}
                <h3 className='font-semibold text-[var(--quaternary)] truncate'>
                  {link.name}
                </h3>
                <div
                  className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${statusConfig.color}
                `}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
                  />
                  {statusConfig.text}
                </div>
              </div>
              <p className='text-[var(--neutral-500)] text-sm truncate'>
                {link.url}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className='flex items-center gap-6 mr-4'>
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
          <div className='flex items-center gap-2'>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                handleCopyUrl();
              }}
              className='p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors'
            >
              {copied ? (
                <CheckCircle className='w-4 h-4 text-green-600' />
              ) : (
                <Copy className='w-4 h-4 text-[var(--neutral-500)]' />
              )}
            </motion.button>

            <div className='relative'>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={e => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className='p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors'
              >
                <MoreHorizontal className='w-4 h-4 text-[var(--neutral-500)]' />
              </motion.button>

              {/* Dropdown Menu */}
              {showActions && (
                <>
                  <div
                    className='fixed inset-0 z-10'
                    onClick={() => setShowActions(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--neutral-200)] z-20'
                  >
                    <div className='py-2'>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onShare?.(link.id);
                          setShowActions(false);
                        }}
                        className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3'
                      >
                        <Share2 className='w-4 h-4 text-[var(--neutral-500)]' />
                        <span className='text-sm text-[var(--neutral-700)]'>
                          Share Link
                        </span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSettings?.(link.id);
                          setShowActions(false);
                        }}
                        className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3'
                      >
                        <Settings className='w-4 h-4 text-[var(--neutral-500)]' />
                        <span className='text-sm text-[var(--neutral-700)]'>
                          Settings
                        </span>
                      </button>
                      <div className='h-px bg-[var(--neutral-200)] my-2' />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowActions(false);
                        }}
                        className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3 text-red-600'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                        <span className='text-sm'>Delete Link</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
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
      onClick={() => onSelect(link.id)}
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
              <div className='w-10 h-10 bg-[var(--primary-subtle)] rounded-lg flex items-center justify-center'>
                <Link2 className='w-5 h-5 text-[var(--primary)]' />
              </div>
              <div
                className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                ${statusConfig.color}
              `}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
                />
                {statusConfig.text}
              </div>
            </div>

            <div className='flex items-center gap-3 mb-1'>
              {/* Multi-select checkbox beside title */}
              {onMultiSelect && (
                <input
                  type='checkbox'
                  checked={isMultiSelected}
                  onChange={e => {
                    e.stopPropagation();
                    onMultiSelect(link.id);
                  }}
                  className='w-4 h-4 text-[var(--primary)] bg-white border-[var(--neutral-300)] rounded focus:ring-[var(--primary)] focus:ring-2 shadow-sm'
                />
              )}
              <h3 className='font-bold text-[var(--quaternary)] text-lg truncate'>
                {link.name}
              </h3>
            </div>

            <div className='flex items-center gap-1 text-[var(--neutral-500)] text-sm'>
              <span className='truncate'>{link.url}</span>
              <ExternalLink className='w-3 h-3 flex-shrink-0' />
            </div>
          </div>

          <div className='relative'>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className='p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors'
            >
              <MoreHorizontal className='w-4 h-4 text-[var(--neutral-500)]' />
            </motion.button>

            {/* Dropdown Menu for Grid View */}
            {showActions && (
              <>
                <div
                  className='fixed inset-0 z-10'
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--neutral-200)] z-20'
                >
                  <div className='py-2'>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onShare?.(link.id);
                        setShowActions(false);
                      }}
                      className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3'
                    >
                      <Share2 className='w-4 h-4 text-[var(--neutral-500)]' />
                      <span className='text-sm text-[var(--neutral-700)]'>
                        Share Link
                      </span>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSettings?.(link.id);
                        setShowActions(false);
                      }}
                      className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3'
                    >
                      <Settings className='w-4 h-4 text-[var(--neutral-500)]' />
                      <span className='text-sm text-[var(--neutral-700)]'>
                        Settings
                      </span>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelect(link.id);
                        setShowActions(false);
                      }}
                      className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3'
                    >
                      <svg
                        className='w-4 h-4 text-[var(--neutral-500)]'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      <span className='text-sm text-[var(--neutral-700)]'>
                        View Details
                      </span>
                    </button>
                    <div className='h-px bg-[var(--neutral-200)] my-2' />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Add delete functionality here
                        setShowActions(false);
                      }}
                      className='w-full text-left px-4 py-2 hover:bg-[var(--neutral-50)] transition-colors flex items-center gap-3 text-red-600'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                      <span className='text-sm'>Delete Link</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                handleCopyUrl();
              }}
              className='p-1.5 rounded-md hover:bg-[var(--neutral-100)] transition-colors'
              title='Copy link'
            >
              {copied ? (
                <CheckCircle className='w-4 h-4 text-green-600' />
              ) : (
                <Copy className='w-4 h-4 text-[var(--neutral-500)]' />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                onShare?.(link.id);
              }}
              className='p-1.5 rounded-md hover:bg-[var(--neutral-100)] transition-colors'
              title='Share'
            >
              <Share2 className='w-4 h-4 text-[var(--neutral-500)]' />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                onSettings?.(link.id);
              }}
              className='p-1.5 rounded-md hover:bg-[var(--neutral-100)] transition-colors'
              title='Settings'
            >
              <Settings className='w-4 h-4 text-[var(--neutral-500)]' />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
