'use client';

import React from 'react';
import { Button } from '@/components/ui/core/shadcn/button';
import { Upload } from 'lucide-react';
import { useLinkUI } from '../../hooks/use-link-ui';
import type { LinkWithOwner } from '../../types';

interface UploadActionsProps {
  linkData: LinkWithOwner;
  hasStaged: boolean;
  stagedItemCount: number;
  isUploading: boolean;
  uploadProgress?: {
    completed: number;
    total: number;
    currentItem?: string;
  };
  onMainUpload: () => void;
}

export function UploadActions({
  linkData,
  hasStaged,
  stagedItemCount,
  isUploading,
  uploadProgress,
  onMainUpload,
}: UploadActionsProps) {
  const { openUploadModal } = useLinkUI();
  const brandColor = linkData.branding?.enabled && linkData.branding?.color ? linkData.branding.color : '#3b82f6';

  return (
    <>
      {/* Main Upload Button - Only show when there are staged items */}
      {hasStaged && (
        <Button
          onClick={onMainUpload}
          disabled={isUploading}
          data-upload-trigger
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
          style={{
            background: linkData.branding?.enabled && linkData.branding?.color && !isUploading
              ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
              : undefined
          }}
        >
          {isUploading ? (
            <>
              <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              <span>
                {uploadProgress?.currentItem 
                  ? uploadProgress.currentItem 
                  : `Uploading (${uploadProgress?.completed || 0}/${uploadProgress?.total || 0})`
                }
              </span>
            </>
          ) : (
            <>
              <Upload className='h-4 w-4' />
              <span>Upload {stagedItemCount} Item{stagedItemCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </Button>
      )}
      
      {/* Add Files button */}
      <Button
        onClick={() => openUploadModal(linkData.id)}
        variant={hasStaged ? "outline" : "default"}
        className={hasStaged ? "gap-2" : "gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"}
        style={{
          background: linkData.branding?.enabled && linkData.branding?.color && !hasStaged
            ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
            : undefined
        }}
      >
        <Upload className='h-4 w-4' />
        Add Files
      </Button>
    </>
  );
}